-- Ensure RLS is enabled and members can read their workspace-scoped records
-- Idempotent: safe to run multiple times.

DO $$
DECLARE
  tbl   TEXT;
  pname TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'meta_webhook_events',
    'wa_webhook_events',
    'wa_threads',
    'wa_messages',
    'wa_thread_tags',
    'wa_thread_notes',
    'wa_phone_numbers',
    'wa_settings',
    'wa_templates',
    'wa_message_status_events'
  ] LOOP

    -- Skip if table doesn't exist
    IF to_regclass(format('public.%I', tbl)) IS NULL THEN
      CONTINUE;
    END IF;

    -- Enable RLS (safe if already enabled)
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Only apply workspace-scoped policy if the table has workspace_id column
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'workspace_id'
    ) THEN
      CONTINUE;
    END IF;

    pname := tbl || '_select_workspace';

    -- Create policy only if it doesn't exist
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl
        AND policyname = pname
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I
         FOR SELECT
         USING (
           workspace_id IN (
             SELECT workspace_id
             FROM public.workspace_memberships
             WHERE user_id = auth.uid()
           )
         );',
        pname,
        tbl
      );
    END IF;

  END LOOP;
END $$;
