import io
import pytest
from app.storage import get_storage_provider


def create_user_and_token(client, email, name):
    client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": name,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_accepted": True
    })
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    return res.json()["access_token"]


def test_tenant_isolation_and_security_boundaries(client):
    # Setup User A
    token_a = create_user_and_token(client, "user_a@cloudora.io", "User A")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Setup User B
    token_b = create_user_and_token(client, "user_b@cloudora.io", "User B")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a folder
    folder_a = client.post("/api/v1/folders", headers=headers_a, json={"name": "User A Private Folder"}).json()

    # User A uploads a file
    intent_a = client.post("/api/v1/files/upload-intents", headers=headers_a, json={
        "filename": "confidential.pdf",
        "size_bytes": 500,
        "folder_id": folder_a["id"]
    }).json()

    storage = get_storage_provider()
    import urllib.parse
    qs = urllib.parse.parse_qs(urllib.parse.urlparse(intent_a["upload_url"]).query)
    storage.save_file_stream(qs["key"][0], io.BytesIO(b"Confidential data"), "application/pdf")

    client.post(f"/api/v1/files/{intent_a['file_id']}/complete-upload", headers=headers_a, json={
        "upload_session_id": intent_a["upload_session_id"]
    })
    file_a_id = intent_a["file_id"]

    # --- SECURITY TEST 1: User B cannot download User A's file ---
    b_dl = client.post(f"/api/v1/files/{file_a_id}/download-intent", headers=headers_b)
    assert b_dl.status_code == 403, "User B was able to create download intent for User A's file!"

    # --- SECURITY TEST 2: User B cannot rename User A's file ---
    b_rename = client.patch(f"/api/v1/files/{file_a_id}", headers=headers_b, json={"display_name": "hacked.pdf"})
    assert b_rename.status_code == 403, "User B was able to rename User A's file!"

    # --- SECURITY TEST 3: User B cannot delete User A's file ---
    b_delete = client.delete(f"/api/v1/files/{file_a_id}", headers=headers_b)
    assert b_delete.status_code == 403, "User B was able to delete User A's file!"

    # --- SECURITY TEST 4: User B cannot move User A's file ---
    b_folder = client.post("/api/v1/folders", headers=headers_b, json={"name": "User B Folder"}).json()
    b_move = client.patch(f"/api/v1/files/{file_a_id}", headers=headers_b, json={"folder_id": b_folder["id"]})
    assert b_move.status_code == 403, "User B was able to move User A's file!"

    # --- SECURITY TEST 5: User B cannot view User A's folder contents ---
    b_folder_view = client.get(f"/api/v1/folders/{folder_a['id']}/contents", headers=headers_b)
    # The endpoint will scope to User B, returning empty folder/file lists
    assert len(b_folder_view.json()["files"]) == 0

    # --- SECURITY TEST 6: Unauthenticated request cannot list files ---
    unauth = client.get("/api/v1/files")
    assert unauth.status_code == 401

    # --- SECURITY TEST 7: Malformed token is rejected ---
    bad_token = client.get("/api/v1/files", headers={"Authorization": "Bearer invalid.jwt.signature"})
    assert bad_token.status_code == 401

    # --- SECURITY TEST 8: Trashed file cannot be downloaded ---
    client.delete(f"/api/v1/files/{file_a_id}", headers=headers_a)
    trashed_dl = client.post(f"/api/v1/files/{file_a_id}/download-intent", headers=headers_a)
    assert trashed_dl.status_code == 400
    assert "trash" in trashed_dl.text.lower()

    # --- SECURITY TEST 9: Security headers verification ---
    health_res = client.get("/health")
    assert health_res.headers.get("X-Content-Type-Options") == "nosniff"
    assert health_res.headers.get("X-Frame-Options") == "DENY"
