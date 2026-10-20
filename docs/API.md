# Cloudora REST API Documentation (v1)

Base URL: `/api/v1`

## 1. Authentication Endpoints

### Register User
`POST /auth/register`
- **Request:** `{ "email": "user@example.com", "full_name": "User Name", "password": "Password123!", "confirm_password": "Password123!", "terms_accepted": true }`
- **Response (200):** User profile object.

### Login
`POST /auth/login`
- **Request:** `{ "email": "user@example.com", "password": "Password123!" }`
- **Response (200):** `{ "access_token": "<jwt>", "token_type": "bearer", "user": { ... } }`

### Current User Profile
`GET /auth/me`
- **Headers:** `Authorization: Bearer <jwt>`
- **Response (200):** User profile.

### Change Password
`POST /auth/change-password`
- **Request:** `{ "current_password": "...", "new_password": "..." }`
- **Response (200):** `{ "message": "Password changed successfully" }`

---

## 2. Files Endpoints

### List Files
`GET /files?folder_id=<id>&is_trashed=<bool>&is_favorite=<bool>&limit=100&offset=0`
- **Response (200):** Array of `FileResponse` objects.

### Request Upload Intent
`POST /files/upload-intents`
- **Request:** `{ "filename": "doc.pdf", "size_bytes": 1024, "mime_type": "application/pdf", "folder_id": null }`
- **Response (200):** `{ "file_id": "...", "upload_session_id": "...", "upload_url": "...", "method": "PUT", "headers": { ... }, "expires_at": "..." }`

### Complete Upload
`POST /files/{id}/complete-upload`
- **Request:** `{ "upload_session_id": "..." }`
- **Response (200):** Verified `FileResponse` object.

### Request Download Intent
`POST /files/{id}/download-intent`
- **Response (200):** `{ "download_url": "...", "expires_in": 900, "filename": "doc.pdf", "mime_type": "...", "size_bytes": 1024 }`

### Modify File
`PATCH /files/{id}`
- **Request:** `{ "display_name": "new_name.pdf", "folder_id": "<target_folder_id>", "is_favorite": true }`
- **Response (200):** Updated `FileResponse`.

### Move to Trash
`DELETE /files/{id}`
- **Response (200):** `{ "message": "File moved to trash" }`

### Restore from Trash
`POST /files/{id}/restore`
- **Response (200):** `{ "message": "File restored from trash" }`

### Permanent Delete
`DELETE /files/{id}/permanent`
- **Response (200):** `{ "message": "File permanently deleted" }`

---

## 3. Folders Endpoints

### List Folders
`GET /folders?parent_id=<id>&is_trashed=false`
- **Response (200):** Array of `FolderResponse` objects.

### Create Folder
`POST /folders`
- **Request:** `{ "name": "Projects", "parent_id": null }`
- **Response (200):** Created `FolderResponse`.

### Get Folder Contents & Breadcrumbs
`GET /folders/{id}/contents`
- **Response (200):** `{ "current_folder": { ... }, "breadcrumbs": [ ... ], "folders": [ ... ], "files": [ ... ] }`

### Trash Folder
`DELETE /folders/{id}`
- **Response (200):** `{ "message": "Folder and contents moved to trash" }`

---

## 4. Sharing Endpoints

### Create Share Link
`POST /shares`
- **Request:** `{ "file_id": "...", "access_policy": "download", "password": "...", "expires_hours": 24 }`
- **Response (200):** Created `ShareResponse` with `share_url`.

### List Active Shares
`GET /shares`
- **Response (200):** Array of active `ShareResponse` items.

### Revoke Share
`DELETE /shares/{id}`
- **Response (200):** `{ "message": "Share link revoked" }`

### Public Share Access
`POST /shares/public/{token}`
- **Request:** `{ "password": "..." }`
- **Response (200):** `{ "requires_password": false, "file": { ... }, "download_url": "..." }`

---

## 5. Storage Analytics & Search

### Storage Usage Statistics
`GET /storage/stats`
- **Response (200):** Total quota, used bytes, remaining bytes, percentage, category distribution, and largest files list.

### Database Search
`GET /search?q=<query>&file_type=<image|video|audio|document>`
- **Response (200):** Matching files and folders.
