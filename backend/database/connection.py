import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

DATABASE_NAME = os.getenv("DATABASE_NAME", "aura_data_intelligence")

_client = None
_database = None


def get_database():
    """
    Return the MongoDB database, creating the client on first use.
    """

    global _client, _database

    if _database is None:
        mongodb_url = os.getenv("MONGODB_URL")

        if not mongodb_url:
            raise RuntimeError(
                "MONGODB_URL is not configured. "
                "Copy backend/.env.example to backend/.env and set it."
            )

        _client = AsyncIOMotorClient(mongodb_url)
        _database = _client[DATABASE_NAME]

    return _database


def set_database(database) -> None:
    """
    Replace the database (used by tests with an in-memory MongoDB).
    """

    global _database

    _database = database


async def connect_to_mongodb():
    database = get_database()

    await database.command("ping")

    await database["users"].create_index("email", unique=True)
    await database["datasets"].create_index("dataset_id", unique=True)
    await database["datasets"].create_index("owner_id")

    print("MongoDB connected successfully")


async def close_mongodb_connection():
    if _client is not None:
        _client.close()
        print("MongoDB connection closed")
