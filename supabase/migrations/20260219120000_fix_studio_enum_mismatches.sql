-- Fix enum mismatches between API and DB for Studio module
-- Date: 2026-02-19

-- 1. graph_charts.chart_type: add 'radar' and 'heatmap'
ALTER TABLE public.graph_charts
  DROP CONSTRAINT IF EXISTS graph_charts_chart_type_check;
ALTER TABLE public.graph_charts
  ADD CONSTRAINT graph_charts_chart_type_check
  CHECK (chart_type IN ('line', 'bar', 'pie', 'scatter', 'area', 'funnel', 'table', 'radar', 'heatmap'));

-- 2. graph_charts.data_source: add 'database' and 'csv'
ALTER TABLE public.graph_charts
  DROP CONSTRAINT IF EXISTS graph_charts_data_source_check;
ALTER TABLE public.graph_charts
  ADD CONSTRAINT graph_charts_data_source_check
  CHECK (data_source IN ('manual', 'query', 'api', 'supabase', 'database', 'csv'));

-- 3. office_documents.category: add 'invoice' and 'report'
ALTER TABLE public.office_documents
  DROP CONSTRAINT IF EXISTS office_documents_category_check;
ALTER TABLE public.office_documents
  ADD CONSTRAINT office_documents_category_check
  CHECK (category IN ('document', 'spreadsheet', 'presentation', 'form', 'workflow', 'invoice', 'report'));

-- 4. office_templates.category: same additions
ALTER TABLE public.office_templates
  DROP CONSTRAINT IF EXISTS office_templates_category_check;
ALTER TABLE public.office_templates
  ADD CONSTRAINT office_templates_category_check
  CHECK (category IN ('document', 'spreadsheet', 'presentation', 'form', 'workflow', 'invoice', 'report'));
