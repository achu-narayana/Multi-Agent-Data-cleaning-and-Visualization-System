import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database.connection import get_database


load_dotenv()

JWT_ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(
    hours=int(os.getenv("JWT_EXPIRES_HOURS", "24"))
)
PASSWORD_ITERATIONS = 310_000

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    # Tokens signed with a random secret stop working on restart,
    # which is acceptable for local development only.
    JWT_SECRET = secrets.token_urlsafe(32)
    print(
        "WARNING: JWT_SECRET is not set; using a temporary secret. "
        "Users will be logged out when the server restarts."
    )


bearer_scheme = HTTPBearer(auto_error=False)


def users_collection():
    return get_database()["users"]


# ---------------------------------------------------------
# Passwords
# ---------------------------------------------------------

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )

    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        _, iterations, salt_hex, digest_hex = stored_hash.split("$")
    except ValueError:
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_hex),
        int(iterations),
    )

    return hmac.compare_digest(digest.hex(), digest_hex)


# ---------------------------------------------------------
# Tokens
# ---------------------------------------------------------

def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)

    return jwt.encode(
        {
            "sub": user_id,
            "iat": now,
            "exp": now + TOKEN_LIFETIME,
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "Data Analyst"),
    }


# ---------------------------------------------------------
# Users
# ---------------------------------------------------------

def normalize_email(email: str) -> str:
    return email.strip().lower()


async def create_user(name: str, email: str, password: str) -> dict:
    email = normalize_email(email)

    if await users_collection().find_one({"email": email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    user = {
        "id": str(uuid.uuid4()),
        "name": name.strip(),
        "email": email,
        "role": "Data Analyst",
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc),
    }

    await users_collection().insert_one(dict(user))

    return user


async def authenticate_user(email: str, password: str) -> dict:
    user = await users_collection().find_one(
        {"email": normalize_email(email)}
    )

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency: return the logged-in user or raise 401.
    """

    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        raise unauthorized

    user = await users_collection().find_one(
        {"id": payload.get("sub")},
        {"_id": 0},
    )

    if not user:
        raise unauthorized

    return user
