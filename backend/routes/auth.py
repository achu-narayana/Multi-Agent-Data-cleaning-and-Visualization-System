from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from services.auth_service import (
    authenticate_user,
    create_access_token,
    create_user,
    get_current_user,
    public_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


class RegisterRequest(BaseModel):
    fullName: str = Field(min_length=1, max_length=100)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


def auth_response(user: dict) -> dict:
    return {
        "user": public_user(user),
        "token": create_access_token(user["id"]),
    }


@router.post("/register")
async def register(payload: RegisterRequest):

    user = await create_user(
        name=payload.fullName,
        email=payload.email,
        password=payload.password,
    )

    return auth_response(user)


@router.post("/login")
async def login(payload: LoginRequest):

    user = await authenticate_user(payload.email, payload.password)

    return auth_response(user)


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):

    return public_user(user)
