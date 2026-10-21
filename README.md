# Nubes Repona

> **"Your digital world. One beautiful, secure space."**

Cloudora is a modern, privacy-focused cloud storage platform inspired by the simplicity and refinement of Apple applications and the convenience of Google Drive.

Built with **Next.js 16 (App Router)** on the frontend and **Python / FastAPI + SQLAlchemy 2.x** on the backend, Cloudora decouples binary object storage from web application servers. Files are uploaded directly to private cloud object storage (Cloudflare R2 or AWS S3), while application metadata and strict access control are authoritatively governed by PostgreSQL.

---

## Key Highlights

- **Decoupled Object Storage:** File contents never burden backend memory. Uploads and downloads use short-lived presigned URLs (15-minute TTL).
- **Authoritative Storage Quotas:** Atomic pre-upload quota reservations prevent concurrent upload bypass. Real-time category breakdown (Images, Videos, Documents, Audio, Archives, Code, Others).
- **Robust Folder Tree & Cycle Protection:** Full hierarchical navigation with interactive breadcrumbs and server-side cycle detection preventing invalid folder recursion.
- **Secure File Sharing:** Cryptographically secure share links (`secrets.token_urlsafe(32)`) stored strictly as SHA-256 hashes, with optional password protection, custom expiration, and instant revocation.
- **Soft-Delete Trash Bin:** 30-day retention with instant restoration and permanent deletion.
- **Strict Tenant Isolation & IDOR Defenses:** Centralized server authorization guarantees that User A can never read, modify, move, delete, or download User B's private files.
- **Zero-Dependency Local Development:** Includes a built-in `LocalStorageProvider` with HMAC-signed URLs, allowing complete local development and testing without paid cloud credentials.

---

## Repository Structure

```
cloudora/
├── frontend/                     # Next.js 16 App Router Frontend
│   ├── app/                      # Routes (Marketing, Auth, Dashboard, Share)
│   ├── components/               # UI & Layout components
│   ├── lib/                      # API client (api.ts) & Auth Context
│   ├── Dockerfile                # Production multi-stage Docker build
│   └── package.json
│
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py               # FastAPI application setup & middlewares
│   │   ├── core/                 # Config, security, logging, exceptions
│   │   ├── db/                   # Database engine & session maker
│   │   ├── models/               # SQLAlchemy ORM models (User, File, Folder, Share...)
│   │   ├── schemas/              # Pydantic v2 schemas
│   │   ├── services/             # Business logic (Auth, File, Folder, Share, Quota)
│   │   ├── storage/              # StorageProvider (S3 / Cloudflare R2 & Local)
│   │   └── api/v1/               # Versioned REST API endpoints
│   ├── tests/                    # Comprehensive Pytest test suite (100% green)
│   ├── Dockerfile                # Production ASGI Docker build
│   ├── pytest.ini                # Pytest configuration
│   └── requirements.txt
│
├── docs/                         # In-depth Engineering Documentation
│   ├── ARCHITECTURE.md           # Decoupled storage architecture & pipelines
│   ├── SECURITY.md               # ASVS security controls & header policies
│   ├── THREAT_MODEL.md           # Threat matrix, attack scenarios & mitigations
│   ├── API.md                    # REST API endpoint reference
│   ├── DATABASE.md               # PostgreSQL schema & entity relationships
│   ├── DEPLOYMENT.md             # Cloudflare R2, Vercel & Docker deployment guide
│   ├── BACKUPS.md                # Disaster recovery & point-in-time recovery
│   └── INCIDENT_RESPONSE.md      # Security breach containment playbooks
│
├── docker-compose.yml            # Multi-container local/production orchestration
├── .env.example                  # Documented environment variable template
├── .gitignore                    # Exclusion rules for secrets & caches
├── PROJECT_STATUS.md             # Project implementation state & verified results
└── README.md
```

---

## Quickstart & Local Development

### 1. Prerequisites
- **Node.js** v20+ and **npm**
- **Python** 3.11+
- (Optional) **Docker** & **Docker Compose**

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend test suite
python -m pytest -v

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend will be running at `http://localhost:3000`.

### 4. Running with Docker Compose
To run the full stack (PostgreSQL + FastAPI + Next.js):
```bash
docker-compose up --build
```

---

## Automated Test Results

The backend contains a real automated test suite running against an isolated database and test storage provider:

```bash
$ python -m pytest -v
============================= test session starts =============================
tests/test_auth.py::test_register_and_login PASSED                       [ 16%]
tests/test_files.py::test_file_upload_lifecycle PASSED                   [ 33%]
tests/test_folders.py::test_folder_hierarchy_and_cycles PASSED           [ 50%]
tests/test_quotas.py::test_quota_enforcement PASSED                      [ 66%]
tests/test_security.py::test_tenant_isolation_and_security_boundaries PASSED [ 83%]
tests/test_shares.py::test_share_lifecycle PASSED                        [100%]
======================== 6 passed in 5.83s =========================
```

The frontend production build (`npm run build`) compiles cleanly with 0 type errors across all routes.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
