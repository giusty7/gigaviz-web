-- =====================================================
-- FIX: Knowledge search for AI Reply
-- =====================================================
-- The old match_knowledge_chunks RPC searched the chunks table (which is empty)
-- and used wrong column names (status, url). 
-- This new function searches helper_knowledge_sources directly.

CREATE OR REPLACE FUNCTION match_knowledge_sources(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_workspace_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  content_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    hks.id,
    hks.title,
    hks.content_text,
    1 - (hks.embedding <=> query_embedding) as similarity
  FROM helper_knowledge_sources hks
  WHERE hks.workspace_id = p_workspace_id
    AND hks.is_active = true
    AND hks.embedding IS NOT NULL
    AND 1 - (hks.embedding <=> query_embedding) > match_threshold
  ORDER BY hks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Also fix the old match_knowledge_chunks to use correct column names
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_workspace_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  source_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    hkc.id,
    hkc.chunk_text as content,
    hks.title as source_url,
    1 - (hkc.embedding <=> query_embedding) as similarity
  FROM helper_knowledge_chunks hkc
  JOIN helper_knowledge_sources hks ON hks.id = hkc.source_id
  WHERE hks.workspace_id = p_workspace_id
    AND hks.is_active = true
    AND hkc.embedding IS NOT NULL
    AND 1 - (hkc.embedding <=> query_embedding) > match_threshold
  ORDER BY hkc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enable use_knowledge_base for workspaces that have it disabled
-- (only if they have knowledge sources)
UPDATE ai_reply_settings ars
SET use_knowledge_base = true
WHERE use_knowledge_base = false
  AND EXISTS (
    SELECT 1 FROM helper_knowledge_sources hks
    WHERE hks.workspace_id = ars.workspace_id
      AND hks.is_active = true
  );
