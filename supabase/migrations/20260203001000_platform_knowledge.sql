-- ============================================================================
-- PLATFORM KNOWLEDGE BASE
-- Global knowledge sources managed by Gigaviz admin (not workspace-scoped)
-- Used by AI to answer questions about Gigaviz platform features
-- ============================================================================

-- Platform knowledge sources (no workspace_id - global)
CREATE TABLE IF NOT EXISTS platform_knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL DEFAULT 'document',
  source_id TEXT, -- external reference if any
  title TEXT NOT NULL,
  content_text TEXT,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, indexed, failed
  indexed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_source_type CHECK (source_type IN ('document', 'article', 'faq', 'guide', 'api_docs', 'tutorial', 'changelog'))
);

-- Platform knowledge chunks (for RAG embeddings)
CREATE TABLE IF NOT EXISTS platform_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES platform_knowledge_sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  embedding vector(1536), -- OpenAI ada-002 embeddings
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_source_chunk UNIQUE (source_id, chunk_index)
);

-- Indexes for efficient search
CREATE INDEX IF NOT EXISTS idx_platform_kb_sources_type ON platform_knowledge_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_platform_kb_sources_status ON platform_knowledge_sources(status);
CREATE INDEX IF NOT EXISTS idx_platform_kb_chunks_source ON platform_knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_platform_kb_chunks_embedding ON platform_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_platform_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS platform_kb_sources_updated_at ON platform_knowledge_sources;
CREATE TRIGGER platform_kb_sources_updated_at
  BEFORE UPDATE ON platform_knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_kb_updated_at();

-- RLS: Only service role can access (managed via API with admin check)
ALTER TABLE platform_knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS policies - access controlled via API auth check
-- These tables are accessed only through service role with GIGAVIZ_OWNER_EMAILS check

COMMENT ON TABLE platform_knowledge_sources IS 'Global Gigaviz platform documentation and knowledge for AI assistant';
COMMENT ON TABLE platform_knowledge_chunks IS 'Chunked content with embeddings for RAG search';

-- ============================================================================
-- VECTOR SEARCH FUNCTIONS
-- ============================================================================

-- Search platform knowledge by vector similarity
CREATE OR REPLACE FUNCTION search_platform_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_id UUID,
  title TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.source_id,
    s.title,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM platform_knowledge_chunks c
  JOIN platform_knowledge_sources s ON s.id = c.source_id
  WHERE s.status = 'indexed'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Search workspace knowledge by vector similarity
CREATE OR REPLACE FUNCTION search_workspace_knowledge(
  p_workspace_id UUID,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_id UUID,
  title TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.source_id,
    s.title,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM helper_knowledge_chunks c
  JOIN helper_knowledge_sources s ON s.id = c.source_id
  WHERE s.workspace_id = p_workspace_id
    AND s.status = 'indexed'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Combined search: workspace first, then platform fallback
CREATE OR REPLACE FUNCTION search_hybrid_knowledge(
  p_workspace_id UUID,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_id UUID,
  title TEXT,
  content TEXT,
  similarity float,
  source_level TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Workspace knowledge (priority)
  SELECT 
    c.id,
    c.source_id,
    s.title,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    'workspace'::TEXT AS source_level
  FROM helper_knowledge_chunks c
  JOIN helper_knowledge_sources s ON s.id = c.source_id
  WHERE s.workspace_id = p_workspace_id
    AND s.status = 'indexed'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  
  UNION ALL
  
  -- Platform knowledge (fallback/supplement)
  SELECT 
    c.id,
    c.source_id,
    s.title,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    'platform'::TEXT AS source_level
  FROM platform_knowledge_chunks c
  JOIN platform_knowledge_sources s ON s.id = c.source_id
  WHERE s.status = 'indexed'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
