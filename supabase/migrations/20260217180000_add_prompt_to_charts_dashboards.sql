-- Add prompt column to graph_charts and graph_dashboards for AI generation
-- These tables were created in 20260131180000_studio_children.sql without a prompt column.
-- The chart and dashboard CRUD routes (added later) write prompt to these tables.

ALTER TABLE public.graph_charts
ADD COLUMN IF NOT EXISTS prompt text DEFAULT '';

ALTER TABLE public.graph_dashboards
ADD COLUMN IF NOT EXISTS prompt text DEFAULT '';

COMMENT ON COLUMN public.graph_charts.prompt IS 'AI generation prompt for chart data';
COMMENT ON COLUMN public.graph_dashboards.prompt IS 'AI generation prompt for dashboard layout';
