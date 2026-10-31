import io
import pytest
from app.storage import get_storage_provider


def get_auth_token(client, email="bob@cloudora.io"):
    client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Bob Builder",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_accepted": True
    })
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    return res.json()["access_token"]


def test_file_upload_lifecycle(client):
    token = get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Request upload intent
    intent_res = client.post("/api/v1/files/upload-intents", headers=headers, json={
        "filename": "document.pdf",
        "size_bytes": 1024,
        "mime_type": "application/pdf"
    })
    assert intent_res.status_code == 200, intent_res.text
    intent_data = intent_res.json()
    file_id = intent_data["file_id"]
    upload_session_id = intent_data["upload_session_id"]
    upload_url = intent_data["upload_url"]

    # 2. Attempting to complete upload before object is written should fail
    fail_complete = client.post(
        f"/api/v1/files/{file_id}/complete-upload",
        headers=headers,
        json={"upload_session_id": upload_session_id}
    )
    assert fail_complete.status_code == 400

    # 3. Simulate object upload via storage provider
    storage = get_storage_provider()
    # Query file storage key
    from app.models.file import File
    # Fetch file record to get storage_key
    file_record = client.get("/api/v1/files", headers=headers).json()
    # File record in list won't show pending files by default
    # But storage_key can be retrieved or written directly via storage
    # Let's write the dummy bytes to the storage key derived from the upload_url or directly:
    import urllib.parse
    parsed = urllib.parse.urlparse(upload_url)
    qs = urllib.parse.parse_qs(parsed.query)
    key = qs["key"][0]
    storage.save_file_stream(key, io.BytesIO(b"X" * 1024), "application/pdf")

    # 4. Complete upload successfully
    complete_res = client.post(
        f"/api/v1/files/{file_id}/complete-upload",
        headers=headers,
        json={"upload_session_id": upload_session_id}
    )
    assert complete_res.status_code == 200, complete_res.text
    file_data = complete_res.json()
    assert file_data["upload_status"] == "completed"
    assert file_data["size_bytes"] == 1024

    # 5. List files
    list_res = client.get("/api/v1/files", headers=headers)
    assert list_res.status_code == 200
    files = list_res.json()
    assert len(files) == 1
    assert files[0]["id"] == file_id

    # 6. Request download intent
    dl_res = client.post(f"/api/v1/files/{file_id}/download-intent", headers=headers)
    assert dl_res.status_code == 200
    dl_data = dl_res.json()
    assert "download_url" in dl_data

    # 7. Rename & favorite file
    patch_res = client.patch(f"/api/v1/files/{file_id}", headers=headers, json={
        "display_name": "renamed_doc.pdf",
        "is_favorite": True
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["display_name"] == "renamed_doc.pdf"
    assert patch_res.json()["is_favorite"] is True

    # 8. Trash file
    trash_res = client.delete(f"/api/v1/files/{file_id}", headers=headers)
    assert trash_res.status_code == 200

    # Trashed file should not appear in normal list
    normal_files = client.get("/api/v1/files", headers=headers).json()
    assert len(normal_files) == 0

    # Trashed file should appear in trash list
    trashed_files = client.get("/api/v1/files?is_trashed=true", headers=headers).json()
    assert len(trashed_files) == 1

    # 9. Restore file
    restore_res = client.post(f"/api/v1/files/{file_id}/restore", headers=headers)
    assert restore_res.status_code == 200

    # 10. Permanent delete
    perm_del = client.delete(f"/api/v1/files/{file_id}/permanent", headers=headers)
    assert perm_del.status_code == 200


def test_upload_rejects_object_larger_than_reserved_size(client):
    token = get_auth_token(client, email="oversized@cloudora.io")
    headers = {"Authorization": f"Bearer {token}"}

    intent_res = client.post(
        "/api/v1/files/upload-intents",
        headers=headers,
        json={"filename": "small.txt", "size_bytes": 4, "mime_type": "text/plain"},
    )
    assert intent_res.status_code == 200, intent_res.text
    intent = intent_res.json()

    upload_res = client.put(
        intent["upload_url"],
        data=b"this object is larger than reserved",
        headers={"Content-Type": "text/plain"},
    )
    assert upload_res.status_code == 200

    complete_res = client.post(
        f"/api/v1/files/{intent['file_id']}/complete-upload",
        headers=headers,
        json={"upload_session_id": intent["upload_session_id"]},
    )
    assert complete_res.status_code == 413
    assert complete_res.json()["detail"]["code"] == "FILE_TOO_LARGE"

    import urllib.parse
    key = urllib.parse.parse_qs(urllib.parse.urlparse(intent["upload_url"]).query)["key"][0]
    assert not get_storage_provider().verify_object(key)["exists"]
    assert len(client.get("/api/v1/files", headers=headers).json()) == 0
