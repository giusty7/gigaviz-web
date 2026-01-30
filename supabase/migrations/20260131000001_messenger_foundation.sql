-- Facebook Messenger Tables
-- Migration: messenger_foundation.sql
-- Description: Foundation tables for Facebook Messenger integration

-- Facebook Pages table (Pages connected to Messenger)
CREATE TABLE IF NOT EXISTS public.messenger_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL, -- Meta's Page ID
  page_name TEXT,
  page_category TEXT,
  profile_picture_url TEXT,
  access_token TEXT, -- Encrypted token
  token_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, page_id)
);

-- Messenger conversations/threads
CREATE TABLE IF NOT EXISTS public.messenger_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.messenger_pages(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL, -- Meta's conversation ID (PSID-based)
  participant_id TEXT NOT NULL, -- Page-Scoped User ID (PSID)
  participant_name TEXT,
  participant_profile_pic TEXT,
  status TEXT DEFAULT 'open', -- open, pending, closed
  assigned_to UUID REFERENCES auth.users(id),
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, page_id, thread_id)
);

-- Messenger messages
CREATE TABLE IF NOT EXISTS public.messenger_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.messenger_threads(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.messenger_pages(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL, -- Meta's message ID
  direction TEXT NOT NULL, -- inbound, outbound
  message_type TEXT, -- text, image, video, audio, file
  text_content TEXT,
  media_url TEXT,
  media_type TEXT,
  quick_reply_payload TEXT, -- For quick replies
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  status_updated_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  payload_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  sent_at TIMESTAMPTZ,
  UNIQUE(workspace_id, page_id, message_id)
);

-- Messenger thread tags
CREATE TABLE IF NOT EXISTS public.messenger_thread_tags (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.messenger_threads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (workspace_id, thread_id, tag)
);

-- Messenger thread notes
CREATE TABLE IF NOT EXISTS public.messenger_thread_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.messenger_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS messenger_threads_workspace_status_idx ON public.messenger_threads(workspace_id, status);
CREATE INDEX IF NOT EXISTS messenger_threads_assigned_idx ON public.messenger_threads(assigned_to);
CREATE INDEX IF NOT EXISTS messenger_threads_last_message_idx ON public.messenger_threads(workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS messenger_messages_thread_idx ON public.messenger_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messenger_messages_status_idx ON public.messenger_messages(status);

-- RLS Policies
ALTER TABLE public.messenger_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_thread_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_thread_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users access own workspace data
CREATE POLICY messenger_pages_workspace_policy ON public.messenger_pages
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY messenger_threads_workspace_policy ON public.messenger_threads
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY messenger_messages_workspace_policy ON public.messenger_messages
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY messenger_thread_tags_workspace_policy ON public.messenger_thread_tags
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY messenger_thread_notes_workspace_policy ON public.messenger_thread_notes
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_messenger_pages_updated_at
  BEFORE UPDATE ON public.messenger_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_messenger_threads_updated_at
  BEFORE UPDATE ON public.messenger_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_messenger_thread_notes_updated_at
  BEFORE UPDATE ON public.messenger_thread_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.messenger_pages IS 'Facebook Pages connected to Messenger';
COMMENT ON TABLE public.messenger_threads IS 'Facebook Messenger conversations';
COMMENT ON TABLE public.messenger_messages IS 'Facebook Messenger messages';
