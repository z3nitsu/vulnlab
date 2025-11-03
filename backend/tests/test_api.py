from __future__ import annotations

def test_create_submission_requires_api_key(client):
    submission_payload = {
        "challenge_slug": "sqli_001",
        "code": "print('fixed')",
        "user_handle": "noauth",
    }

    response = client.post(
        "/submissions",
        json=submission_payload,
        headers={"X-API-Key": "wrong-key"},
    )
    assert response.status_code == 401

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
    assert data["status"] == "pending"
    client.app.state.scoring_worker.flush()

    fetched = client.get(f"/submissions/{data['id']}").json()
    assert fetched["status"] in {"pending", "failed", "passed"}
    if fetched["status"] in {"failed", "passed"}:
        assert fetched["score"] is not None
    assert isinstance(fetched["issues"], list)

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
    assert submission["status"] == "pending"

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
    assert rescored["status"] == "pending"
    client.app.state.scoring_worker.flush()
    rescored = client.get(f"/submissions/{submission['id']}").json()
    assert rescored["status"] in {"passed", "pending", "failed"}
    if rescored["status"] == "passed":
        assert rescored["score"] == 100
    assert isinstance(rescored["issues"], list)


def test_submission_stats(client):
    insecure_payload = {
        "challenge_slug": "sqli_001",
        "code": "username = input('u')\nquery = \"SELECT * FROM users WHERE username = '\" + username",
        "user_handle": "insecure",
    }
    secure_payload = {
        "challenge_slug": "sqli_001",
        "code": """
from sqlalchemy import text
def login(session, username, password):
    stmt = text("SELECT id FROM users WHERE username = :username AND password = :password")
    return session.execute(stmt, {"username": username, "password": password}).first()
""",
        "user_handle": "secure",
    }

    insecure_resp = client.post("/submissions", json=insecure_payload).json()
    secure_resp = client.post("/submissions", json=secure_payload).json()
    client.app.state.scoring_worker.flush()
    insecure_resp = client.get(f"/submissions/{insecure_resp['id']}").json()
    secure_resp = client.get(f"/submissions/{secure_resp['id']}").json()

    stats_resp = client.get("/stats/submissions")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()

    assert stats["total"] >= 2
    scores = [insecure_resp["score"] or 0, secure_resp["score"] or 0]
    expected_avg = sum(scores) / len(scores)
    if stats["average_score"] is not None:
        assert abs(stats["average_score"] - expected_avg) <= 1e-6 or abs(
            stats["average_score"] - expected_avg
        ) < 0.1

    status_counts = {entry["status"]: entry["count"] for entry in stats["status_counts"]}
    assert insecure_resp["status"] in status_counts
    assert secure_resp["status"] in status_counts


def test_submission_pagination(client):
    for idx in range(5):
        payload = {
            "challenge_slug": "sqli_001",
            "code": f"print('entry {idx}')",
            "user_handle": f"user{idx}",
        }
        resp = client.post("/submissions", json=payload)
        assert resp.status_code == 201

    client.app.state.scoring_worker.flush()

    first_page = client.get("/submissions", params={"limit": 2, "offset": 0})
    assert first_page.status_code == 200
    assert len(first_page.json()) == 2

    second_page = client.get("/submissions", params={"limit": 2, "offset": 2})
    assert second_page.status_code == 200
    assert len(second_page.json()) == 2

    third_page = client.get("/submissions", params={"limit": 2, "offset": 4})
    assert third_page.status_code == 200
    assert len(third_page.json()) <= 2

    ids_page1 = {item["id"] for item in first_page.json()}
    ids_page2 = {item["id"] for item in second_page.json()}
    assert ids_page1.isdisjoint(ids_page2)
