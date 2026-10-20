# Cloudora Production Deployment Guide

## 1. Prerequisites
- Production Domain with valid SSL/TLS certificates.
- Cloudflare R2 bucket or AWS S3 bucket.
- Managed PostgreSQL 15+ database instance.
- Vercel, Fly.io, Railway, Render, or self-hosted Docker deployment.

---

## 2. Cloudflare R2 Bucket Setup
1. Log in to Cloudflare Dashboard > **R2 Object Storage**.
2. Create bucket named `cloudora-private-files`.
3. Set Default Object Access to **Private** (do not enable public R2 dev URLs).
4. Under **Settings > CORS Policy**, configure CORS to allow PUT/GET from your frontend domain:
```json
[
  {
    "AllowedOrigins": ["https://cloudora.yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Disposition"],
    "MaxAgeSeconds": 3600
  }
]
```
5. Create an **R2 API Token** with `Object Read & Write` permissions scoped to `cloudora-private-files`.
6. Save `Access Key ID`, `Secret Access Key`, and `Endpoint URL`.

---

## 3. Backend Deployment (ASGI / Docker)
Run the backend with production environment variables:
```bash
docker run -d \
  --name cloudora-api \
  -p 8000:8000 \
  -e APP_ENV=production \
  -e APP_URL=https://api.cloudora.yourdomain.com \
  -e FRONTEND_ORIGINS='["https://cloudora.yourdomain.com"]' \
  -e DATABASE_URL=postgresql://user:pass@db-host:5432/cloudora \
  -e JWT_SECRET_KEY=<long-random-secret> \
  -e STORAGE_PROVIDER=s3 \
  -e S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com \
  -e S3_BUCKET_NAME=cloudora-private-files \
  -e S3_REGION=auto \
  -e S3_ACCESS_KEY_ID=<your-r2-key> \
  -e S3_SECRET_ACCESS_KEY=<your-r2-secret> \
  cloudora-backend:latest
```

---

## 4. Frontend Deployment (Vercel / Next.js)
1. Link repository to Vercel.
2. Set Root Directory to `frontend`.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_APP_URL`: `https://cloudora.yourdomain.com`
   - `NEXT_PUBLIC_API_URL`: `https://api.cloudora.yourdomain.com/api/v1`
4. Deploy!

---

## 5. Production Readiness Verification Checklist
- [x] HTTPS enforced everywhere.
- [x] Object storage bucket is private; presigned URLs have 15-minute TTL.
- [x] Database migrations are applied.
- [x] CORS origin restricted to frontend domain only.
- [x] Security headers active: `nosniff`, `DENY`, `XSS-Protection`.
- [x] Sensitive parameters redacted in structured logging.
- [x] Quota enforcement and tenant isolation tests passing 100%.
