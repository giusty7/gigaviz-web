# Stage 2 - App Area MVP

## What changed
- Workspace-slug routes for dashboard/modules/tokens/billing; legacy routes redirect.
- Dashboard now includes workspace overview, quick actions, and status section.
- Modules grid shows Locked/Coming soon states and includes Apps + Trade entries.
- Tokens page includes a short explainer and a simple estimator (placeholder rate).
- Billing page includes Individual/Team tiers, token usage note, and CTA.
- Settings adds members management list with remove/leave actions and invite placeholder.

## Manual test (local)
1. Login with a verified user and open `/app`.
2. Confirm redirect to `/app/{workspaceSlug}/dashboard`.
3. Switch workspace from the header dropdown and verify sidebar links include the new slug.
4. Open `/app/{workspaceSlug}/modules`:
   - Locked/Coming soon badges show.
   - Clicking locked/coming soon shows toast.
5. Open `/app/{workspaceSlug}/tokens`:
   - Estimator updates when changing input.
   - Top up button is disabled.
6. Open `/app/{workspaceSlug}/billing`:
   - Individual/Team cards render.
   - CTA button present.
7. Open `/app/settings#members`:
   - Member list renders with roles.
   - Remove works for owner/admin (non-last owner).
   - Leave works for non-owner.

## Manual test (production)
Repeat the local steps against the production URL with real workspaces and roles.
