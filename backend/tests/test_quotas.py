import pytest
from app.models.user import User


def test_quota_enforcement(client, db_session):
    # Register user with small custom quota
    client.post("/api/v1/auth/register", json={
        "email": "quota_test@cloudora.io",
        "full_name": "Quota User",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_accepted": True
    })
    token = client.post("/api/v1/auth/login", json={
        "email": "quota_test@cloudora.io",
        "password": "Password123!"
    }).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Set user quota to 2000 bytes directly in DB for testing
    user = db_session.query(User).filter(User.email == "quota_test@cloudora.io").first()
    user.storage_quota_bytes = 2000
    db_session.commit()

    # 1. Upload of 1500 bytes should succeed (within quota)
    res1 = client.post("/api/v1/files/upload-intents", headers=headers, json={
        "filename": "file1.dat",
        "size_bytes": 1500
    })
    assert res1.status_code == 200

    # 2. Concurrent upload of 800 bytes while file1 is pending should fail
    # because 1500 (pending) + 800 = 2300 > 2000 bytes quota!
    res2 = client.post("/api/v1/files/upload-intents", headers=headers, json={
        "filename": "file2.dat",
        "size_bytes": 800
    })
    assert res2.status_code == 413
    assert "QUOTA_EXCEEDED" in res2.text or "quota" in res2.text.lower()
