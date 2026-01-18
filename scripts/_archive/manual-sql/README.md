Archived manual SQL scripts (moved from `docs/sql` on 2026-01-18).

Purpose:
- These scripts were previously applied manually for WhatsApp inbox, meta hub, invites, RLS, and related features.
- They are retained for reference only to avoid accidental re-application.

How to use:
- Do **not** run these scripts directly. Use Supabase migrations in `supabase/migrations` and the `scripts/supabase/push.sh` flow instead.
- If you need any snippet, copy selectively and convert into a new migration.
