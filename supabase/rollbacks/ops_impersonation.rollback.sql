-- Rollback Phase 2.2: User Impersonation

DROP FUNCTION IF EXISTS public.ops_get_active_impersonation(uuid);
DROP FUNCTION IF EXISTS public.ops_end_impersonation(uuid);
DROP FUNCTION IF EXISTS public.ops_start_impersonation(uuid, uuid, text, interval);

DROP TABLE IF EXISTS public.ops_impersonations CASCADE;
