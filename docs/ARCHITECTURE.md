# Cloudora System Architecture

## 1. Overview & Vision
Cloudora is a modern, privacy-focused cloud storage platform designed with an Apple-inspired visual aesthetic and Google Drive convenience. File contents are strictly stored in high-throughput cloud object storage (Cloudflare R2 or AWS S3), while application metadata, access control lists, and quotas are managed authoritatively in PostgreSQL (with SQLite support for zero-dependency local development).

```
   [Browser Client: Next.js 16 + React 19]
          │                               ▲
   1. API │ (Metadata, Auth, Intents)     │ 3. Direct Upload / Download
          ▼                               │    (Presigned S3/R2 URLs)
   [FastAPI Backend Server]               │
          │                               ▼
   2. Auth / Quotas / Sessions     [Object Storage: Cloudflare R2 / S3]
          ▼
   [PostgreSQL Database]
```

## 2. Decoupled Storage Flow

### Upload Pipeline
1. **Frontend Validation:** Pre-validates file selection and basic limits.
2. **Upload Intent (`POST /api/v1/files/upload-intents`):**
   - Backend authenticates the requester.
   - Checks user storage quota authoritatively.
   - Creates an atomic `UploadSession` with `reserved_bytes`.
   - Creates a `File` record in `pending` state with a randomized, unpredictable storage key: `users/<user_id>/<uuid>/<clean_filename>`.
   - Generates a short-lived presigned upload URL (TTL: 15 minutes).
3. **Direct Upload:** Browser streams file directly to Cloudflare R2 or AWS S3. Server RAM is never burdened by massive binary streams.
4. **Completion Verification (`POST /api/v1/files/{id}/complete-upload`):**
   - Backend queries the storage provider (`head_object`) to authoritatively verify object presence and actual byte length.
   - `File.upload_status` transitions to `completed`.
   - `UploadSession.status` transitions to `completed`.
   - User's storage usage is recalculated authoritatively.

### Download Pipeline
1. Request sent to `POST /api/v1/files/{id}/download-intent`.
2. Backend verifies tenant ownership or active share permission.
3. Checks that the file is not in trash (`is_trashed == False`).
4. Generates a signed URL with `ResponseContentDisposition=attachment; filename="<name>"` expiring in 15 minutes.
5. Emits an audit event.

## 3. Storage Provider Abstraction
All storage logic is encapsulated behind the abstract interface `StorageProvider` (`app/storage/base.py`):
- `S3StorageProvider`: Cloudflare R2 & AWS S3 compatible (AWS SigV4).
- `LocalStorageProvider`: Fully functional local storage provider for offline development and CI testing, implementing HMAC signature verification and time-based expiration.

## 4. Folder Hierarchy & Cycle Protection
- Hierarchical folders with parent-child foreign keys.
- `FolderService.check_folder_cycle` prevents recursive cycle attacks when moving folders.
- Soft-deletion recursively cascades to all descendant folders and contained files.
