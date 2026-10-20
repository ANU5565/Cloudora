# Cloudora Database Schema & Architecture

Primary Database: PostgreSQL (with full SQLite compatibility for local testing & zero-setup environments).

## 1. Relational Entity Diagram

```
[users]
  id (UUID PK)
  email (VARCHAR Unique)
  full_name (VARCHAR)
  hashed_password (VARCHAR)
  storage_quota_bytes (BIGINT)
  storage_used_bytes (BIGINT)
  is_active (BOOLEAN)
  is_verified (BOOLEAN)
  created_at / updated_at
     │
     ├── 1:N ──> [folders]
     │             id (UUID PK)
     │             owner_id (FK -> users.id)
     │             parent_id (FK -> folders.id)
     │             name (VARCHAR)
     │             is_trashed (BOOLEAN)
     │             trashed_at (DATETIME)
     │
     ├── 1:N ──> [files]
     │             id (UUID PK)
     │             owner_id (FK -> users.id)
     │             folder_id (FK -> folders.id)
     │             display_name (VARCHAR)
     │             storage_key (VARCHAR Unique)
     │             mime_type (VARCHAR)
     │             size_bytes (BIGINT)
     │             upload_status (VARCHAR)
     │             checksum (VARCHAR)
     │             is_favorite (BOOLEAN)
     │             is_trashed (BOOLEAN)
     │
     ├── 1:N ──> [shares]
     │             id (UUID PK)
     │             owner_id (FK -> users.id)
     │             file_id (FK -> files.id)
     │             folder_id (FK -> folders.id)
     │             token_hash (VARCHAR Unique)
     │             access_policy (VARCHAR)
     │             password_hash (VARCHAR)
     │             expires_at (DATETIME)
     │             is_revoked (BOOLEAN)
     │
     └── 1:N ──> [upload_sessions]
                   id (UUID PK)
                   owner_id (FK -> users.id)
                   file_id (FK -> files.id)
                   storage_key (VARCHAR)
                   reserved_bytes (BIGINT)
                   status (VARCHAR)
                   expires_at (DATETIME)
```

## 2. Integrity & Constraint Design
- **Cascading Deletions:** When a user account is deleted, foreign keys cascade to remove all associated files, folders, shares, and sessions.
- **Folder Cycle Prevention:** Validated server-side in `FolderService.check_folder_cycle` before commits.
- **Storage Accounting:** User `storage_used_bytes` is maintained transactionally upon upload completion and permanent deletion, backed by authoritative queries.
- **Soft Delete Isolation:** Trashed items (`is_trashed = True`) have dedicated filtered indices: `ix_files_owner_trashed`.
