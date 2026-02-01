-- Phase 2.3: Support Tickets
-- Platform admins can manage customer support tickets with full tracking

-- ============================================================================
-- 1. ops_support_tickets table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ops_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workspace_slug text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES public.platform_admins(user_id) ON DELETE SET NULL,
  assigned_to_email text,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate ticket number (format: TICK-YYYYMMDD-XXXXX)
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_date text;
  v_count int;
  v_number text;
BEGIN
  v_date := to_char(now(), 'YYYYMMDD');
  
  SELECT COUNT(*) INTO v_count
  FROM public.ops_support_tickets
  WHERE ticket_number LIKE 'TICK-' || v_date || '-%';
  
  v_number := 'TICK-' || v_date || '-' || lpad((v_count + 1)::text, 5, '0');
  RETURN v_number;
END;
$$;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.ops_support_tickets;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.ops_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_number();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ops_tickets_workspace ON public.ops_support_tickets(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_tickets_user ON public.ops_support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_tickets_status ON public.ops_support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_tickets_priority ON public.ops_support_tickets(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_tickets_assigned ON public.ops_support_tickets(assigned_to, created_at DESC) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ops_tickets_number ON public.ops_support_tickets(ticket_number);

-- RLS policies
ALTER TABLE public.ops_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admins_read_tickets" ON public.ops_support_tickets;
DROP POLICY IF EXISTS platform_admins_read_tickets ON public.ops_support_tickets;
CREATE POLICY "platform_admins_read_tickets" ON public.ops_support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "platform_admins_write_tickets" ON public.ops_support_tickets;
DROP POLICY IF EXISTS platform_admins_write_tickets ON public.ops_support_tickets;
CREATE POLICY "platform_admins_write_tickets" ON public.ops_support_tickets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "platform_admins_update_tickets" ON public.ops_support_tickets;
DROP POLICY IF EXISTS platform_admins_update_tickets ON public.ops_support_tickets;
CREATE POLICY "platform_admins_update_tickets" ON public.ops_support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. ops_ticket_comments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ops_ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.ops_support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_email text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ops_ticket_comments_ticket ON public.ops_ticket_comments(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ops_ticket_comments_author ON public.ops_ticket_comments(author_id, created_at DESC);

-- RLS policies
ALTER TABLE public.ops_ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admins_read_comments" ON public.ops_ticket_comments;
DROP POLICY IF EXISTS platform_admins_read_comments ON public.ops_ticket_comments;
CREATE POLICY "platform_admins_read_comments" ON public.ops_ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "platform_admins_write_comments" ON public.ops_ticket_comments;
DROP POLICY IF EXISTS platform_admins_write_comments ON public.ops_ticket_comments;
CREATE POLICY "platform_admins_write_comments" ON public.ops_ticket_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
    AND author_id = auth.uid()
  );

DROP POLICY IF EXISTS "platform_admins_update_comments" ON public.ops_ticket_comments;
DROP POLICY IF EXISTS platform_admins_update_comments ON public.ops_ticket_comments;
CREATE POLICY "platform_admins_update_comments" ON public.ops_ticket_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. Update trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON public.ops_support_tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
  BEFORE UPDATE ON public.ops_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON public.ops_ticket_comments;
CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON public.ops_ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.ops_support_tickets IS 'Platform operations support tickets with status tracking';
COMMENT ON TABLE public.ops_ticket_comments IS 'Comments and notes for support tickets (internal and customer-facing)';
