import io
import pytest
from datetime import datetime, timezone, timedelta
from app.storage import get_storage_provider


def setup_user_and_file(client, email="sharer@cloudora.io"):
    client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Sharer User",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_accepted": True
    })
    login = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload file
    intent = client.post("/api/v1/files/upload-intents", headers=headers, json={
        "filename": "shared_doc.txt",
        "size_bytes": 100
    }).json()

    # Save to storage
    storage = get_storage_provider()
    import urllib.parse
    qs = urllib.parse.parse_qs(urllib.parse.urlparse(intent["upload_url"]).query)
    storage.save_file_stream(qs["key"][0], io.BytesIO(b"Hello Cloudora"), "text/plain")

    client.post(f"/api/v1/files/{intent['file_id']}/complete-upload", headers=headers, json={
        "upload_session_id": intent["upload_session_id"]
    })
    return token, intent["file_id"]


def test_share_lifecycle(client):
    token, file_id = setup_user_and_file(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a password-protected share
    share_res = client.post("/api/v1/shares", headers=headers, json={
        "file_id": file_id,
        "access_policy": "download",
        "password": "SecretSharePassword!",
        "expires_hours": 24
    })
    assert share_res.status_code == 200
    share_data = share_res.json()
    assert share_data["has_password"] is True
    share_id = share_data["id"]
    raw_token = share_data["share_url"].split("/share/")[-1]

    # 2. Public access without password should flag that password is required
    pub_res = client.post(f"/api/v1/shares/public/{raw_token}", json={})
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["requires_password"] is True
    assert pub_data["download_url"] is None

    # 3. Public access with wrong password should also require password
    bad_pwd_res = client.post(f"/api/v1/shares/public/{raw_token}", json={"password": "WrongPassword"})
    assert bad_pwd_res.status_code == 200
    assert bad_pwd_res.json()["requires_password"] is True

    # 4. Public access with correct password should grant download URL
    good_pwd_res = client.post(f"/api/v1/shares/public/{raw_token}", json={"password": "SecretSharePassword!"})
    assert good_pwd_res.status_code == 200
    good_data = good_pwd_res.json()
    assert good_data["requires_password"] is False
    assert good_data["download_url"] is not None

    # 5. Revoke share
    rev_res = client.delete(f"/api/v1/shares/{share_id}", headers=headers)
    assert rev_res.status_code == 200

    # 6. Attempting to access revoked share must fail
    revoked_access = client.post(f"/api/v1/shares/public/{raw_token}", json={"password": "SecretSharePassword!"})
    assert revoked_access.status_code == 404
