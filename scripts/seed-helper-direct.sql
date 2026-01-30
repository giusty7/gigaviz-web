-- Direct SQL seeding for Helper data
-- Run this after migrations are applied

-- Seed AI Modes
INSERT INTO public.helper_modes (mode_slug, display_name, description, icon, system_prompt_template, capabilities, is_active)
VALUES
  ('chat', 'Chat', 'General conversation and assistance', '💬', 'You are a helpful AI assistant. Provide clear, concise, and accurate responses.', ARRAY[]::text[], true),
  ('copy', 'Copywriting', 'Generate marketing copy and content', '✍️', 'You are an expert copywriter. Create compelling, engaging content that drives action.', ARRAY[]::text[], true),
  ('summary', 'Summarize', 'Summarize long content into key points', '📝', 'You are a summarization expert. Extract key points and present them clearly and concisely.', ARRAY[]::text[], true),
  ('vision', 'Vision', 'Analyze images and visual content', '👁️', 'You are an AI with vision capabilities. Analyze images and provide detailed, accurate descriptions.', ARRAY['image_analysis']::text[], true),
  ('document', 'Document Analysis', 'Extract insights from documents', '📄', 'You are a document analysis expert. Extract key information and provide structured insights.', ARRAY['document_parsing']::text[], true),
  ('code', 'Code Assistant', 'Help with programming and technical tasks', '💻', 'You are an expert programmer. Provide clear, efficient, and well-documented code solutions.', ARRAY['code_execution']::text[], true),
  ('research', 'Research', 'Deep research and analysis', '🔍', 'You are a research specialist. Conduct thorough analysis and provide well-sourced insights.', ARRAY['web_search', 'citations']::text[], true),
  ('analyst', 'Data Analyst', 'Analyze data and generate insights', '📊', 'You are a data analyst. Analyze data, identify patterns, and provide actionable insights.', ARRAY['data_analysis']::text[], true)
ON CONFLICT (mode_slug) DO NOTHING;

-- Seed Conversation Templates
INSERT INTO public.helper_templates (name, description, icon, category, initial_messages, suggested_mode, visibility, is_active)
VALUES
  ('Sales Outreach', 'Template for sales and outreach messages', '💼', 'sales', '[{"role": "user", "content": "Help me create a compelling sales outreach message"}]'::jsonb, 'copy', 'public', true),
  ('Customer Support', 'Template for customer service interactions', '🎧', 'support', '[{"role": "user", "content": "Help me respond to this customer inquiry professionally"}]'::jsonb, 'chat', 'public', true),
  ('Content Research', 'Template for content creation and research', '📚', 'research', '[{"role": "user", "content": "Help me research and create content about"}]'::jsonb, 'research', 'public', true),
  ('Data Analysis', 'Template for analyzing data and metrics', '📈', 'analytics', '[{"role": "user", "content": "Help me analyze this data and provide insights"}]'::jsonb, 'analyst', 'public', true),
  ('Meeting Summary', 'Template for summarizing meetings and discussions', '🗓️', 'productivity', '[{"role": "user", "content": "Help me summarize this meeting and extract action items"}]'::jsonb, 'summary', 'public', true)
ON CONFLICT DO NOTHING;

-- Seed Workflow Templates
-- Note: Default workflows are created in the migration itself
-- No additional seeding needed here

-- Seed Analytics Jobs
INSERT INTO public.helper_analytics_jobs (job_name, job_type, schedule_cron, is_enabled)
VALUES
  ('refresh_analytics_views', 'refresh_materialized_views', '0 */6 * * *', true),
  ('calculate_daily_costs', 'aggregate_costs', '0 0 * * *', true),
  ('cleanup_old_events', 'archive_old_data', '0 2 * * 0', true)
ON CONFLICT (job_name) DO NOTHING;

-- Verify inserts
SELECT 
  (SELECT count(*) FROM public.helper_modes) as modes_count,
  (SELECT count(*) FROM public.helper_templates) as templates_count,
  (SELECT count(*) FROM public.helper_workflows) as workflows_count,
  (SELECT count(*) FROM public.helper_analytics_jobs) as jobs_count;
