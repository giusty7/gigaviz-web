# Copilot / AI Assistant Guidance for gigaviz-web

## Quick Start (60 seconds)

**Repo**: Gigaviz multi-tenant SaaS platform (Next.js 16 + React 19 + TypeScript + Supabase)  
**MVP**: Inbox & CRM with WhatsApp/Meta Hub integration  
**Roadmap**: 10-product ecosystem (Platform, Meta Hub, Helper, Studio, Apps, Marketplace, Arena, Pay, Community, Trade)

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

## Product Map (10 Modules)

| Module | Status | Entitlement | Routes | Description |
|--------|--------|-------------|--------|-------------|
| **Platform** | LIVE | `core_os` | `/[workspaceSlug]/platform` | Core OS: auth, workspace, billing, roles, audit |
| **Meta Hub** | LIVE | `meta_hub` | `/[workspaceSlug]/meta-hub` | WhatsApp Business Platform: templates, inbox, delivery, automation |
| **Helper** | BETA | `helper` | `/[workspaceSlug]/helper` | AI assistant: chat, copywriting, RAG knowledge base, workflows |
| **Studio** | BETA | `studio` | `/[workspaceSlug]/modules/studio` | Creative suite parent: Office, Graph, Tracks |
| **Apps** | PLACEHOLDER | TBD | `/[workspaceSlug]/apps` | Third-party app integrations (planned) |
| **Marketplace** | PLACEHOLDER | `marketplace` | `/[workspaceSlug]/marketplace` | Template/plugin marketplace (planned) |
| **Arena** | PLACEHOLDER | `arena` | `/[workspaceSlug]/arena` | Competitive insights (planned) |
| **Pay** | PLACEHOLDER | `pay` | `/[workspaceSlug]/pay` | Payment processing (planned) |
| **Community** | PLACEHOLDER | `community` | `/[workspaceSlug]/community` | User forums/support (planned) |
| **Trade** | PLACEHOLDER | `trade` | `/[workspaceSlug]/trade` | E-commerce features (planned) |

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

**Purpose**: Creative and productivity suite (parent module for Office, Graph, Tracks).

**Entry Points**:
- UI: `/[workspaceSlug]/modules/studio`, `/[workspaceSlug]/modules/office`
- Submodules: Office (work templates, formulas), Graph (data viz), Tracks (project management)

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

### Gigaviz Arena (PLACEHOLDER)

**Purpose**: Competitive insights and benchmarking tools.

**Entry Points**: `/[workspaceSlug]/arena` (route exists, UI placeholder)

**Status**: Route scaffolding only; no backend implementation yet.

**Guidance**: When implementing, follow workspace scoping, RLS policies, and entitlement gating patterns.

---

### Gigaviz Pay (PLACEHOLDER)

**Purpose**: Payment processing and invoicing.

**Entry Points**: `/[workspaceSlug]/pay` (route exists, UI placeholder)

**Status**: Route scaffolding only; no backend implementation yet.

**Guidance**: When implementing, follow workspace scoping, RLS policies, and entitlement gating patterns.

---

### Gigaviz Community (PLACEHOLDER)

**Purpose**: User forums and support community.

**Entry Points**: `/[workspaceSlug]/community` (route exists, UI placeholder)

**Status**: Route scaffolding only; no backend implementation yet.

**Guidance**: When implementing, follow workspace scoping, RLS policies, and entitlement gating patterns.

---

### Gigaviz Trade (PLACEHOLDER)

**Purpose**: E-commerce and order management.

**Entry Points**: `/[workspaceSlug]/trade` (route exists, UI placeholder)

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

Last audited: **February 7, 2026** — update scores as improvements land.

| Area | Score | Status | Notes |
|------|-------|--------|-------|
| Architecture & Code Quality | 7/10 | ✅ Solid | Next.js 16 + React 19, server-first, 381 routes |
| Authentication & Security | 8/10 | ✅ Strong | 4-layer auth (proxy→middleware→guard→RLS), Zod on all routes |
| Database & Data Model | 8/10 | ✅ Mature | 85 migrations, RLS on all tables, pgvector for RAG |
| Marketing & SEO | 8/10 | ✅ Good | JSON-LD, sitemap, robots, product pages, 6 policies |
| Documentation | 7/10 | ✅ Good | copilot-instructions, smoke tests, module playbooks |
| Developer Experience | 7/10 | ✅ Good | Zod env validation, 55+ scripts, typecheck/lint |
| Billing & Monetization | 6/10 | ⚠️ Needs Work | Token economy done, NO payment gateway (Stripe/Xendit) |
| Module Completion | 6/10 | ⚠️ 4 Placeholders | Arena, Pay, Community, Trade are placeholder-only |
| Performance & Optimization | 5/10 | ⚠️ Gaps | No loading.tsx, no ISR, no dynamic imports, no edge runtime |
| Error Handling & Monitoring | 4/10 | 🔴 Critical | No Sentry, no route-level error boundaries, console-only logging |
| Testing | 2/10 | 🔴 Critical | npm test = "No tests configured yet", zero automated tests |
| Internationalization (i18n) | 2/10 | 🔴 Not Ready | Hardcoded Indonesian/English mix, no i18n framework |

**Overall: 6.3 / 10**

### Module Status Map

| Module | Status | Routes | Assessment |
|--------|--------|--------|------------|
| **Platform** | ✅ LIVE | 7 sub-routes | Full RBAC, audit, billing UI, workspace management |
| **Meta Hub** | ✅ LIVE | 15 sub-routes, 60+ APIs | Flagship module. WhatsApp/IG/Messenger, AI reply, automation, CAPI |
| **Helper** | ✅ BETA | 9 sub-routes, 18+ APIs | AI chat, knowledge base (RAG), CRM insights, workflows |
| **Studio** | ⚠️ SCAFFOLD | 1 route | Route exists, submodules (Office, Graph, Tracks) under modules/ |
| **Apps** | ⚠️ SCAFFOLD | 3 routes | Integration request form exists |
| **Marketplace** | ⚠️ SCAFFOLD | 3 routes | Basic catalog structure |
| **Arena** | 🔴 PLACEHOLDER | 0 | Page only |
| **Pay** | 🔴 PLACEHOLDER | 0 | Page only — depends on payment gateway |
| **Community** | 🔴 PLACEHOLDER | 0 | Page only |
| **Trade** | 🔴 PLACEHOLDER | 0 | Page only |

### Go International Roadmap

```
Phase 1: FOUNDATION (Month 1-2) ← START HERE
├── 🔴 Testing: Install Vitest + Playwright, 80%+ coverage on auth/security paths
├── 🔴 Error monitoring: Integrate Sentry for error tracking + performance
├── 🔴 CI/CD: GitHub Actions for build/lint/typecheck on every PR
├── ⚠️ Loading states: Add loading.tsx + error.tsx to all major route groups
└── ⚠️ Payment gateway: Stripe (international) + Xendit (SEA)

Phase 2: LOCALIZATION (Month 2-3)
├── Install next-intl (App Router i18n)
├── 2 locales: id (Indonesian) + en (English)
├── Extract hardcoded strings to JSON message files
├── Multi-currency support (USD, EUR, IDR, SGD)
└── Locale-aware date/number formatting

Phase 3: SCALE (Month 3-6)
├── ISR for marketing pages (revalidate = 3600)
├── Edge runtime for webhooks
├── CDN optimization for global latency
├── Regional Supabase instances (US, EU, APAC)
├── GDPR compliance (data residency, DPA, consent)
└── SOC 2 readiness documentation

Phase 4: MARKET EXPANSION (Month 6-12)
├── API documentation (OpenAPI/Swagger for 228+ endpoints)
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
| Respond.io | AI Reply + CAPI integration | i18n, Stripe |
| WATI | Multi-channel (IG, Messenger) | Testing, API docs |
| Twilio | No-code setup, lower cost | Payment gateway, scale |
| Bird (MessageBird) | Integrated CRM (Helper) | Enterprise features (SSO) |

### When Working on Improvements

When tackling any task, always check if it helps close a gap from the scorecard above. Prioritize:
1. **Security & testing** (🔴 critical) — never skip tests for auth/workspace scoping changes
2. **Error handling** (🔴 critical) — add Sentry, error boundaries, loading states
3. **Payment integration** (⚠️ high) — Stripe/Xendit for real revenue
4. **i18n readiness** (⚠️ high) — avoid new hardcoded strings, use constants/enums

---

**Final Note**: If this guidance conflicts with actual code, CODE IS SOURCE OF TRUTH. Update this doc to reflect reality.
