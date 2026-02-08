# SOC 2 Readiness Plan — Gigaviz

**Status**: Planning  
**Last updated**: February 2026  
**Target**: Phase 3 SCALE (Month 3-6)  
**Framework**: SOC 2 Type II (Trust Services Criteria)

---

## SOC 2 Trust Services Criteria Assessment

### 1. Security (CC — Common Criteria) ✅ Mostly Ready

| Control | Status | Implementation |
|---------|--------|----------------|
| Access Control | ✅ | 4-layer auth: proxy → middleware → guard → RLS |
| Authentication | ✅ | Supabase Auth with email/password, magic link |
| Authorization | ✅ | Role-based: owner/admin/member per workspace |
| Network Security | ✅ | TLS 1.3, Vercel edge network, HTTPS only |
| Data Encryption (transit) | ✅ | All traffic encrypted via TLS |
| Data Encryption (rest) | ✅ | Supabase PostgreSQL with encryption at rest |
| Vulnerability Management | ⚠️ | npm audit, but no formal pen-testing schedule |
| Security Monitoring | ✅ | Sentry error tracking, Slack/Discord alerts |
| Incident Response | ⚠️ | Alerting exists, no formal IRP document |
| Change Management | ✅ | GitHub PRs, CI/CD pipeline, branch protection |
| MFA for Ops | 🔴 | No 2FA on ops console yet |
| IP Allowlist | 🔴 | No IP restriction on ops console |

### 2. Availability (A) ⚠️ Partial

| Control | Status | Implementation |
|---------|--------|----------------|
| Uptime Monitoring | ⚠️ | Status page exists (`/status`), but no external monitor |
| Disaster Recovery | ⚠️ | Supabase daily backups, no documented DR plan |
| Capacity Planning | ⚠️ | Rate limiting in place, no load testing |
| Failover | ⚠️ | Vercel auto-scaling, Supabase managed, no multi-region |
| SLA Definition | 🔴 | No published SLA for customers |
| Backup Verification | 🔴 | No regular backup restore testing |

### 3. Processing Integrity (PI) ✅ Mostly Ready

| Control | Status | Implementation |
|---------|--------|----------------|
| Input Validation | ✅ | Zod schemas on all API routes |
| Data Completeness | ✅ | Webhook idempotency, outbox pattern |
| Error Handling | ✅ | Sentry + structured logging + error boundaries |
| Audit Trail | ✅ | `audit_logs` table with before/after snapshots |
| Job Processing | ✅ | Worker with SKIP LOCKED, retry backoff |

### 4. Confidentiality (C) ✅ Mostly Ready

| Control | Status | Implementation |
|---------|--------|----------------|
| Data Classification | ⚠️ | Implicit (PII scrubbing in event logs), not documented |
| Access Restrictions | ✅ | RLS policies, workspace isolation |
| Encryption | ✅ | At rest and in transit |
| Secret Management | ✅ | `.env.local`, no NEXT_PUBLIC_ for sensitive vars |
| PII Handling | ✅ | Meta event logs sanitized, phone numbers normalized |
| Token Encryption | ✅ | `meta_tokens` encrypted system user tokens |

### 5. Privacy (P) ⚠️ Needs Work

| Control | Status | Implementation |
|---------|--------|----------------|
| Privacy Policy | ✅ | Published at `/policies/privacy-policy` |
| Data Collection Notice | ⚠️ | No cookie consent banner yet |
| Data Retention Policy | ⚠️ | No formal retention schedule |
| Data Subject Rights | ⚠️ | Deletion endpoint exists, no self-service export |
| Consent Management | 🔴 | Not implemented |
| Sub-processor Management | 🔴 | Not documented |

---

## Gap Analysis Summary

### 🔴 Critical Gaps (Must Fix Before Audit)

1. **MFA/2FA for Ops Console** — All platform admins need MFA
2. **Incident Response Plan (IRP)** — Formal document with roles, escalation, communication
3. **Data Retention Policy** — Define retention periods for each data type
4. **Cookie Consent** — GDPR requirement, SOC 2 privacy criterion
5. **Data Subject Access Request (DSAR)** — Self-service data export

### ⚠️ Moderate Gaps (Should Fix)

6. **Vulnerability Management** — Schedule regular pen-testing (quarterly)
7. **Backup Verification** — Monthly restore testing
8. **External Uptime Monitoring** — Set up Pingdom/UptimeRobot/BetterUptime
9. **Data Classification Policy** — Document data categories and handling rules
10. **Employee Security Training** — Document onboarding security checklist

### 🟢 Nice-to-Have (Can Be Deferred)

11. **SOC 2 Type I first** — Get Type I before pursuing Type II
12. **Formal Risk Assessment** — Annual risk assessment process
13. **Business Continuity Plan** — Beyond DR, full BCP documentation
14. **Vendor Risk Assessment** — Formal review of all sub-processors

---

## Implementation Roadmap

### Phase A: Documentation (Weeks 1-4)
- [ ] Write Incident Response Plan (IRP)
- [ ] Write Data Retention Policy
- [ ] Write Data Classification Policy
- [ ] Write Change Management Policy (formalize current GitHub workflow)
- [ ] Write Access Control Policy (formalize current role-based system)
- [ ] Document sub-processor list and risk assessments

### Phase B: Technical Controls (Weeks 5-8)
- [ ] Implement 2FA for ops console (TOTP or WebAuthn)
- [ ] Add IP allowlist for ops console
- [ ] Set up external uptime monitoring
- [ ] Implement automated backup verification
- [ ] Set up vulnerability scanning (Snyk or similar)
- [ ] Implement data retention automation (scheduled cleanup jobs)

### Phase C: Audit Preparation (Weeks 9-12)
- [ ] Engage SOC 2 auditor (Vanta, Drata, or Secureframe recommended)
- [ ] Complete readiness assessment with auditor
- [ ] Fix any additional findings
- [ ] Begin evidence collection for observation period
- [ ] Schedule SOC 2 Type I audit

---

## Evidence Collection Matrix

| Control Area | Evidence Required | Source |
|-------------|-------------------|--------|
| Access Control | User role assignments, RLS policies | Supabase, codebase |
| Authentication | Auth configuration, session management | Supabase Auth settings |
| Change Management | PR history, CI/CD logs, branch protection | GitHub |
| Monitoring | Alert configurations, Sentry dashboard | Sentry, lib/ops/alerts.ts |
| Incident Response | IRP document, incident log | To be created |
| Data Encryption | TLS configuration, database encryption | Vercel, Supabase |
| Audit Logging | Audit log table, sample entries | audit_logs table |
| Vulnerability Mgmt | npm audit results, scan reports | CI/CD pipeline |
| Backup | Backup schedule, restore test results | Supabase |
| Data Retention | Retention policy, cleanup job logs | To be created |

---

## Recommended Tools

| Tool | Purpose | Cost |
|------|---------|------|
| **Vanta** or **Drata** | SOC 2 compliance automation | $10K-25K/yr |
| **Snyk** | Vulnerability scanning | Free tier available |
| **BetterUptime** | External uptime monitoring | Free tier available |
| **1Password Teams** | Secret management for team | $8/user/mo |

---

## Timeline Estimate

| Phase | Duration | Target |
|-------|----------|--------|
| Documentation | 4 weeks | Month 3 |
| Technical Controls | 4 weeks | Month 4 |
| Audit Preparation | 4 weeks | Month 5 |
| SOC 2 Type I Audit | 4-6 weeks | Month 6-7 |
| Observation Period (Type II) | 3-12 months | Month 7-18 |

---

## References
- [AICPA Trust Services Criteria](https://www.aicpa.org/resources/article/trust-services-criteria)
- [Vanta SOC 2 Guide](https://www.vanta.com/collection/soc-2)
- [Supabase Security Practices](https://supabase.com/docs/guides/platform/going-into-prod)
