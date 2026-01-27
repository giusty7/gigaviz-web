# Environment Audit (Jan 27, 2026)

## How the audit was done
- Searched the repo with `rg -o --vimgrep "process\.env\.([A-Z0-9_]+)"` plus `env.*` in `lib/kb/env.ts` to collect usages and file:line references.
- Manually added string-based env fallbacks (e.g., `WA_CLOUD_API_SYSTEM_USER_TOKEN`, `META_SYSTEM_USER_TOKEN`) and migration tooling vars.
- Verified defaults and fallbacks by reading the referenced files (no business logic changed).

## Canonical webhook verify token
- Use `META_WEBHOOK_VERIFY_TOKEN` as the canonical name.
- Aliases still supported in code: `WA_WEBHOOK_VERIFY_TOKEN`, `WEBHOOK_VERIFY_TOKEN`.
- `WA_VERIFY_TOKEN` is legacy/unused (kept only in the legacy section of `.env.example`).

## Used env keys

### Supabase & core app
| ENV KEY | Required? | Scope | Default / Notes | Where used (path:line) |
| --- | --- | --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Yes | public | none (must be set) | app/admin/page.tsx:11; lib/supabase/server.ts:7; next.config.ts:7 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | public | none (must be set) | app/admin/page.tsx:12; lib/supabase/server.ts:8 |
| SUPABASE_SERVICE_ROLE_KEY | Yes (server/admin) | server | throws if missing when admin client created | lib/supabase/admin.ts:10; lib/kb/env.ts:31 |
| SUPABASE_URL | Required for KB | server | none | lib/kb/env.ts:30 |
| SUPABASE_DB_URL | Dev tooling only | server | migrations / backup scripts | scripts/run-migrations.ps1:10; MIGRATE.md:15; scripts/supabase/verify.sh:4 |
| DEFAULT_WORKSPACE_ID | Recommended (admin routes) | server | fallback id for admin APIs | app/api/admin/contacts/route.ts:11; lib/supabase/route.ts:68 |
| APP_BASE_URL | Optional | server | falls back to `req.nextUrl.origin` | app/api/auth/register/route.ts:22; scripts/route-audit.ts:24 |
| NEXT_PUBLIC_APP_URL | Optional | public | falls back to request origin or `https://gigaviz.id` | app/api/workspaces/[workspaceId]/invites/route.ts:118 |
| NEXT_PUBLIC_DEMO_UI | Optional | public | default `false` | app/(app)/(protected)/[workspaceSlug]/meta-hub/messaging/whatsapp/inbox/page.tsx:172 |
| NEXT_PUBLIC_INBOX_SLA_HOURS | Optional | public | default `24` | app/api/meta/whatsapp/inbox/telemetry/route.ts:24 |
| NEXT_PUBLIC_SALES_WA | Optional | public | trimmed, default empty | components/app/ContactSalesDialog.tsx:70 |

### Access control & feature toggles
| ENV KEY | Required? | Scope | Default / Notes | Where used |
| --- | --- | --- | --- | --- |
| ADMIN_EMAILS / ADMIN_EMAIL | Optional | server | allowlist; empty = no admins | lib/admin.ts:3-4; lib/supabase/require-admin.ts:6 |
| GIGAVIZ_OWNER_EMAILS | Optional | server | owner allowlist | lib/platform-admin/server.ts:25 |
| DEV_FULL_ACCESS_EMAILS | Optional dev | server | comma list | app/(app)/(protected)/[workspaceSlug]/meta-hub/webhooks/page.tsx:23 |
| DEV_ADMIN_EMAILS / DEV_ADMIN_EMAIL | Optional dev | server | dev token-credit route | app/api/dev/token-credit/route.ts:13,19 |
| OPS_ENABLED | Optional | server | must be `"1"` to enable ops | lib/ops/guard.ts:4 |
| SUPERVISOR_TAKEOVER_ENABLED | Optional | server | default false | app/api/admin/inbox/threads/[id]/takeover/route.ts:23 |
| SKILL_ROUTING_ENABLED | Optional | server | default false | lib/inbox/routing.ts:46 |
| MERGE_ENABLED | Optional | server | default false | app/api/admin/crm/merge-enabled/route.ts:9 |
| ENABLE_BILLING_TEST_MODE | Optional | server | gates test mode | app/api/subscriptions/test-change/route.ts:11 |
| ENABLE_META_EVENTS_SEND | Optional | server | gates events send | app/api/admin/meta/events/route.ts:272 |

### Email & analytics
| ENV KEY | Required? | Scope | Default / Notes | Where used |
| --- | --- | --- | --- | --- |
| RESEND_API_KEY | Yes (emails) | server | none | app/api/auth/resend-verification/route.ts:44; lib/email.ts:22 |
| RESEND_FROM_AUTH | Yes | server | sender for auth mails | lib/email.ts:4 |
| RESEND_FROM_CONTACT | Yes | server | sender for contact form | lib/email.ts:12 |
| CONTACT_RECIPIENT_EMAIL | Optional | server | default `your-email@example.com` | app/api/contact/route.ts:14 |
| NEXT_PUBLIC_GA_ID | Optional | public | no GA if empty | components/analytics/google-analytics.tsx:3 |

### Meta / OAuth / Webhooks
| ENV KEY | Required? | Scope | Default / Notes | Where used |
| --- | --- | --- | --- | --- |
| META_APP_ID | Yes (Meta OAuth) | server | none | app/api/meta/oauth/callback/route.ts:72 |
| META_APP_SECRET | Yes | server | none | app/api/meta/oauth/callback/route.ts:73; lib/meta/webhooks/whatsapp-handler.ts:90 |
| META_BUSINESS_APP_ID | Optional | server | fallback for subscribed apps | app/api/meta/events/subscribed-apps/route.ts:44 |
| META_BUSINESS_ID | Optional | server | admin connect flows | app/api/admin/meta/connect/wabas/route.ts:21 |
| META_OAUTH_REDIRECT_URI | Optional | server | defaults to origin callback | app/api/meta/whatsapp/connections/embedded-signup/route.ts:85 |
| META_GRAPH_API_VERSION | Optional | server | default `v20.0` (fallback to WA version) | lib/meta/graph.ts:54 |
| META_GRAPH_VERSION | Optional | server | default `v20.0` via `normalizeGraphVersion` | lib/meta/graph.ts:107 |
| META_SYSTEM_USER_TOKEN | Optional | server | fallback token provider | lib/meta/token.ts:36; app/(app)/(protected)/[workspaceSlug]/meta-hub/events/page.tsx:67 |
| META_WHATSAPP_ACCESS_TOKEN | Optional | server | dashboard token check | lib/meta/overview-data.ts:94 |
| NEXT_PUBLIC_META_APP_ID | Yes (client SDK) | public | none | components/meta/FacebookSdkProvider.tsx:15 |
| NEXT_PUBLIC_META_CONFIG_ID | Yes (embedded signup) | public | none | components/meta-hub/WhatsappEmbeddedSignup.tsx:75 |
| NEXT_PUBLIC_META_SOLUTION_ID | Yes (embedded signup) | public | none | components/meta-hub/WhatsappEmbeddedSignup.tsx:76 |
| META_WEBHOOK_VERIFY_TOKEN | Yes (canonical) | server | used for webhook verify | lib/meta/webhooks/whatsapp-handler.ts:82 |
| WA_WEBHOOK_VERIFY_TOKEN | Alias | server | fallback to canonical | lib/meta/webhooks/whatsapp-handler.ts:83 |
| WEBHOOK_VERIFY_TOKEN | Alias | server | fallback to canonical | lib/meta/webhooks/whatsapp-handler.ts:84 |

### WhatsApp Cloud / Messaging
| ENV KEY | Required? | Scope | Default / Notes | Where used |
| --- | --- | --- | --- | --- |
| WA_ACCESS_TOKEN | Required (one of WA_* tokens) | server | used by Meta API calls | app/api/admin/templates/sync/route.ts:38; lib/meta/graph.ts:36 |
| WA_CLOUD_API_TOKEN | Required (one of WA_* tokens) | server | interchangeable with WA_ACCESS_TOKEN | app/api/health/route.ts:11 |
| WA_CLOUD_API_SYSTEM_USER_TOKEN | Required (one of WA_* tokens) | server | system-user variant | lib/meta/token.ts:39; app/api/admin/meta/events/route.ts:103 |
| WA_WABA_ID | Yes (WA ops) | server | none | app/api/admin/meta/connect/wabas/route.ts:24 |
| WA_PHONE_NUMBER_ID | Yes (sending) | server | none | app/api/admin/meta/connect/send-test/route.ts:40 |
| WA_ADMIN_PHONE | Optional | server | admin notification phone | app/api/leads/route.ts:296 |
| WA_GRAPH_VERSION | Optional | server | default `v22.0` (WA); also falls back to `v20.0` in Meta graph helper | lib/wa/cloud.ts:31; lib/meta/graph.ts:54 |
| META_HUB_WA_TEST_DRY_RUN | Optional | server | default false | app/api/meta/whatsapp/test/route.ts:117 |
| META_HUB_ALLOW_PENDING_TEST | Optional | server | default false | app/api/meta/whatsapp/templates/send-test/route.ts:31 |
| META_HUB_WA_ENABLED | Optional | server | default true | lib/meta-hub/config.ts:14 |
| WHATSAPP_ACCESS_TOKEN | Optional alias | server | dashboard check only | lib/meta/overview-data.ts:94 |

### Files, attachments, cron & workers
| ENV KEY | Required? | Scope | Default / Notes | Where used |
| --- | --- | --- | --- | --- |
| ATTACHMENTS_BUCKET | Optional | server | default `inbox-attachments` | app/api/admin/attachments/sign/route.ts:32 |
| ATTACHMENTS_SIGNED_URL_TTL | Optional | server | default `600` seconds | app/api/admin/attachments/sign/route.ts:33 |
| CRON_SECRET | Yes for cron route | server | empty disables auth | app/api/cron/wa-send-worker/route.ts:17 |
| ENABLE_WA_SEND | Optional | server | gates outbound sending | app/api/admin/inbox/threads/[id]/send/route.ts:276; scripts/worker.ts:87 |
| RATE_CAP_PER_MIN | Optional | server | default `0` | scripts/worker.ts:84 |
| RATE_DELAY_MIN_MS | Optional | server | default `800` | scripts/worker.ts:85 |
| RATE_DELAY_MAX_MS | Optional | server | default `2200` | scripts/worker.ts:86 |
| WORKER_ID | Optional | server | worker identifier | scripts/worker.ts:49 |
| WORKER_BATCH_SIZE | Optional | server | default `20` | scripts/worker.ts:83 |
| WORKER_MAX_ATTEMPTS | Optional | server | default `5` | scripts/worker.ts:199 |
| WORKER_POLL_INTERVAL_MS | Optional | server | default `2000` | scripts/worker.ts:252 |

### Helper providers (AI, tools, NLP)
| ENV KEY | Required? | Scope | Default / Notes | Where used |
| --- | --- | --- | --- | --- |
| OPENAI_API_KEY | Optional | server | provider enabled if set | lib/helper/providers/openai.ts:11 |
| ANTHROPIC_API_KEY | Optional | server | provider enabled if set | lib/helper/providers/anthropic.ts:11 |
| GEMINI_API_KEY | Optional | server | provider enabled if set | lib/helper/providers/gemini.ts:11 |
| OLLAMA_URL | Optional | server | default `http://127.0.0.1:11434` | lib/helper/providers/local-shared.ts:6 |
| OLLAMA_MODEL | Optional | server | default `gemma3:4b` | lib/helper/providers/local-shared.ts:5 |
| NLP_API_URL / NLP_SENTIMENT_URL | Optional | server | sentiment endpoint; `SENTIMENT_URL` prefers NLP_SENTIMENT_URL then NLP_API_URL | app/api/meta/whatsapp/inbox/sentiment/route.ts:16 |
| NLP_API_KEY / NLP_SENTIMENT_KEY | Optional | server | API key for sentiment | app/api/meta/whatsapp/inbox/sentiment/route.ts:17 |
| N8N_WEBHOOK_URL | Optional | server | helper tool execution | app/api/helper/tools/execute/route.ts:83 |
| N8N_SHARED_SECRET | Optional | server | shared secret for above | app/api/helper/tools/execute/route.ts:84 |

### Knowledge Base / RAG
| ENV KEY | Required? | Scope | Default / Notes | Where used |
| --- | --- | --- | --- | --- |
| KB_ALLOWED_DOMAINS | Required for KB | server | CSV, min 1 domain | lib/kb/env.ts:32 |
| KB_SITEMAP_URLS | Optional | server | CSV URLs | lib/kb/env.ts:33 |
| KB_SEED_URLS | Optional | server | CSV URLs | lib/kb/env.ts:34 |
| KB_MAX_PAGES_PER_RUN | Optional | server | default `200` | lib/kb/env.ts:35 |
| KB_USER_AGENT | Optional | server | default `GigavizBot/1.0 (+contact email optional)` | lib/kb/env.ts:36 |
| KB_EMBED_PROVIDER | Optional | server | default `openai` | lib/kb/env.ts:37 |
| KB_EMBED_MODEL | Optional | server | default `text-embedding-3-small` | lib/kb/env.ts:38 |
| KB_EMBED_DIM | Optional | server | default `1536` | lib/kb/env.ts:39 |
| KB_CHUNK_MAX_CHARS | Optional | server | default `2200` | lib/kb/env.ts:40 |
| KB_CHUNK_OVERLAP_CHARS | Optional | server | default `200` | lib/kb/env.ts:41 |
| KB_BLOCKED_PATH_PREFIXES | Optional | server | CSV, lowercased in loader | lib/kb/env.ts:42 |
| KB_BLOCKED_QUERY_KEYS | Optional | server | CSV, lowercased | lib/kb/env.ts:43 |

### Platform-provided
| ENV KEY | Required? | Scope | Default / Notes | Where used |
| --- | --- | --- | --- | --- |
| NODE_ENV | Provided by runtime | both | `development` / `production` | many (guards & security checks) |
| VERCEL_ENV | Provided by Vercel | both | matches deployment env | next.config.ts:6; proxy.ts:5 |

### Legacy / unused (kept commented in `.env.example`)
- `WA_VERIFY_TOKEN`
- `BILLING_PROVIDER`, `XENDIT_SECRET_KEY`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`
- `KB_ADMIN_REINDEX_TOKEN`, `KB_INDEX_CRON_ENABLED`

## Duplication / formatting fixes applied
- Removed duplicate `NEXT_PUBLIC_META_APP_ID` entry and all leading tab characters that previously created malformed keys.
- Grouped env keys by domain with comments; no leading spaces before key names.

