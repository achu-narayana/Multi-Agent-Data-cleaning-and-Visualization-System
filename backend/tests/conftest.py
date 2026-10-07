import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture(autouse=True)
def no_gemini(monkeypatch):
    # Tests must never call the real Gemini API.
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)


@pytest.fixture
def client(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from mongomock_motor import AsyncMongoMockClient

    import routes.dataset as dataset_routes
    from database import connection
    from services import dataset_store

    for module in (dataset_store, dataset_routes):
        monkeypatch.setattr(module, "UPLOAD_DIR", tmp_path / "uploads")
        monkeypatch.setattr(module, "CLEANED_DIR", tmp_path / "cleaned")

    (tmp_path / "uploads").mkdir()
    (tmp_path / "cleaned").mkdir()

    connection.set_database(AsyncMongoMockClient()["test"])

    from main import app

    # Not used as a context manager, so the MongoDB ping in the
    # lifespan handler doesn't run.
    yield TestClient(app)

    connection.set_database(None)


@pytest.fixture
def auth_headers(client):
    response = client.post(
        "/auth/register",
        json={
            "fullName": "Test User",
            "email": "test@example.com",
            "password": "secret123",
        },
    )
    assert response.status_code == 200, response.text

    return {"Authorization": f"Bearer {response.json()['token']}"}
