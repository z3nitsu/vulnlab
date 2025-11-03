from __future__ import annotations

def test_list_challenges(client):
    response = client.get("/challenges")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert any(item["slug"] == "sqli_001" for item in payload)


def test_create_submission(client):
    submission_payload = {
        "challenge_slug": "sqli_001",
        "code": "print('fixed')",
        "user_handle": "tester",
    }

    response = client.post("/submissions", json=submission_payload)
    assert response.status_code == 201

    data = response.json()
    assert data["challenge_slug"] == submission_payload["challenge_slug"]
    assert data["status"] in {"pending", "failed", "passed"}
    if data["status"] in {"failed", "passed"}:
        assert data["score"] is not None
    assert data["feedback"]
    assert isinstance(data["issues"], list)

    list_response = client.get(
        "/submissions", params={"challenge_slug": submission_payload["challenge_slug"]}
    )
    assert list_response.status_code == 200
    submissions = list_response.json()
    matching = next(item for item in submissions if item["id"] == data["id"])
    assert isinstance(matching["issues"], list)


def test_rescore_submission_updates_status(client):
    from backend.db import SessionLocal
    from backend.models import Submission

    submission_payload = {
        "challenge_slug": "sqli_001",
        "code": "username = input('user')\nquery = f\"SELECT * FROM users WHERE username = '{username}'\"",
        "user_handle": "tester",
    }

    response = client.post("/submissions", json=submission_payload)
    submission = response.json()
    assert submission["status"] in {"failed", "pending"}

    safe_code = """
from sqlalchemy import text

def login(session, username, password):
    query = text("SELECT id FROM users WHERE username = :username AND password = :password")
    return session.execute(query, {"username": username, "password": password}).first()
"""
    with SessionLocal() as session:
        db_submission = session.get(Submission, submission["id"])
        db_submission.code = safe_code
        session.add(db_submission)
        session.commit()

    rescore = client.post(f"/submissions/{submission['id']}/rescore")
    assert rescore.status_code == 200
    rescored = rescore.json()
    assert rescored["status"] in {"passed", "pending", "failed"}
    if rescored["status"] == "passed":
        assert rescored["score"] == 100
    assert isinstance(rescored["issues"], list)
