-- =====================================================
-- PHASE 3: MULTI-MODAL AI SUPPORT
-- =====================================================
-- Enable Helper to process images, documents, audio, and more

-- =====================================================
-- 1. FILE ATTACHMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Context
  message_id uuid REFERENCES public.helper_messages(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.helper_conversations(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- File metadata
  file_name text NOT NULL,
  file_size bigint NOT NULL, -- bytes
  mime_type text NOT NULL,
  storage_path text NOT NULL, -- Supabase Storage path
  
  -- Classification
  attachment_type text NOT NULL CHECK (attachment_type IN (
    'image',      -- JPG, PNG, WebP, etc.
    'document',   -- PDF, Word, Excel, etc.
    'audio',      -- MP3, WAV, etc.
    'video',      -- MP4, etc.
    'other'
  )),
  
  -- Processing status
  processing_status text DEFAULT 'pending' CHECK (processing_status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),
  
  -- Extracted data
  extracted_text text, -- OCR or transcription result
  metadata jsonb DEFAULT '{}'::jsonb, -- dimensions, duration, etc.
  analysis_result jsonb, -- AI analysis (GPT-4 Vision, etc.)
  
  -- Embedding for semantic search
  embedding vector(1536),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_helper_attachments_workspace ON public.helper_attachments(workspace_id);
CREATE INDEX idx_helper_attachments_message ON public.helper_attachments(message_id);
CREATE INDEX idx_helper_attachments_conversation ON public.helper_attachments(conversation_id);
CREATE INDEX idx_helper_attachments_type ON public.helper_attachments(attachment_type);
CREATE INDEX idx_helper_attachments_status ON public.helper_attachments(processing_status);

-- Vector similarity search index
CREATE INDEX idx_helper_attachments_embedding ON public.helper_attachments 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON TABLE public.helper_attachments IS 'Multi-modal attachments for Helper conversations';
COMMENT ON COLUMN public.helper_attachments.extracted_text IS 'OCR/transcription output for searchability';

-- Enable RLS
ALTER TABLE public.helper_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_workspace_attachments"
ON public.helper_attachments
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 2. ENHANCED MESSAGE TYPES
-- =====================================================

-- Extend helper_messages for multi-modal content
ALTER TABLE public.helper_messages
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'text' CHECK (content_type IN (
  'text',
  'image',
  'document',
  'audio',
  'mixed' -- Text + attachments
));

ALTER TABLE public.helper_messages
ADD COLUMN IF NOT EXISTS attachments_count integer DEFAULT 0;

CREATE INDEX idx_helper_messages_content_type ON public.helper_messages(content_type);

-- =====================================================
-- 3. ADVANCED MODES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Mode identification
  mode_slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text NOT NULL,
  icon text,
  
  -- Behavior
  system_prompt_template text NOT NULL,
  suggested_model text, -- 'gpt-4-vision', 'claude-3-opus', etc.
  capabilities text[] DEFAULT ARRAY[]::text[], -- ['vision', 'code', 'analysis']
  
  -- Configuration
  default_settings jsonb DEFAULT '{}'::jsonb,
  requires_attachment boolean DEFAULT false,
  
  -- Access control
  required_entitlements text[] DEFAULT ARRAY[]::text[],
  is_beta boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default modes
INSERT INTO public.helper_modes (
  mode_slug,
  display_name,
  description,
  icon,
  system_prompt_template,
  capabilities,
  is_active
) VALUES
(
  'chat',
  'Chat',
  'General conversation and assistance',
  '💬',
  'You are a helpful AI assistant. Provide clear, concise, and accurate responses.',
  ARRAY[]::text[],
  true
),
(
  'copy',
  'Copywriting',
  'Generate marketing copy and content',
  '✍️',
  'You are an expert copywriter. Create compelling, engaging content that drives action.',
  ARRAY[]::text[],
  true
),
(
  'summary',
  'Summarize',
  'Summarize long content into key points',
  '📝',
  'You are a summarization expert. Extract key points and present them clearly and concisely.',
  ARRAY[]::text[],
  true
),
(
  'vision',
  'Image Analysis',
  'Analyze and describe images in detail',
  '👁️',
  'You are an expert in visual analysis. Describe images accurately and extract relevant information.',
  ARRAY['vision']::text[],
  true
),
(
  'document',
  'Document Analysis',
  'Extract and analyze information from documents',
  '📄',
  'You are a document analysis expert. Extract structured information and provide insights.',
  ARRAY['document']::text[],
  true
),
(
  'code',
  'Code Assistant',
  'Help with programming and technical tasks',
  '💻',
  'You are an expert programmer. Provide clean, efficient code with clear explanations.',
  ARRAY['code']::text[],
  true
),
(
  'research',
  'Research Mode',
  'Multi-step research with comprehensive analysis',
  '🔬',
  'You are a research assistant. Conduct thorough analysis and provide well-researched answers with sources.',
  ARRAY['research']::text[],
  true
),
(
  'analyst',
  'Data Analysis',
  'Analyze data and generate insights',
  '📊',
  'You are a data analyst. Identify patterns, trends, and actionable insights from data.',
  ARRAY['analysis']::text[],
  true
);

CREATE INDEX idx_helper_modes_slug ON public.helper_modes(mode_slug);
CREATE INDEX idx_helper_modes_active ON public.helper_modes(is_active) WHERE is_active = true;

COMMENT ON TABLE public.helper_modes IS 'Advanced AI modes with specialized capabilities';

-- Add mode to conversations
ALTER TABLE public.helper_conversations
ADD COLUMN IF NOT EXISTS mode_slug text REFERENCES public.helper_modes(mode_slug) DEFAULT 'chat';

CREATE INDEX idx_helper_conversations_mode ON public.helper_conversations(mode_slug);

-- =====================================================
-- 4. PROCESSING QUEUE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_processing_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Task info
  task_type text NOT NULL CHECK (task_type IN (
    'ocr',           -- Extract text from image
    'transcribe',    -- Audio to text
    'analyze_image', -- GPT-4 Vision analysis
    'parse_document',-- PDF/Doc parsing
    'generate_embedding' -- Vector embedding
  )),
  
  attachment_id uuid REFERENCES public.helper_attachments(id) ON DELETE CASCADE,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),
  
  -- Execution
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error_message text,
  result jsonb,
  
  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Priority
  priority integer DEFAULT 5 -- 1=highest, 10=lowest
);

CREATE INDEX idx_helper_processing_queue_status ON public.helper_processing_queue(status, priority);
CREATE INDEX idx_helper_processing_queue_attachment ON public.helper_processing_queue(attachment_id);

COMMENT ON TABLE public.helper_processing_queue IS 'Background processing queue for multi-modal content';

-- Enable RLS
ALTER TABLE public.helper_processing_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_workspace_processing"
ON public.helper_processing_queue
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 5. REASONING & PLANNING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_reasoning_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Context
  message_id uuid NOT NULL REFERENCES public.helper_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.helper_conversations(id) ON DELETE CASCADE,
  
  -- Step info
  step_number integer NOT NULL,
  step_type text NOT NULL CHECK (step_type IN (
    'planning',      -- Initial task breakdown
    'research',      -- Information gathering
    'analysis',      -- Data analysis
    'synthesis',     -- Combining information
    'verification',  -- Checking facts
    'conclusion'     -- Final answer
  )),
  
  -- Content
  thought text NOT NULL,
  action text,
  observation text,
  
  -- Timing
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(message_id, step_number)
);

CREATE INDEX idx_helper_reasoning_steps_message ON public.helper_reasoning_steps(message_id);
CREATE INDEX idx_helper_reasoning_steps_conversation ON public.helper_reasoning_steps(conversation_id);

COMMENT ON TABLE public.helper_reasoning_steps IS 'Chain-of-thought reasoning steps for transparency';

-- Enable RLS
ALTER TABLE public.helper_reasoning_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_workspace_reasoning"
ON public.helper_reasoning_steps
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 6. HELPER FUNCTIONS FOR MULTI-MODAL
-- =====================================================

-- Function to search attachments by semantic similarity
CREATE OR REPLACE FUNCTION search_helper_attachments(
  p_workspace_id uuid,
  p_query_embedding vector(1536),
  p_limit integer DEFAULT 10,
  p_threshold float DEFAULT 0.7
) RETURNS TABLE (
  id uuid,
  file_name text,
  attachment_type text,
  extracted_text text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.file_name,
    a.attachment_type,
    a.extracted_text,
    1 - (a.embedding <=> p_query_embedding) as similarity
  FROM helper_attachments a
  WHERE 
    a.workspace_id = p_workspace_id
    AND a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> p_query_embedding) >= p_threshold
  ORDER BY a.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next processing task
CREATE OR REPLACE FUNCTION get_next_processing_task()
RETURNS TABLE (
  id uuid,
  task_type text,
  attachment_id uuid,
  workspace_id uuid
) AS $$
BEGIN
  RETURN QUERY
  UPDATE helper_processing_queue
  SET 
    status = 'processing',
    started_at = now(),
    attempts = attempts + 1
  WHERE id = (
    SELECT q.id
    FROM helper_processing_queue q
    WHERE q.status = 'pending'
    AND q.attempts < q.max_attempts
    ORDER BY q.priority ASC, q.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    helper_processing_queue.id,
    helper_processing_queue.task_type,
    helper_processing_queue.attachment_id,
    helper_processing_queue.workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-queue processing when attachment is created
CREATE OR REPLACE FUNCTION auto_queue_attachment_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue OCR for images
  IF NEW.attachment_type = 'image' THEN
    INSERT INTO helper_processing_queue (
      workspace_id,
      task_type,
      attachment_id,
      priority
    ) VALUES (
      NEW.workspace_id,
      'analyze_image',
      NEW.id,
      3
    );
  END IF;
  
  -- Queue transcription for audio
  IF NEW.attachment_type = 'audio' THEN
    INSERT INTO helper_processing_queue (
      workspace_id,
      task_type,
      attachment_id,
      priority
    ) VALUES (
      NEW.workspace_id,
      'transcribe',
      NEW.id,
      3
    );
  END IF;
  
  -- Queue parsing for documents
  IF NEW.attachment_type = 'document' THEN
    INSERT INTO helper_processing_queue (
      workspace_id,
      task_type,
      attachment_id,
      priority
    ) VALUES (
      NEW.workspace_id,
      'parse_document',
      NEW.id,
      4
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_queue_attachment_processing
AFTER INSERT ON helper_attachments
FOR EACH ROW
EXECUTE FUNCTION auto_queue_attachment_processing();

-- =====================================================
-- 7. STORAGE BUCKET SETUP
-- =====================================================

-- Note: This needs to be run in Supabase dashboard or via API
-- insert into storage.buckets (id, name, public) values ('helper-attachments', 'helper-attachments', false);

-- Storage policies would be:
-- CREATE POLICY "Users upload to own workspace" ON storage.objects FOR INSERT TO authenticated
-- USING (bucket_id = 'helper-attachments' AND (storage.foldername(name))[1] IN (SELECT workspace_id::text FROM workspace_memberships WHERE user_id = auth.uid()));

-- =====================================================
-- 8. ANALYTICS TRACKING
-- =====================================================

ALTER TABLE public.helper_messages
ADD COLUMN IF NOT EXISTS reasoning_steps_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_duration_ms integer;

-- Update stats trigger
CREATE OR REPLACE FUNCTION update_message_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'helper_reasoning_steps' THEN
    UPDATE helper_messages
    SET reasoning_steps_count = (
      SELECT COUNT(*)
      FROM helper_reasoning_steps
      WHERE message_id = NEW.message_id
    )
    WHERE id = NEW.message_id;
  END IF;
  
  IF TG_TABLE_NAME = 'helper_attachments' THEN
    UPDATE helper_messages
    SET attachments_count = (
      SELECT COUNT(*)
      FROM helper_attachments
      WHERE message_id = NEW.message_id
    )
    WHERE id = NEW.message_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_message_stats_reasoning
AFTER INSERT ON helper_reasoning_steps
FOR EACH ROW
EXECUTE FUNCTION update_message_stats();

CREATE TRIGGER trigger_update_message_stats_attachments
AFTER INSERT ON helper_attachments
FOR EACH ROW
EXECUTE FUNCTION update_message_stats();

-- =====================================================
-- DONE: PHASE 3 - MULTI-MODAL AI
-- =====================================================
-- Features enabled:
-- ✅ Image, document, audio, video attachments
-- ✅ GPT-4 Vision integration ready
-- ✅ OCR and transcription pipeline
-- ✅ 8 advanced AI modes
-- ✅ Chain-of-thought reasoning tracking
-- ✅ Semantic search across attachments
-- ✅ Background processing queue
