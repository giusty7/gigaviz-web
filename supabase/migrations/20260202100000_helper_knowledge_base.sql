-- =====================================================
-- HELPER KNOWLEDGE BASE & RAG INFRASTRUCTURE
-- =====================================================
-- Enable AI to learn from workspace data with vector embeddings

-- =====================================================
-- 1. ENABLE PGVECTOR EXTENSION
-- =====================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 2. KNOWLEDGE SOURCES (What can Helper learn from?)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Source identification
  source_type text NOT NULL CHECK (source_type IN (
    'kb_article',           -- Knowledge base articles
    'wa_conversation',      -- WhatsApp message threads
    'uploaded_document',    -- User-uploaded files
    'helper_conversation',  -- Past Helper conversations
    'contact',              -- CRM contact notes
    'product_data'          -- Marketplace/product info
  )),
  source_id uuid NOT NULL,  -- ID of the source record
  
  -- Content
  title text,
  content_text text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Embedding
  embedding vector(1536),   -- OpenAI ada-002 dimensionality
  
  -- Status
  indexed_at timestamptz,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Unique constraint: one source = one embedding
  UNIQUE(workspace_id, source_type, source_id)
);

CREATE INDEX idx_helper_knowledge_workspace ON public.helper_knowledge_sources(workspace_id);
CREATE INDEX idx_helper_knowledge_source ON public.helper_knowledge_sources(source_type, source_id);
CREATE INDEX idx_helper_knowledge_active ON public.helper_knowledge_sources(workspace_id, is_active) WHERE is_active = true;

-- Vector similarity search index (IVFFLAT for fast approximate search)
CREATE INDEX idx_helper_knowledge_embedding ON public.helper_knowledge_sources 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMENT ON TABLE public.helper_knowledge_sources IS 'Vector embeddings of workspace content for RAG';
COMMENT ON COLUMN public.helper_knowledge_sources.embedding IS 'OpenAI ada-002 embedding (1536 dimensions)';

-- =====================================================
-- 3. CHUNKED CONTENT (Split long docs into chunks)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.helper_knowledge_sources(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Chunk info
  chunk_index integer NOT NULL,  -- Order in original document
  chunk_text text NOT NULL,
  token_count integer,
  
  -- Embedding
  embedding vector(1536),
  
  -- Metadata
  chunk_metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(source_id, chunk_index)
);

CREATE INDEX idx_helper_chunks_source ON public.helper_knowledge_chunks(source_id);
CREATE INDEX idx_helper_chunks_workspace ON public.helper_knowledge_chunks(workspace_id);

-- Vector search on chunks
CREATE INDEX idx_helper_chunks_embedding ON public.helper_knowledge_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMENT ON TABLE public.helper_knowledge_chunks IS 'Smaller chunks of long documents for better RAG precision';

-- =====================================================
-- 4. CONTEXT USAGE TRACKING (Which sources helped?)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_context_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.helper_messages(id) ON DELETE CASCADE,
  
  -- Context source
  source_id uuid REFERENCES public.helper_knowledge_sources(id) ON DELETE SET NULL,
  chunk_id uuid REFERENCES public.helper_knowledge_chunks(id) ON DELETE SET NULL,
  
  -- Relevance
  similarity_score float,
  ranking_position integer,  -- 1st, 2nd, 3rd most relevant
  
  -- Did it help?
  was_used boolean DEFAULT true,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_helper_context_message ON public.helper_context_usage(message_id);
CREATE INDEX idx_helper_context_source ON public.helper_context_usage(source_id);
CREATE INDEX idx_helper_context_workspace ON public.helper_context_usage(workspace_id);

COMMENT ON TABLE public.helper_context_usage IS 'Track which knowledge sources helped answer questions';

-- =====================================================
-- 5. RAG SETTINGS (Per-workspace configuration)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_rag_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  
  -- Enable/disable RAG
  enabled boolean DEFAULT true,
  
  -- Search parameters
  max_results integer DEFAULT 5 CHECK (max_results BETWEEN 1 AND 20),
  similarity_threshold float DEFAULT 0.7 CHECK (similarity_threshold BETWEEN 0 AND 1),
  
  -- Source preferences (which sources to search)
  enabled_sources text[] DEFAULT ARRAY['kb_article', 'wa_conversation', 'uploaded_document', 'helper_conversation']::text[],
  
  -- Auto-indexing
  auto_index_conversations boolean DEFAULT true,
  auto_index_knowledge_base boolean DEFAULT true,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_helper_rag_settings_workspace ON public.helper_rag_settings(workspace_id);

COMMENT ON TABLE public.helper_rag_settings IS 'Per-workspace RAG configuration';

-- =====================================================
-- 6. HELPER FUNCTIONS FOR SEMANTIC SEARCH
-- =====================================================

-- Function: Search knowledge sources by semantic similarity
CREATE OR REPLACE FUNCTION search_helper_knowledge(
  p_workspace_id uuid,
  p_query_embedding vector(1536),
  p_max_results integer DEFAULT 5,
  p_similarity_threshold float DEFAULT 0.7,
  p_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_type text,
  source_id uuid,
  title text,
  content_text text,
  similarity float,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hks.id,
    hks.source_type,
    hks.source_id,
    hks.title,
    hks.content_text,
    1 - (hks.embedding <=> p_query_embedding) AS similarity,
    hks.metadata
  FROM helper_knowledge_sources hks
  WHERE 
    hks.workspace_id = p_workspace_id
    AND hks.is_active = true
    AND (p_source_types IS NULL OR hks.source_type = ANY(p_source_types))
    AND (1 - (hks.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY hks.embedding <=> p_query_embedding
  LIMIT p_max_results;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_helper_knowledge IS 'Semantic search across workspace knowledge base';

-- Function: Search chunks (for long documents)
CREATE OR REPLACE FUNCTION search_helper_chunks(
  p_workspace_id uuid,
  p_query_embedding vector(1536),
  p_max_results integer DEFAULT 10,
  p_similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id uuid,
  source_id uuid,
  chunk_text text,
  chunk_index integer,
  similarity float,
  source_title text,
  source_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hkc.id,
    hkc.source_id,
    hkc.chunk_text,
    hkc.chunk_index,
    1 - (hkc.embedding <=> p_query_embedding) AS similarity,
    hks.title,
    hks.source_type
  FROM helper_knowledge_chunks hkc
  JOIN helper_knowledge_sources hks ON hks.id = hkc.source_id
  WHERE 
    hkc.workspace_id = p_workspace_id
    AND hks.is_active = true
    AND (1 - (hkc.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY hkc.embedding <=> p_query_embedding
  LIMIT p_max_results;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_helper_chunks IS 'Semantic search at chunk-level for precise retrieval';

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Knowledge Sources
ALTER TABLE public.helper_knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "helper_knowledge_workspace_access"
  ON public.helper_knowledge_sources
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Chunks
ALTER TABLE public.helper_knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "helper_chunks_workspace_access"
  ON public.helper_knowledge_chunks
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Context Usage
ALTER TABLE public.helper_context_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "helper_context_workspace_access"
  ON public.helper_context_usage
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- RAG Settings
ALTER TABLE public.helper_rag_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "helper_rag_settings_workspace_access"
  ON public.helper_rag_settings
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Auto-update updated_at on settings change
CREATE OR REPLACE FUNCTION helper_rag_settings_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER helper_rag_settings_updated_at
  BEFORE UPDATE ON public.helper_rag_settings
  FOR EACH ROW
  EXECUTE FUNCTION helper_rag_settings_update_timestamp();

-- =====================================================
-- 9. INITIAL DATA (Default RAG settings)
-- =====================================================

-- Note: Settings will be created on-demand per workspace
-- No seed data needed

COMMENT ON SCHEMA public IS 'Gigaviz Helper with RAG capabilities';
