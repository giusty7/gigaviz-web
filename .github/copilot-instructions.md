# Copilot / AI Assistant Guidance for gigaviz-web

## Summary
- Next.js (App Router) + React + TypeScript web app using Tailwind and Supabase for auth/DB.
- Single-repo app organized by routes (`app/`), UI components (`components/`), and server helpers (`lib/`).

## Big picture
- Routes & UI: `app/` holds route/layout server components. Use `'use client'` only for client components.
- UI composition: primitives in `components/ui`; feature folders live under `components/admin`, `components/app`, etc.
- Server/shared code: put helpers in `lib/` (e.g., `lib/supabase`, `lib/worker`), not in `components/`.
- API surface: App Router handlers live under `app/api/*`. If a top-level `api/*` folder exists, confirm its runtime/usage before moving or consolidating endpoints.
- Worker & scripts: background jobs and ad-hoc tasks live in `scripts/` (`scripts/worker.ts`) and run with `npm run worker`.

## DB & RLS patterns
- Migrations live in `docs/sql/` and must be idempotent:
  - Use `create table if not exists`, `create index if not exists`, and PL/pgSQL guards when needed.
  - Name files `YYYYMMDD_stageX_description.sql`.
- RLS policies follow Supabase patterns using `auth.uid()`; do not bypass `auth.uid()` in policies or queries.
- When adding FKs or RLS, include cleanup steps (e.g., delete orphan rows) in the same migration.

## Key local commands
- `npm run dev` — development server
- `npm run build` && `npm start` — build and production serve
- `npm run worker` — run `scripts/worker.ts`
- `npm run lint` && `npm run typecheck` — quality gates

## Conventions for AI edits
- Keep changes minimal and local to the relevant folder (`app/`, `components/`, `lib/`, `scripts/`).
- Schema changes: add an idempotent SQL file to `docs/sql/` and follow the repo naming pattern.
- Do not change global configs (`next.config.ts`, `tailwind.config.ts`) unless necessary; prefer feature-scoped edits.
- Ensure TypeScript passes: run `npm run typecheck` after edits.

## Integration notes
- Supabase: `@supabase/supabase-js` used via `lib/supabase` (auth + DB).
- Email: Resend is used for transactional emails.
- Analytics: helpers in `components/analytics` for tracked links and pageviews.
- Webhooks & WhatsApp: check route handlers under `app/api/*` (and `api/*` only if present in repo).

## Quick links
- [app/layout.tsx](../app/layout.tsx)
- [app/page.tsx](../app/page.tsx)
- [lib/supabase](../lib/supabase)
- [scripts/worker.ts](../scripts/worker.ts)
- [docs/sql/](../docs/sql/)

## Ask me before
- Moving or consolidating endpoints between `app/api/*` and `api/*` (if `api/*` exists).
- Adding destructive DB migrations or changing RLS policies without a rollback/cleanup step.
- Modifying global build or lint configuration.
