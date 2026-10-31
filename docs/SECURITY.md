# Cloudora Security Engineering Architecture

## 1. Core Security Guarantees
1. **Private by Default:** Buckets have zero public read permissions. Files are only accessible via short-lived HMAC or SigV4 signed URLs.
2. **Tenant Isolation:** Every database mutation, query, and download authorization explicitly matches `owner_id == user.id`. Insecure Direct Object References (IDOR) are strictly rejected with 403 Forbidden.
3. **No Plaintext Secrets:** Passwords use salted bcrypt. Share link tokens are generated via `secrets.token_urlsafe(32)` and persisted exclusively as SHA-256 hashes (`token_hash`).
4. **Structured Log Sanitization:** Custom JSON formatter redacts all keys matching `password`, `token`, `secret`, `authorization`, `key`, `cookie`, `otp`.
5. **Security Headers Middleware:**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## 2. Authentication & Session Lifecycles
- Production startup requires an explicitly configured JWT signing key with at least 32 characters; development generates an ephemeral key when one is not provided.
- Short-lived Bearer JWT tokens signed with HMAC-SHA256.
- Password change immediately invalidates old passwords and logs security events.
- Client stores JWT in browser local storage and attaches it to Authorization Bearer headers.

## 3. Storage Security
- Untrusted filenames are sanitized with `normalize_filename()` to remove path traversal sequences (`..`, `/`, `\`), control characters, and null bytes.
- Internal object storage keys use randomized UUIDs to prevent object enumeration or key guessing.
- Trashed files are blocked from normal download and sharing endpoints.
