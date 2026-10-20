# Cloudora Security Incident Response Plan

## 1. Incident Classification
- **P1 - Critical:** Confirmed unauthorized access to customer files or storage keys; credential leakage; complete service outage.
- **P2 - High:** Quota bypass vulnerability; share link token enumeration; elevated error rates on authentication endpoints.
- **P3 - Medium:** Non-exploitable validation bug; minor security header misconfiguration.

---

## 2. Containment & Remediation Playbooks

### Playbook A: Suspected Secret / Key Compromise
1. **Immediate Revocation:** Revoke compromised Cloudflare R2 / AWS S3 API tokens immediately via provider dashboard.
2. **Issue New Credentials:** Re-generate token with minimal read/write policy and update backend environment variables.
3. **Rotate JWT Secret Key:** Changing `JWT_SECRET_KEY` immediately forces session invalidation across all clients.
4. **Audit Analysis:** Query `audit_events` table for abnormal download volumes or access patterns.

### Playbook B: Malicious Share Link Abuse
1. Identify `share_id` or `token_hash`.
2. Execute instant revocation:
   ```sql
   UPDATE shares SET is_revoked = TRUE, revoked_at = NOW() WHERE id = '<share_id>';
   ```
3. Verify public endpoint responds with HTTP 404 / `SHARE_REVOKED`.

---

## 3. Post-Incident Review
1. Root cause analysis documented within 48 hours.
2. New automated security tests added to `backend/tests/test_security.py` to prevent regression.
3. Architecture threat model updated in `docs/THREAT_MODEL.md`.
