# Rollbacks (manual only)

This folder stores rollback SQL scripts for selected migrations. They are **not** part of Supabase migration history and must never be run via `supabase db push`.

## How to run a rollback safely
1) Open the Supabase Dashboard > SQL editor for the target project.
2) Paste the desired rollback script from this folder (e.g. `ops_support_tickets.rollback.sql`).
3) Review carefully; ensure no concurrent writes to the affected tables.
4) Execute the script. Confirm the intended objects were removed/changed.
5) Consider re-running the forward migration manually if you need to reapply the feature.

## Important warnings
- Do **not** place files in `supabase/migrations/` with a timestamp prefix unless they are real forward migrations.
- Rollback scripts here deliberately omit timestamps to avoid being picked up by `supabase db push`.
- Always back up critical data before running a rollback.
