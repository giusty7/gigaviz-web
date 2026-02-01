-- Rollback Phase 2.3: Support Tickets

DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON public.ops_ticket_comments;
DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON public.ops_support_tickets;
DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.ops_support_tickets;

DROP TABLE IF EXISTS public.ops_ticket_comments CASCADE;
DROP TABLE IF EXISTS public.ops_support_tickets CASCADE;

DROP FUNCTION IF EXISTS public.update_updated_at();
DROP FUNCTION IF EXISTS public.set_ticket_number();
DROP FUNCTION IF EXISTS public.generate_ticket_number();
