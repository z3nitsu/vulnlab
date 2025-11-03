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

    list_response = client.get(
        "/submissions", params={"challenge_slug": submission_payload["challenge_slug"]}
    )
    assert list_response.status_code == 200
    submissions = list_response.json()
    assert any(item["id"] == data["id"] for item in submissions)
