# GDPR Compliance Plan — Gigaviz

**Status**: Planning  
**Last updated**: February 2026  
**Target**: Phase 3 SCALE (Month 3-6)

---

## Current State Assessment

### What We Already Have

| Area | Status | Details |
|------|--------|---------|
| Privacy Policy | ✅ Published | `/policies/privacy-policy` — covers data collection, usage, sharing |
| Terms of Service | ✅ Published | `/policies/terms-of-service` |
| Cookie Policy | ✅ Published | `/policies/cookie-policy` |
| Data Deletion | ✅ Implemented | `/data-deletion` endpoint for Meta/WhatsApp compliance |
| RLS Security | ✅ All tables | Row-level security on all user-facing tables |
| Workspace Isolation | ✅ Enforced | All data scoped by `workspace_id` |
| Audit Trail | ✅ Active | `audit_logs` table with before/after snapshots |
| Encryption at Rest | ✅ Supabase | PostgreSQL with TDE via Supabase infrastructure |
| Encryption in Transit | ✅ TLS | All API traffic over HTTPS/TLS 1.3 |

### Gaps to Address

| Area | Status | Priority | Notes |
|------|--------|----------|-------|
| Cookie Consent Banner | 🔴 Missing | P0 | Required for EU visitors |
| Data Export (DSAR) | 🔴 Missing | P0 | Users must be able to download their data |
| Right to Erasure | ⚠️ Partial | P0 | Data deletion exists but not user-self-service |
| Consent Management | 🔴 Missing | P1 | Granular consent for marketing, analytics, etc. |
| DPA (Data Processing Agreement) | 🔴 Missing | P1 | Required for B2B customers |
| Data Residency Options | 🔴 Missing | P2 | Regional Supabase instances (EU, APAC) |
| DPIA (Data Protection Impact Assessment) | 🔴 Missing | P2 | Required for AI processing (Helper module) |
| Breach Notification Process | ⚠️ Partial | P1 | Alerting exists but no formal 72-hour process |
| Lawful Basis Documentation | 🔴 Missing | P1 | Document legal basis for each data processing activity |

---

## Implementation Roadmap

### Phase 3A: Foundation (Weeks 1-4)

#### 1. Cookie Consent Banner
- Install/build a GDPR-compliant cookie consent UI
- Categories: Essential, Analytics, Marketing
- Store consent preference per user (cookie + DB)
- Block non-essential scripts until consent given
- Integrate with existing analytics (TrackedLink, etc.)

#### 2. Data Subject Access Request (DSAR)
- Build `/api/gdpr/export` endpoint
- Export user's data as JSON/ZIP:
  - Profile information
  - Workspace memberships
  - Messages sent/received
  - Contacts created
  - Templates created
  - Audit log entries (user's actions)
  - Helper conversations
- Rate limit: 1 export per 24 hours per user
- Async processing for large datasets (email download link)

#### 3. Right to Erasure (Self-Service)
- Build `/settings/delete-account` UI
- Cascade deletion:
  1. Remove user from all workspace memberships
  2. Delete user's messages (or anonymize)
  3. Delete user's profile
  4. Delete auth.users record
  5. Retain anonymized audit logs (legal requirement)
- 30-day grace period before permanent deletion
- Email confirmation required

### Phase 3B: Compliance Documentation (Weeks 5-8)

#### 4. Data Processing Agreement (DPA)
- Draft DPA template for B2B customers
- Cover: sub-processors, data transfers, security measures
- Publish at `/policies/dpa`
- Include: Supabase, Vercel, OpenAI, Meta as sub-processors

#### 5. Lawful Basis Register
- Document legal basis for each processing activity:
  - Account creation → Contract performance
  - WhatsApp messaging → Legitimate interest + consent
  - AI processing → Consent
  - Analytics → Legitimate interest
  - Marketing emails → Consent
- Publish internally for compliance audits

#### 6. Breach Notification SOP
- Define 72-hour notification timeline
- Create notification templates (DPA, users, regulators)
- Wire into existing Slack/Discord alerts
- Test with tabletop exercise

### Phase 3C: Data Residency (Weeks 9-12)

#### 7. Regional Data Storage
- Evaluate Supabase regional projects (EU, APAC)
- Design workspace-level data residency selection
- Migration strategy for existing workspaces
- DNS-based routing for regional API endpoints

---

## Sub-Processor Register

| Sub-Processor | Purpose | Data Processed | Location |
|--------------|---------|----------------|----------|
| Supabase | Database, Auth | All user data | US (AWS) |
| Vercel | Hosting, CDN | Request logs, cookies | Global edge |
| Meta (WhatsApp) | Messaging | Phone numbers, messages | US/EU |
| OpenAI | AI processing | Chat content (Helper) | US |
| Upstash | Rate limiting | IP addresses, counts | Global edge |
| Sentry | Error monitoring | Stack traces, user IDs | US |

---

## Technical Requirements

### Database Changes
```sql
-- User consent tracking
CREATE TABLE user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  consent_type text NOT NULL, -- 'analytics', 'marketing', 'ai_processing'
  granted boolean NOT NULL DEFAULT false,
  granted_at timestamptz,
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Data deletion requests
CREATE TABLE deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, cancelled
  requested_at timestamptz DEFAULT now(),
  grace_period_ends timestamptz,
  completed_at timestamptz,
  reason text
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
```

### API Endpoints
- `GET /api/gdpr/export` — Initiate data export
- `GET /api/gdpr/export/download` — Download exported data
- `POST /api/gdpr/delete` — Request account deletion
- `DELETE /api/gdpr/delete` — Cancel deletion request
- `GET /api/gdpr/consents` — Get current consent status
- `PUT /api/gdpr/consents` — Update consent preferences

---

## References
- [GDPR Official Text](https://gdpr.eu/)
- [ICO Guide to GDPR](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)
- [Supabase GDPR Documentation](https://supabase.com/docs/guides/platform/going-into-prod#gdpr)
