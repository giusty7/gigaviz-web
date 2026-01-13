# Copilot / AI Assistant Guidance for gigaviz-web

## Project Overview
- **Stack**: Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, RLS)
- **Product**: Multi-tenant SaaS platform (Gigaviz) with workspace isolation, billing, and WhatsApp Cloud API
- **Style**: Server-first, secure-by-default, explicit workspace scoping

Copilot should prioritize correctness, security, and existing project conventions over generic patterns.

---

## Core Architecture Rules

### Workspace & Multi-Tenancy
- Every data access MUST be scoped by `workspace_id`
- Workspace membership is resolved via `workspace_memberships`
- RLS is mandatory for all user-facing tables
- Never assume a global workspace or shared data

### Auth & Security
- User identity comes from Supabase Auth (`auth.uid()`)
- API routes that use service role MUST still filter by `workspace_id`
- Do not bypass RLS unless explicitly required (admin/system operations)

---

## Server vs Client Usage

### Server Components (default)
- All routes and layouts are Server Components unless `"use client"` is required
- Prefer server-side data fetching
- Use Supabase server helpers (cookies-based)

### Client Components
- Use `"use client"` only for:
  - Forms
  - Modals / dialogs
  - Browser-only APIs
- Keep client components thin

### API Routes
- Located under `app/api/*`
- Must validate auth and workspace context
- Never trust client input for workspace scope

---

## Entitlements & Billing
- Features are gated by workspace plan
- Plans include: free / individual / team
- Always check feature access before rendering or executing actions
- Token usage is tracked and deducted per action

---

## WhatsApp (Meta Cloud API)
- Webhooks validate Meta signature and payload
- Incoming messages are stored before processing
- Outgoing messages go through an outbox + worker model
- Rate limits apply per workspace

---

## Database & RLS Conventions

### RLS Policy Pattern
```sql
create policy "users_access_own_workspace_data"
on table_name
using (
  workspace_id in (
    select workspace_id
    from workspace_memberships
    where user_id = auth.uid()
  )
);
```
