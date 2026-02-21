# Copilot / AI Assistant Guidance for gigaviz-web

## Quick Start (60 seconds)

**Repo**: Gigaviz multi-tenant SaaS platform (Next.js 16 + React 19 + TypeScript + Supabase)  
**MVP**: Inbox & CRM with WhatsApp/Meta Hub integration  
**Roadmap**: 7-product ecosystem (Platform, Meta Hub, Helper, Studio, Apps, Marketplace, Office)

```bash
npm install
cp .env.example .env.local
# Fill required vars: SUPABASE_*, WA_*, META_*
npm run dev            # http://localhost:3000
npm run worker         # Background job processor (WhatsApp outbox)
npm run typecheck      # Validate types
npm run lint           # Code quality
```

**Critical**: Every data access MUST be scoped by `workspace_id`. Use `getAppContext()` to resolve workspace + entitlements.

---

## Golden Rules (Apply to ALL Modules)

### 1. Workspace Scoping (MANDATORY)
- **EVERY query MUST filter by `workspace_id`** (even with service role)
- Resolve workspace via `getAppContext(workspaceSlug)` from `lib/app-context.ts`
- Never trust client input for `workspace_id` or role

```typescript
// ✅ CORRECT: Explicit workspace filter
const db = await supabaseServer();
const { data } = await db
  .from("contacts")
  .select("*")
  .eq("workspace_id", ctx.currentWorkspace.id);

// ❌ WRONG: Missing workspace scope (security breach)
const { data } = await db.from("contacts").select("*");
```

### 2. RLS-First Security
- All user-facing tables MUST have RLS policies (no exceptions)
- RLS policies use `workspace_members` table for membership checks
- Service role (`supabaseAdmin()`) bypasses RLS — use ONLY for system ops

```sql
-- Standard RLS policy template
CREATE POLICY users_access_own_workspace_data ON table_name
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);
```

### 3. Server-First Next.js
- Default to Server Components (no `"use client"` unless required)
- Use `"use client"` ONLY for: forms, modals, browser APIs, interactive UI
- Keep client components thin; delegate business logic to Server Actions or API routes
- Server-only modules: Add `import "server-only";` at top

### 4. Zod Validation (API Routes & Actions)
- Every API route MUST validate input with Zod schemas
- Fail fast with clear error messages
- Never trust client input for security-critical fields (`workspace_id`, `user_id`, roles)

```typescript
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1).max(4096),
  to_phone: z.string().regex(/^\+\d{10,15}$/),
});

const body = await req.json();
const validated = schema.parse(body); // Throws if invalid
```

### 5. Secrets & Environment Variables
- NEVER commit tokens, API keys, or secrets (use `.env.local`)
- NEVER expose secrets to client (no `NEXT_PUBLIC_` prefix for sensitive vars)
- Use `serverEnv` from `lib/env` for server-side env access

### 6. Rate Limiting & Abuse Protection
- Upstash Redis (`lib/rate-limit.node.ts`) for high-throughput routes
- DB fallback (`rateLimitDb()`) if Redis unavailable
- Apply to: webhooks, public APIs, token-consuming actions

### 7. Logging & Error Handling
- Use structured logger from `lib/logging.ts` (`logger.info()`, `logger.error()`)
- Log errors with context (workspace ID, user ID, action)
- Return safe errors to clients (no stack traces or internal details)
- Use `lib/audit.ts` for user action audit trail

### 8. npm Only (No pnpm/yarn)
- Use `npm install`, `npm run dev`, `npm run build`
- Package manager: npm (workspace conventions)

---

## Product Map (7 Products)

| Module | Status | Entitlement | Routes | Description |
|--------|--------|-------------|--------|-------------|
| **Platform** | LIVE | `core_os` | `/[workspaceSlug]/platform` | Core OS: auth, workspace, billing, roles, audit |
| **Meta Hub** | LIVE | `meta_hub` | `/[workspaceSlug]/meta-hub` | WhatsApp Business Platform: templates, inbox, delivery, automation |
| **Helper** | BETA | `helper` | `/[workspaceSlug]/helper` | AI assistant: chat, copywriting, RAG knowledge base, workflows |
| **Studio** | LIVE | `studio` | `/[workspaceSlug]/modules/studio` | Creative suite: Office, Graph (charts+dashboards), Tracks (workflows+runs) |
| **Office** | LIVE | `office` | `/[workspaceSlug]/modules/office` | AI-powered document automation (5 categories, templates, AI prompt) |
| **Apps** | BETA | TBD | `/[workspaceSlug]/apps` | Third-party app integrations |
| **Marketplace** | BETA | `marketplace` | `/[workspaceSlug]/marketplace` | Template/plugin marketplace |

---

## Module Playbooks

### Gigaviz Platform (LIVE)

**Purpose**: Core OS for authentication, workspace management, billing, roles, and audit trails.

**Entry Points**:
- UI: `/[workspaceSlug]/platform`, `/[workspaceSlug]/settings`, `/[workspaceSlug]/billing`
- API: `/api/workspaces/*`, `/api/workspace-members/*`, `/api/subscriptions/*`

**Core Entities**:
- `workspaces` – Workspace metadata (name, slug, owner_id, workspace_type)
- `workspace_members` – User membership (user_id, workspace_id, role)
- `profiles` – User profiles (linked to auth.users)
- `subscriptions` – Plan subscriptions (workspace_id, plan_id, status, seat_limit)
- `ops_entitlement_grants` – Platform admin entitlement overrides
- `audit_logs` – User action audit trail

**Entitlements**: `core_os`, `dashboard_home`, `account_settings`, `billing_manage`

**Smoke Test**:
1. Visit `/[workspaceSlug]/platform`
2. Check workspace list, current workspace display
3. Navigate to `/[workspaceSlug]/settings` → update workspace name
4. Check audit logs for update event

---

### Gigaviz Meta Hub (LIVE)

**Purpose**: WhatsApp Business Platform integration — templates, inbox, delivery status, automation.

**Entry Points**:
- UI: `/[workspaceSlug]/meta-hub`, `/[workspaceSlug]/meta-hub/inbox`, `/[workspaceSlug]/meta-hub/connections`
- API: `/api/webhooks/meta/whatsapp`, `/api/meta-hub/status`, `/api/meta-hub/unified-inbox`

**Core Entities**:
- `meta_wa_connections` – WhatsApp phone number connections (workspace_id, phone_number_id, waba_id)
- `meta_tokens` – Encrypted system user tokens for Graph API
- `meta_event_logs` – Sanitized webhook payloads (PII removed)
- `outbox_messages` – Outgoing message queue (status: queued → claimed → sent/failed)
- `inbox_messages` – Incoming messages (linked to threads, contacts)
- `wa_templates` – WhatsApp message templates (name, language, status, components)
- `wa_contacts` – Contact records (phone_norm, name, workspace_id)
- `threads` – Conversation threads (contact_id, workspace_id, status, assignee_id)

**Jobs/Workers**:
- `scripts/worker.ts` – Polls `outbox_messages` for queued rows, sends via Graph API, updates status
  - Run: `npm run worker`
  - Retry backoff: 3m, 5m, 10m before marking `failed`
  - Rate limiting: enforced via `db_rate_limiter` (per workspace)

**Entitlements**: `meta_hub`, `meta_templates`, `meta_webhooks`, `meta_send`, `inbox`

**Smoke Test**:
1. Set `META_APP_ID`, `META_APP_SECRET`, `WA_PHONE_NUMBER_ID` in `.env.local`
2. Visit `/[workspaceSlug]/meta-hub/connections` → **Test connection**
3. Visit `/[workspaceSlug]/meta-hub/webhooks` → **Test Webhook Ping**
4. Insert test row into `outbox_messages` (status: `queued`)
5. Run `npm run worker` → verify status changes to `sent` or `failed`

**Key Patterns**:
- **Webhook Flow**: `app/api/webhooks/meta/whatsapp/route.ts` → verify Meta signature → resolve connection → store event → process messages/statuses
- **Outbox Worker**: Claims rows with `SKIP LOCKED` (safe for multiple instances) → sends via `sendWhatsappMessage()` → updates status
- **Connection Management**: Admin UI at `/[workspaceSlug]/meta-hub/connections` (test, ping, verify tokens)

**Inbox/CRM Subsystem** (deep implementation under Meta Hub):
- **Threads**: Conversation grouping (contact_id, workspace_id, status, assignee_id, tags)
- **Messages**: Linked to threads (inbox_messages, outbox_messages)
- **Contacts**: `wa_contacts` table (phone_norm, name, tags, custom fields)
- **Tags**: Thread/contact tagging for organization
- **Assignments**: Multi-agent support (assignee_id on threads)
- **SLA Tracking**: First response time, resolution time (planned)

---

### Gigaviz Helper (BETA)

**Purpose**: AI assistant for chat, copywriting, summaries, RAG knowledge base, and workflows.

**Entry Points**:
- UI: `/[workspaceSlug]/helper`, `/[workspaceSlug]/helper/crm`, `/[workspaceSlug]/helper/leads`
- API: `/api/helper/*` (planned)

**Core Entities**:
- `helper_conversations` – Chat sessions (workspace_id, title, created_at)
- `helper_messages` – Chat messages (conversation_id, role: user/assistant, content)
- `helper_knowledge_sources` – RAG data sources (workspace_id, source_type, url, status)
- `helper_knowledge_chunks` – Vector embeddings for RAG (source_id, content, embedding)
- `helper_workflows` – Workflow definitions (workspace_id, name, trigger_type, steps)
- `helper_workflow_runs` – Execution history (workflow_id, status, output)
- `helper_templates` – Prompt templates (workspace_id, name, prompt, category)

**Jobs/Workers**:
- `scripts/kb-index.ts` – Indexes knowledge sources (docs, web pages) into vector embeddings
  - Run: `npm run kb:index` or `npm run kb:index:docs`

**Entitlements**: `helper`

**Smoke Test**:
1. Visit `/[workspaceSlug]/helper`
2. Create new conversation → send test message
3. Check `helper_conversations` and `helper_messages` tables for new records
4. Test RAG: Upload doc → run `npm run kb:index:docs` → query in chat

---

### Gigaviz Studio (BETA)

**Purpose**: AI-powered creative suite (parent module for Office, Graph, Tracks).

**Entry Points**:
- UI: `/[workspaceSlug]/modules/studio`, `/[workspaceSlug]/modules/office`
- Submodules: Office (AI document automation — Excel, Word, PDF), Graph (AI image & video creation), Tracks (AI music & audio creation)

**Core Entities**: TBD (submodule-specific tables planned)

**Entitlements**: `studio`, `office`, `graph`, `tracks`

**Status**: Scaffolding in place; submodule implementation in progress.

---

### Gigaviz Apps (PLACEHOLDER)

**Purpose**: Third-party app integrations and connectors.

**Entry Points**: `/[workspaceSlug]/apps` (route exists, UI placeholder)

**Status**: Route scaffolding only; no backend implementation yet.

**Guidance**: When implementing, follow workspace scoping, RLS policies, and entitlement gating patterns.

---

### Gigaviz Marketplace (PLACEHOLDER)

**Purpose**: Template and plugin marketplace for sharing/monetizing assets.

**Entry Points**: `/[workspaceSlug]/marketplace` (route exists, UI placeholder)

**Status**: Route scaffolding only; no backend implementation yet.

**Guidance**: When implementing, follow workspace scoping, RLS policies, and entitlement gating patterns.

---

## Core Architecture Deep Dive

### Supabase Client Patterns

**Server Components** (cookie-based auth):
```typescript
import { supabaseServer } from "@/lib/supabase/server";
const db = await supabaseServer();
const { data } = await db.from("table").select("*").eq("workspace_id", workspaceId);
```

**Service Role** (bypasses RLS):
```typescript
import { supabaseAdmin } from "@/lib/supabase/admin";
const db = supabaseAdmin();
// MUST still filter by workspace_id explicitly
const { data } = await db.from("table").select("*").eq("workspace_id", workspaceId);
```

**Node.js Scripts** (service role for workers):
```typescript
import { supabaseAdmin } from "@/lib/supabase/admin.node";
const db = supabaseAdmin();
```

### App Context Resolution

Use `getAppContext(workspaceSlug?)` from `lib/app-context.ts` in layouts/pages to resolve:
- Authenticated user
- User profile
- Workspace list
- Current workspace (by slug or cookie `gv_workspace_id`)
- User's role in workspace
- Effective entitlements (plan + grants)

```typescript
import { getAppContext } from "@/lib/app-context";

export default async function MyPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  
  const workspace = ctx.currentWorkspace;
  const role = ctx.currentRole; // "owner" | "admin" | "member"
  const entitlements = ctx.effectiveEntitlements; // includes plan + grants
  
  // Use workspace.id for queries
  const db = await supabaseServer();
  const { data } = await db
    .from("my_table")
    .select("*")
    .eq("workspace_id", workspace.id);
}
```

### Entitlements & Feature Gating

**Check Entitlements**:
```typescript
import { requireEntitlement } from "@/lib/entitlements/server";

const entitlement = await requireEntitlement(workspace.id, "meta_hub");
if (!entitlement.allowed) {
  return <LockedState reason={entitlement.reason} />;
}
```

**Token Deduction**:
```typescript
import { deductTokens } from "@/lib/tokens";

const result = await deductTokens({
  workspaceId,
  amount: 10,
  reason: "WhatsApp message send",
  metadata: { messageId, to_phone }
});

if (!result.success) {
  throw new Error(`Insufficient tokens: ${result.error}`);
}
```

**Dev Override** (testing with full access):
```bash
# .env.local
DEV_FULL_ACCESS_EMAILS=your-email@example.com
```

---

## Canonical Templates (Copy/Paste)

### Workspace-Scoped API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

const schema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve workspace context
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const validated = schema.parse(body);

    // 3. Perform action with workspace scope
    const db = await supabaseServer();
    const { data, error } = await db
      .from("my_table")
      .insert({
        workspace_id: ctx.currentWorkspace.id,
        user_id: ctx.user.id,
        ...validated,
      })
      .select()
      .single();

    if (error) {
      logger.error("Insert failed", { error, workspace: ctx.currentWorkspace.id });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("API route error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### RLS Policy Skeleton

```sql
-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their workspace's data
CREATE POLICY my_table_workspace_policy ON my_table
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Optional: Admin override (if needed)
CREATE POLICY my_table_admin_policy ON my_table
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = my_table.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
  )
);
```

### Worker Job Template (Idempotency + Retries)

```typescript
import { supabaseAdmin } from "@/lib/supabase/admin.node";
import { logger } from "@/lib/logging";

async function processJob(jobId: string) {
  const db = supabaseAdmin();
  
  // 1. Claim job with SKIP LOCKED (safe for multiple workers)
  const { data: job, error: claimError } = await db
    .from("jobs")
    .update({ status: "claimed", locked_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "queued") // Only claim queued jobs
    .select()
    .single();

  if (claimError || !job) {
    logger.info("Job already claimed or not found", { jobId });
    return;
  }

  try {
    // 2. Execute job logic (idempotent)
    const result = await doWork(job);

    // 3. Mark success
    await db
      .from("jobs")
      .update({ status: "completed", completed_at: new Date().toISOString(), result })
      .eq("id", jobId);

    logger.info("Job completed", { jobId, result });
  } catch (err) {
    // 4. Handle failure with retry
    const attempts = (job.attempts || 0) + 1;
    const maxAttempts = 3;

    if (attempts >= maxAttempts) {
      await db
        .from("jobs")
        .update({ status: "failed", attempts, error: String(err) })
        .eq("id", jobId);
      logger.error("Job failed (max attempts)", { jobId, error: err });
    } else {
      const nextRunAt = new Date(Date.now() + Math.pow(2, attempts) * 60_000); // Exponential backoff
      await db
        .from("jobs")
        .update({ status: "queued", attempts, next_run_at: nextRunAt.toISOString() })
        .eq("id", jobId);
      logger.warn("Job retry scheduled", { jobId, attempts, nextRunAt });
    }
  }
}
```

### Feature Gating Template (Server + UI)

```typescript
// Server-side enforcement
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";

export default async function MyFeaturePage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  
  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "my_feature");

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <MyFeatureUI />
    </FeatureGate>
  );
}
```

---

## Database & Migrations

### Migration Workflow
```bash
# Apply migrations locally
npm run db:push     # Runs scripts/supabase/push.sh

# Verify migration success
npm run db:verify   # Runs scripts/supabase/verify.sh
```

### Migration File Naming
- Format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20260202170000_ops_dev_tools.sql`
- Location: `supabase/migrations/`

### Migration Rules
- ALWAYS enable RLS on new tables
- NEVER bypass RLS unless absolutely required (system-level ops)
- Test with non-superuser roles before deploying
- Document complex policies in comments

---

## Anti-Patterns (NEVER DO THIS)

### ❌ Missing Workspace Scope
```typescript
// BAD: Returns data from ALL workspaces (security breach)
const { data } = await db.from("contacts").select("*");
```

### ❌ Trusting Client Input for Workspace
```typescript
// BAD: Client can send any workspace_id
const body = await req.json();
const workspaceId = body.workspace_id; // NEVER trust this
```

### ❌ Service Role Without Explicit Filter
```typescript
// BAD: Bypasses RLS without workspace filter
const db = supabaseAdmin();
const { data } = await db.from("contacts").select("*");
```

### ❌ Heavy Client Components
```typescript
// BAD: Entire page marked as client component
"use client";
export default function MyPage() {
  // 500 lines of code...
}

// GOOD: Server component delegates to thin client component
export default async function MyPage() {
  const data = await fetchData();
  return <ClientUI data={data} />;
}
```

### ❌ No Zod Validation on API Routes
```typescript
// BAD: No input validation
const body = await req.json();
await db.from("table").insert(body); // Injection risk
```

---

## Definition of Done (DoD) / PR Checklist

Before submitting PR or marking work complete:

- [ ] `npm run lint` passes (no errors)
- [ ] `npm run typecheck` passes (no TypeScript errors)
- [ ] `npm run build` succeeds (no build failures)
- [ ] If migrations changed: `npm run db:push && npm run db:verify`
- [ ] Smoke test steps completed for touched modules (see module playbooks)
- [ ] No secrets leaked (check `.env.local` not committed, no `NEXT_PUBLIC_` for sensitive vars)
- [ ] Workspace scoping verified (all queries filter by `workspace_id`)
- [ ] RLS policies applied and tested (if new tables added)
- [ ] Zod validation added (if new API routes/actions)
- [ ] Error handling and logging implemented (use `lib/logging.ts`)
- [ ] Client components minimized (only where required)

---

## Additional Resources

- **Documentation**: See `docs/` folder for detailed guides (STAGE0_RUNBOOK.md, CONTACTS_IMPLEMENTATION.md, etc.)
- **Proxy/Middleware**: `proxy.ts` handles workspace cookie and auth refresh (Next.js 16 renamed `middleware.ts` to `proxy.ts`)
- **Components**: Use Radix UI primitives from `components/ui/` (shadcn-style); avoid reinventing UI
- **Rate Limiting**: Upstash Redis + DB fallback (`lib/rate-limit.node.ts`)
- **Platform Admin**: Visit `/ops/platform-admin` to grant entitlements (requires `GIGAVIZ_OWNER_EMAILS` allowlist)
- **Audit Logs**: `lib/audit.ts` logs user actions to `audit_logs` table (use `createAuditLog()`)

---

## Platform Audit Scorecard (Feb 2026)

Last audited: **February 21, 2026** — update scores as improvements land.

| Area | Score | Status | Notes |
|------|-------|--------|-------|
| Architecture & Code Quality | 9/10 | ✅ Strong | Next.js 16.1.6 + React 19.2.4, server-first (73% server components), 460+ route files, 271 API routes, 188 pages, 264 components, shared types barrel (`types/index.ts`), Zod v4.3 |
| Authentication & Security | 10/10 | ✅ Hardened | 4-layer auth (59 `requirePlatformAdmin` + 113 `getAppContext`), 721 workspace_id references in API routes, 9 security headers (CSP, HSTS preload, X-Frame DENY, COOP, CORP, Permissions-Policy), CodeQL + Dependabot |
| Database & Data Model | 9/10 | ✅ Mature | 94 migrations, 205 RLS policies on 92+ tables, pgvector for RAG, performance indexes |
| Marketing & SEO | 9/10 | ✅ Strong | JSON-LD on 4 pages, sitemap with hreflang alternates (en/id), OG + Twitter cards, enhanced robots (googleBot), 6 policies |
| Documentation | 7/10 | ✅ Good | copilot-instructions, smoke tests, module playbooks, 20+ docs files |
| Developer Experience | 9/10 | ✅ Strong | Zod env validation (build-time fail-fast), 55+ scripts, typecheck/lint, 6 CI/CD workflows (lint→typecheck→test→build→E2E + CodeQL + cron workers), Vitest 4 + Playwright E2E + mock factories |
| Billing & Monetization | 8.5/10 | ✅ Strong | Token economy mature (wallets, ledger, rates, caps, budget guards), 5-plan hierarchy, 17 billing API routes. **Midtrans LIVE** (IDR). **Xendit BUILT** (USD/SGD, Invoice API, webhook, multi-currency pricing). Dual payment gateway architecture |
| Module Completion | 9.5/10 | ✅ Strong | 7 products: Platform (LIVE), Meta Hub (LIVE), Helper (LIVE), Studio (LIVE, full CRUD), Office (LIVE), Apps (BETA), Marketplace (BETA). 19 workspace modules total |
| Performance & Optimization | 9/10 | ✅ Strong | ISR on 26 pages, 6 dynamic import pages (10 heavy components), CDN cache headers (vercel.json), 6 Suspense boundaries, 113 loading.tsx + 113 error.tsx, font optimization |
| Error Handling & Monitoring | 9.5/10 | ✅ Strong | Sentry in all error boundaries + 3 SDK configs, structured JSON logger (545 usages) with PII scrubbing & correlation IDs, Slack/Discord alerting, `withErrorHandler` on 260/271 API routes (11 intentionally skipped: webhooks/OAuth callbacks), 0 console.log in API routes |
| Testing | 9/10 | ✅ Strong | 80 test files with 1594 assertions. Playwright E2E in CI (6 spec files: marketing + API + critical flows + studio + billing + content). Vitest: 60 lib tests + 12 co-located tests + 8 component tests. Coverage improving |
| Internationalization (i18n) | 8.5/10 | ✅ Strong | next-intl wired, 2 locales (6,223-line message files, 5,557 keys each), 100% key parity, locale switcher, cookie-based detection. 383 `useTranslations`/`getTranslations` calls across all modules. 63 i18n namespaces. ~140 hardcoded strings remain in 3 meta-hub components |

**Overall: 9.0 / 10** (prev 8.8 — Xendit international built (USD/SGD), 1594 tests in 80 files, dual payment gateways, 271 API routes, 264 components, 6 E2E specs, React 19.2.4, Next.js 16.1.6, Zod 4.3.6)

### Module Status Map

| Module | Status | Routes | APIs | Assessment |
|--------|--------|--------|------|------------|
| **Platform** | ✅ LIVE | 7 sub-routes | 9+ | Full RBAC, audit, billing UI, workspace management, teams, roles |
| **Meta Hub** | ✅ LIVE | 17+ sub-routes | 76 | Flagship module. WhatsApp/IG/Messenger, AI reply, automation, CAPI, templates, contacts |
| **Helper** | ✅ LIVE | 8 sub-routes | 21 | AI chat, knowledge base (RAG), CRM insights, workflows, leads |
| **Inbox** | ✅ LIVE | 1 route | via admin/* | Unified inbox across WA/IG/Messenger with threading |
| **Apps** | ⚠️ BETA | 3 routes | 1 | Real catalog querying `apps_catalog` table + request/roadmap pages |
| **Marketplace** | ⚠️ BETA | 3 routes | 1 | Real DB queries (marketplace_items, creators, purchases) + sell page |
| **Studio** | ✅ LIVE | 14 sub-routes | 8 | Full creative suite: Graph (charts+dashboards), Tracks (workflows+runs), Office (documents+templates). CRUD, i18n, entitlements |
| **Office** | ✅ LIVE | 4 sub-routes | 2 | AI-powered documents (5 categories), template library, CRUD + AI prompt |

### Go International Roadmap

```
Phase 1: FOUNDATION (Month 1-2) ← START HERE
├── ✅ Testing: 69 test files, 1454 assertions — Vitest unit tests (55 lib + 12 co-located + 2 component tests) — DONE
├── ✅ Testing (E2E): Playwright installed + 4 spec files (marketing-and-auth, api-endpoints, critical-flows, studio-smoke) + CI job — DONE
├── ✅ Error monitoring: Sentry SDK (client/server/edge), all error boundaries wired — DONE
├── ✅ Error handling: withErrorHandler on 260/271 API routes (11 skipped: webhooks/OAuth callbacks) — DONE
├── ✅ CI/CD: GitHub Actions (6 workflows: lint + typecheck + test + build + coverage + CodeQL + cron workers) — DONE
├── ✅ Loading states: 113 loading.tsx + 113 error.tsx on all route groups + sub-routes — DONE
└── ✅ Payment gateway: **Midtrans LIVE** (Snap + Core API, IDR, webhook settlement). **Xendit BUILT** (Invoice API, IDR/USD/SGD, webhook) — DONE

Phase 2: LOCALIZATION (Month 2-3)
├── ✅ Install next-intl (App Router i18n) — DONE
├── ✅ 2 locales: id (Indonesian) + en (English) — DONE (6,223-line message files each, 5,557 keys, 100% parity)
├── ✅ Locale switcher UI (navbar + footer) — DONE
├── ✅ Locale-aware date/number/currency formatting (lib/i18n/format.ts) — DONE
├── ⚠️ Extract hardcoded strings to JSON message files — IN PROGRESS (383 getTranslations/useTranslations calls, 63 namespaces, ~140 hardcoded strings remain in 3 meta-hub components: InstagramInboxClient, MessengerInboxClient, MetaAdsManagerClient)
└── ⚠️ Multi-currency support (USD, EUR, IDR, SGD) — formatCurrency() ready, pricing page pending

Phase 3: SCALE (Month 3-6)
├── ✅ ISR for marketing pages (revalidate=3600) — DONE (26 pages)
├── ⚠️ Edge runtime for webhooks — BLOCKED (Node.js crypto dependency in webhook handler)
├── ✅ CDN optimization for global latency — DONE (vercel.json cache headers, s-maxage + stale-while-revalidate)
├── ✅ Dynamic imports for heavy client components — DONE (10 components across 6 pages)
├── ✅ Next.js Image optimization — DONE (11 files, ~26 <Image> usages)
├── ⚠️ Tailwind CSS v4 migration — AVAILABLE (currently on v3.4.19, readiness 7/10: zero @apply, single CSS file, CSS vars ready)
├── ⚠️ Regional Supabase instances (US, EU, APAC) — PLANNED (docs/GDPR_COMPLIANCE_PLAN.md)
├── ⚠️ GDPR compliance (data residency, DPA, consent) — PLANNED (docs/GDPR_COMPLIANCE_PLAN.md)
└── ⚠️ SOC 2 readiness documentation — PLANNED (docs/SOC2_READINESS_PLAN.md)

Phase 4: MARKET EXPANSION (Month 6-12)
├── API documentation (OpenAPI/Swagger for 225+ endpoints)
├── Developer portal & partner/reseller program
├── Additional languages (Spanish, Portuguese, Arabic)
├── Enterprise features (SSO, SAML, custom domains)
└── Marketplace launch (templates, plugins)
```

### Target Markets (Priority Order)

1. 🇮🇩 Indonesia (current, expand)
2. 🇸🇬🇲🇾🇹🇭 Southeast Asia (WhatsApp dominant)
3. 🇧🇷🇲🇽 Latin America (WhatsApp massive)
4. 🇮🇳 India (WhatsApp largest market)
5. 🇪🇺 Europe (GDPR compliance required first)

### Competitive Positioning

Gigaviz's strongest differentiator: **all-in-one Meta Business Platform** (WhatsApp + Instagram + Messenger + CAPI + AI Reply) with multi-tenant workspace management.

| Compete With | Gigaviz Advantage | Gap to Close |
|-------------|-------------------|-------------|
| Respond.io | AI Reply + CAPI integration | i18n |
| WATI | Multi-channel (IG, Messenger) | Testing, API docs |
| Twilio | No-code setup, lower cost | Payment gateway, scale |
| Bird (MessageBird) | Integrated CRM (Helper) | Enterprise features (SSO) |

### When Working on Improvements

When tackling any task, always check if it helps close a gap from the scorecard above. Prioritize:
1. ~~**Payment integration**~~ ✅ DONE — **Midtrans LIVE** (Snap + Core API, IDR pricing, webhook settlement → token crediting). **Xendit BUILT** (Invoice API, IDR/USD/SGD, webhook → multi-currency support)
2. **Testing coverage** (⚠️ medium) — 80 test files, 1594 assertions. 6 E2E specs. Need: API route integration tests (5 exist), component tests (8/264), expand E2E (inbox flow)
3. ~~**i18n string extraction**~~ ✅ DONE — 383+ translation calls, 63+ namespaces, 5,570+ keys. All 3 meta-hub components wired (InstagramInboxClient, MessengerInboxClient, MetaAdsManagerClient)
4. ~~**Xendit international**~~ ✅ DONE — Xendit built for USD/SGD markets. 3 API routes (subscribe, topup, webhook), lib/xendit/ (client, invoice, webhook), multi-currency pricing (IDR/USD/SGD), 17 tests
5. ~~**Zod validation gap**~~ ✅ DONE — 271/272 routes validated (99.6%). 1 low-risk gap (ops saved-filters, behind requirePlatformAdmin)
6. ~~**withErrorHandler rollout**~~ ✅ DONE — 261/272 routes wrapped (11 intentionally skipped: webhooks/OAuth)

---

## Ops & Owner Console Audit (Feb 2026)

Last audited: **February 9, 2026**

### Ops Console Score: 8.1 / 10

| Area | Score | Status | Notes |
|------|-------|--------|-------|
| Feature Completeness | 9/10 | ✅ | 28 pages, 25 API routes, 11 server actions, 23 lib modules |
| Audit Trail | 8/10 | ✅ | All mutations logged with before/after snapshots |
| Developer Tools | 9/10 | ✅ | SQL runner (33 tables), API playground, webhook debugger, feature flags |
| Monitoring | 8/10 | ✅ | Health checks, worker heartbeats, metrics, activity dashboard, Slack/Discord alerts |
| Customer Support | 6/10 | ⚠️ | Tickets exist but internal-only, no customer-facing flow |
| Auth & Access Control | 9/10 | ✅ | Layout guard + all routes use requirePlatformAdmin(), null→redirect fixed |
| Security Hardening | 6/10 | ⚠️ | Impersonation alerts, structured logging; still no 2FA, IP allowlist |
| Multi-Staff Scalability | 4/10 | ⚠️ | Activity dashboard added; still single role, no RBAC |
| Alerting & Notifications | 7/10 | ✅ | Slack/Discord/generic webhook alerts for health, impersonation, suspension |
| i18n | 1/10 | 🔴 | All hardcoded English |

### Ops Feature Inventory

| Category | Features | Status |
|----------|----------|--------|
| Workspace Mgmt | God Console, Workspace Browser, Detail, Bulk Ops, Templates | ✅ All functional |
| Customer Ops | Customer Search, Support Tickets (SLA), Canned Responses | ✅ All functional |
| Access Control | Entitlement Manager, Feature Flags (global + per-workspace), Claim | ✅ All functional |
| Monitoring | System Health, Worker Heartbeats, Stale Worker Detection, Activity Dashboard, Slack/Discord Alerts | ✅ All functional |
| Analytics | Business Metrics, Data Exports (CSV/JSON), Saved Reports | ✅ All functional |
| Dev Tools | SQL Runner (read-only), Webhook Debugger, API Playground | ✅ All functional |
| Security | Impersonation (start/end/audit), Audit Trail + Export, Rate Limiting | ✅ All functional |
| Knowledge | Platform KB with RAG (vector search + reindex) | ✅ All functional |

### Ops Auth Architecture

```
TIER 1: Platform Ops (/ops)         — 26 pages, 25 APIs, 11 server actions
├── Auth: platform_admins table + OPS_ENABLED env var
├── Claim: GIGAVIZ_OWNER_EMAILS allowlist → /ops/claim → upsert platform_admins
├── Guard: requirePlatformAdmin() → returns admin context + service-role DB
├── Rate Limit: Upstash Redis (30 req/60s) via assertOpsRateLimit()
└── Audit: All mutations → owner_audit_log with actor + before/after

TIER 2: Owner (/owner)              — DEPRECATED, all 5 routes redirect to /ops

TIER 3: Workspace Admin (/api/admin/*) — 31 API routes
├── Auth: requireAdminOrSupervisorWorkspace() (workspace-scoped, NOT platform)
└── Purpose: Inbox, CRM, teams management within a workspace
```

### Ops Critical Gaps

1. **🔴 No RBAC within ops** — Every platform_admin has identical god-level access. Need: superadmin / ops_manager / support_agent / developer / viewer roles
2. ~~**🔴 Inconsistent auth patterns**~~ — ✅ FIXED (commit e5f2b09): All API routes standardized to requirePlatformAdmin()
3. ~~**🔴 Layout has no auth guard**~~ — ✅ FIXED (commit e5f2b09): ops/layout.tsx now has requirePlatformAdmin() guard
4. ~~**🔴 No alerting**~~ — ✅ FIXED (commit 6558d98): lib/ops/alerts.ts with Slack/Discord/generic webhook support; wired into health, impersonation, suspension
5. ~~**⚠️ SQL Runner whitelist too small**~~ — ✅ FIXED (commit e5f2b09): Expanded from 12 → 33 tables
6. ~~**⚠️ Impersonation has no UI button**~~ — ✅ FIXED (commit e5f2b09): ImpersonateButton on workspace detail
7. ~~**⚠️ Some pages return null instead of redirect**~~ — ✅ FIXED (commit e5f2b09): All 7 pages now use redirect()
8. ~~**⚠️ No ops activity dashboard**~~ — ✅ FIXED (commit 6558d98): /ops/activity with stats, actors, timeline
9. **⚠️ Support tickets internal-only** — No customer-facing submission, no email-to-ticket

### Ops Hardening Roadmap

```
Phase 0.5: OPS HARDENING — ✅ COMPLETE (commits e5f2b09 + 6558d98)
├── ✅ Add auth guard to ops layout.tsx (safety net)
├── ✅ Standardize ALL API routes to requirePlatformAdmin()
├── ✅ Fix pages returning null → use redirect()
├── ✅ Expand SQL Runner whitelist (12 → 33 tables)
├── ✅ Add impersonation button to workspace detail UI
├── ✅ Standardize console.log → logger in all ops routes (20 instances)
├── ✅ Add Slack/Discord webhook alerts (health, impersonation, suspension)
├── ✅ Add loading.tsx + error.tsx to all route groups
├── ✅ Build ops activity dashboard (/ops/activity)
└── ✅ Fix audit page auth to canonical requirePlatformAdmin()

Phase 1 addition (remaining):
├── 🔴 Ops RBAC (superadmin/ops_manager/support_agent/developer/viewer)
├── ⚠️ Customer-facing ticket submission flow
├── ⚠️ Revenue metrics (Xendit + Midtrans dashboards)
├── ⚠️ Wire alertTicketSlaBreach + alertWorkerStale into remaining flows
└── ⚠️ Add 2FA / IP allowlist for ops console
```

---

**Final Note**: If this guidance conflicts with actual code, CODE IS SOURCE OF TRUTH. Update this doc to reflect reality.
