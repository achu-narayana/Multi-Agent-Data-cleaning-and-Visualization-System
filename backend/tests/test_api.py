import io

import pandas as pd


CSV = (
    "Employee_ID,Name,Department,Age,Salary\n"
    "1,Ananya,IT,25,50000\n"
    "2,Rahul,it,,60000\n"
    "3,Priya,HR,200,55000\n"
    "3,Priya,HR,200,55000\n"
    "4,Arjun,Finance,35,65000\n"
)


def upload(client, headers, content=CSV, name="employees.csv"):
    return client.post(
        "/datasets/upload",
        files={"file": (name, io.BytesIO(content.encode()), "text/csv")},
        headers=headers,
    )


def test_endpoints_require_auth(client):
    assert client.get("/datasets").status_code == 401
    assert client.get("/auth/me").status_code == 401
    assert client.post("/chat", json={"message": "hi"}).status_code == 401


def test_register_login_me(client, auth_headers):
    me = client.get("/auth/me", headers=auth_headers).json()
    assert me["email"] == "test@example.com"

    bad = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "wrong"},
    )
    assert bad.status_code == 401

    good = client.post(
        "/auth/login",
        json={"email": "TEST@example.com", "password": "secret123"},
    )
    assert good.status_code == 200

    duplicate = client.post(
        "/auth/register",
        json={"fullName": "X", "email": "test@example.com", "password": "secret123"},
    )
    assert duplicate.status_code == 400


def test_upload_validation(client, auth_headers):
    assert upload(client, auth_headers, name="data.txt").status_code == 400
    assert upload(client, auth_headers, content="").status_code == 400


def test_full_processing_flow(client, auth_headers):
    response = upload(client, auth_headers)
    assert response.status_code == 200, response.text
    body = response.json()
    dataset_id = body["dataset_id"]
    assert body["dataset"]["name"] == "employees.csv"
    assert body["dataset"]["rowCount"] == 5
    assert body["dataset"]["status"] == "raw"

    listing = client.get("/datasets", headers=auth_headers).json()
    assert [d["id"] for d in listing] == [dataset_id]

    profile = client.get(
        f"/datasets/{dataset_id}/profile", headers=auth_headers
    ).json()
    assert profile["profile"]["dataset"]["rows"] == 5

    # A partial id must not match.
    partial = client.get(
        f"/datasets/{dataset_id[:4]}/profile", headers=auth_headers
    )
    assert partial.status_code == 404

    result = client.post(f"/datasets/{dataset_id}/process", headers=auth_headers)
    assert result.status_code == 200, result.text
    result = result.json()

    assert result["filename"] == "employees.csv"
    assert result["validation"]["checks"]["business_rules"]["status"] == "FAIL"
    assert result["original_quality_score"] < result["quality_score"]
    assert result["insights"]["status"] == "error"  # no Gemini key in tests
    assert result["agents"][0]["type"] == "profiling"
    assert "removed_duplicate" in {row["changeType"] for row in result["before_after"]}
    assert result["dataset"]["status"] == "cleaned"

    stored = client.get(f"/datasets/{dataset_id}/result", headers=auth_headers).json()
    assert stored["quality_score"] == result["quality_score"]

    preview = client.get(
        f"/datasets/{dataset_id}/preview?limit=10", headers=auth_headers
    ).json()
    assert preview["source"] == "cleaned"
    assert len(preview["rows"]) == 4
    assert {row["Department"] for row in preview["rows"]} == {"IT", "HR", "Finance"}

    download = client.get(f"/datasets/{dataset_id}/download", headers=auth_headers)
    assert download.status_code == 200
    assert "cleaned_employees.csv" in download.headers["content-disposition"]
    assert len(pd.read_csv(io.BytesIO(download.content))) == 4

    analytics = client.get(f"/analytics/{dataset_id}", headers=auth_headers).json()
    assert analytics["datasetId"] == dataset_id
    assert any(s["column"] == "Salary" for s in analytics["descriptiveStats"])

    charts = client.get(f"/visualizations/{dataset_id}", headers=auth_headers).json()
    assert charts and all("chartType" in c for c in charts)

    assert client.get(f"/insights/{dataset_id}", headers=auth_headers).json() == []

    agents = client.get("/agents/performance", headers=auth_headers).json()
    assert len(agents) == 8

    deleted = client.delete(f"/datasets/{dataset_id}", headers=auth_headers)
    assert deleted.json() == {"success": True}
    assert client.get(f"/datasets/{dataset_id}", headers=auth_headers).status_code == 404


def test_excel_upload_is_cleaned_to_csv(client, auth_headers, tmp_path):
    path = tmp_path / "data.xlsx"
    pd.read_csv(io.StringIO(CSV)).to_excel(path, index=False)

    response = client.post(
        "/datasets/upload",
        files={"file": ("data.xlsx", path.read_bytes())},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    dataset_id = response.json()["dataset_id"]

    result = client.post(f"/datasets/{dataset_id}/process", headers=auth_headers)
    assert result.json()["cleaned_filename"].endswith(".csv")


def test_datasets_are_private(client, auth_headers):
    dataset_id = upload(client, auth_headers).json()["dataset_id"]

    other = client.post(
        "/auth/register",
        json={"fullName": "Other", "email": "other@example.com", "password": "secret123"},
    ).json()["token"]
    other_headers = {"Authorization": f"Bearer {other}"}

    assert client.get("/datasets", headers=other_headers).json() == []
    assert client.get(f"/datasets/{dataset_id}", headers=other_headers).status_code == 404


def test_chat_uses_dataset_context(client, auth_headers, monkeypatch):
    import agents.insight_agent as insight_agent

    prompts = []

    def fake_gemini(prompt):
        prompts.append(prompt)
        return '{"message": "Answer", "suggestedQuestions": ["Q1"]}', "fake"

    monkeypatch.setattr(insight_agent, "call_gemini", fake_gemini)

    dataset_id = upload(client, auth_headers).json()["dataset_id"]

    response = client.post(
        "/chat",
        json={"message": "How many rows?", "datasetId": dataset_id},
        headers=auth_headers,
    )

    assert response.json() == {"message": "Answer", "suggestedQuestions": ["Q1"]}
    assert "employees.csv" in prompts[0]


def test_chat_without_gemini_returns_503(client, auth_headers):
    response = client.post("/chat", json={"message": "hi"}, headers=auth_headers)

    assert response.status_code == 503
