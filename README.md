# Gigaviz Inbox & CRM (MVP)

Shared team inbox and lightweight CRM for WhatsApp conversations. The MVP focuses on routing, ticketing + SLA, internal notes, and basic CRM fields with Supabase + RLS.

## Tech Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres + RLS)
- Tailwind CSS

## Local Setup (npm)

1) Install deps:
```bash
npm install
```

2) Copy env template:
```bash
cp .env.example .env.local
```

3) Fill required variables in `.env.local`.

4) Run dev server:
```bash
npm run dev
```

Open http://localhost:3000

## Environment Variables (Summary)

Reference `.env.example` and do not commit secrets.

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DEFAULT_WORKSPACE_ID`
- `ADMIN_EMAILS`
- `ENABLE_BILLING_TEST_MODE`

Attachments:
- `ATTACHMENTS_BUCKET`
- `ATTACHMENTS_SIGNED_URL_TTL`

WhatsApp:
- `ENABLE_WA_SEND`
- `WA_ACCESS_TOKEN` or `WA_CLOUD_API_TOKEN`
- `WA_PHONE_NUMBER_ID`
- `WA_WABA_ID` (for template management)
- `META_WEBHOOK_VERIFY_TOKEN` or `WA_WEBHOOK_VERIFY_TOKEN` or `WEBHOOK_VERIFY_TOKEN`
- `WA_ADMIN_PHONE`
- `WA_GRAPH_VERSION`

Meta Hub (testing):
- `META_APP_ID`
- `META_APP_SECRET`
- `META_HUB_WA_TEST_DRY_RUN` (optional, set true to avoid live Graph calls)

Template sync note:
- `POST /api/admin/templates/sync` only. Do not open in browser.
- Rotate WA token if it is ever exposed.

App:
- `APP_BASE_URL`
- `RATE_CAP_PER_MIN`
- `RATE_DELAY_MIN_MS`
- `RATE_DELAY_MAX_MS`

Analytics:
- `NEXT_PUBLIC_GA_ID` (optional, GA4 Measurement ID, e.g. `G-XXXXXXXXXX`)

Feature flags:
- `ENABLE_WA_SEND`
- `MERGE_ENABLED` (used by CRM merge routes; add to `.env.local` if needed)
- `SKILL_ROUTING_ENABLED`
- `SUPERVISOR_TAKEOVER_ENABLED`
- `ATTACHMENTS_BUCKET`
- `ATTACHMENTS_SIGNED_URL_TTL`

## Local testing Meta Hub

1) Set Meta Hub env vars in `.env.local`:
   - `META_APP_ID`, `META_APP_SECRET`
   - one of `META_WEBHOOK_VERIFY_TOKEN`, `WA_WEBHOOK_VERIFY_TOKEN`, or `WEBHOOK_VERIFY_TOKEN`
2) Run `npm run dev`.
3) Open `/{workspaceSlug}/meta-hub/connections` to use **Test connection** and **Ping Test**.
4) Open `/{workspaceSlug}/meta-hub/webhooks` to use **Test Webhook Ping**.

## Owner grants / Platform admin panel

1) Add `GIGAVIZ_OWNER_EMAILS` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (owner allowlist for bootstrap).
2) Visit `/ops/platform-admin` (requires login). If not a platform admin yet and your email is allowlisted, click **Claim Platform Admin**.
3) Search any workspace by slug/name, select it, and toggle entitlements (meta_hub, platform, etc.). Optional: set expiry, reason, or payload JSON.
4) Changes write via RPCs (`set_workspace_entitlement*`) and appear immediately across the app (Meta Hub unlocks without the locked banner; module cards show `Granted (owner)`).

## Database Migrations

Apply SQL files in Supabase SQL Editor, in order:

1) `docs/sql/20260102_inbox.sql`
2) `docs/sql/20260103_attachments.sql`
3) `docs/sql/20260104_sla.sql`
4) `docs/sql/20260105_escalations.sql`
5) `docs/sql/20260106_teams.sql`
6) `docs/sql/20260107_crm_fields.sql`
7) `docs/sql/20260108_blacklist.sql`
8) `docs/sql/20260109_merge.sql`
9) `docs/sql/20260110_skill_routing.sql`
10) `docs/sql/20260111_takeover.sql`
11) `docs/sql/20260112_inbox_completeness.sql`
12) `docs/sql/20260113_outbox.sql`
13) `docs/sql/20260114_wa_templates.sql`
14) `docs/sql/20260115_saas.sql`

## Smoke Test Checklist

Local URLs:
- http://localhost:3000/login
- http://localhost:3000/onboarding
- http://localhost:3000/app
- http://localhost:3000/app/billing
- http://localhost:3000/app/tokens
- http://localhost:3000/admin/inbox
- http://localhost:3000/admin/contacts
- http://localhost:3000/admin/inbox/<conversation_id>

Key checks:
- Inbox search matches contact name/phone and message text.
- Notes create/read works (conversation notes).
- Ticket status + priority updates and validation.
- First response timestamp appears after first outbound reply.
- Supervisor login can access inbox without redirect loop.

See `docs/SMOKE_TEST.md` for a copy-paste checklist.

## Troubleshooting

- Windows/OneDrive EPERM during build:
  - Stop dev server, run `npm run clean`, then re-run `npm run build`.
- Redirect loop `/login?error=not_admin`:
  - Ensure user has `workspace_members.role` set to `supervisor` or `admin`.
  - Clear cookies and re-login.
- “Password can’t be viewed”:
  - Reset via Supabase Auth (magic link or password reset).
 - Next.js middleware deprecation warning:
  - Next 16 uses the new proxy entrypoint. Keep `proxy.ts` at the repo root and do not add a separate `middleware.ts`.

## Analytics (GA4)

1) Add `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` to `.env.local`.
2) Open GA4 DebugView or Tag Assistant to verify `page_view` and `cta_click` events.
