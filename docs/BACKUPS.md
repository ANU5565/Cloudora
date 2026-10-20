# Cloudora Backup & Disaster Recovery Strategy

## 1. Overview
A resilient cloud storage architecture requires independent recovery procedures for two distinct planes:
1. **Metadata Plane (PostgreSQL):** Stores accounts, folder hierarchies, permissions, quotas, and internal storage keys.
2. **Object Storage Plane (Cloudflare R2 / AWS S3):** Stores actual binary file payloads.

---

## 2. PostgreSQL Database Backup Procedures
- **Automated Daily Snapshots:** Managed database service configured for 30-day point-in-time recovery (PITR).
- **Manual Logical Dumps (`pg_dump`):**
  ```bash
  pg_dump -h db_host -U cloudora_user -d cloudora -F c -b -v -f cloudora_backup_$(date +%Y%m%d).dump
  ```
- **Logical Restore Testing:**
  ```bash
  pg_restore -h db_host -U cloudora_user -d cloudora_staging -v cloudora_backup_20261020.dump
  ```

---

## 3. Object Storage Recovery (R2 / S3)
- **Bucket Versioning:** Enable object versioning on the Cloudflare R2 / S3 bucket to prevent accidental or malicious file overwrites.
- **Cross-Region Replication:** In high-availability setups, configure automated cross-region asynchronous replication.
- **Lifecycle Expiration for Incomplete Multipart Uploads:** Configure a 7-day rule to automatically purge abandoned chunks.

---

## 4. Recovery Objectives
- **Recovery Point Objective (RPO):** Maximum 1 hour of metadata loss via WAL archiving.
- **Recovery Time Objective (RTO):** Under 30 minutes to spin up a new container and restore from database backup.
