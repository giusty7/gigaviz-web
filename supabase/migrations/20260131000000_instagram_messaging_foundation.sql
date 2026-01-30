-- Instagram Messaging Tables
-- Migration: instagram_messaging_foundation.sql
-- Description: Foundation tables for Instagram Direct Messages integration

-- Instagram accounts table (business accounts connected to Meta)
CREATE TABLE IF NOT EXISTS public.instagram_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  instagram_business_account_id TEXT NOT NULL, -- Meta's Instagram Business Account ID
  username TEXT,
  profile_picture_url TEXT,
  followers_count INTEGER DEFAULT 0,
  access_token TEXT, -- Encrypted token
  token_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, instagram_business_account_id)
);

-- Instagram conversations/threads
CREATE TABLE IF NOT EXISTS public.instagram_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL, -- Meta's conversation ID
  participant_id TEXT NOT NULL, -- Instagram User ID (IGSID)
  participant_username TEXT,
  participant_name TEXT,
  participant_profile_pic TEXT,
  status TEXT DEFAULT 'open', -- open, pending, closed
  assigned_to UUID REFERENCES auth.users(id),
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, instagram_account_id, thread_id)
);

-- Instagram messages
CREATE TABLE IF NOT EXISTS public.instagram_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.instagram_threads(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL, -- Meta's message ID
  direction TEXT NOT NULL, -- inbound, outbound
  message_type TEXT, -- text, image, video, story_mention, story_reply
  text_content TEXT,
  media_url TEXT,
  media_type TEXT, -- image, video
  story_id TEXT, -- For story mentions/replies
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  status_updated_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  payload_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  sent_at TIMESTAMPTZ,
  UNIQUE(workspace_id, instagram_account_id, message_id)
);

-- Instagram thread tags
CREATE TABLE IF NOT EXISTS public.instagram_thread_tags (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.instagram_threads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (workspace_id, thread_id, tag)
);

-- Instagram thread notes
CREATE TABLE IF NOT EXISTS public.instagram_thread_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.instagram_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS instagram_threads_workspace_status_idx ON public.instagram_threads(workspace_id, status);
CREATE INDEX IF NOT EXISTS instagram_threads_assigned_idx ON public.instagram_threads(assigned_to);
CREATE INDEX IF NOT EXISTS instagram_threads_last_message_idx ON public.instagram_threads(workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS instagram_messages_thread_idx ON public.instagram_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS instagram_messages_status_idx ON public.instagram_messages(status);

-- RLS Policies
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_thread_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_thread_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users access own workspace data
DROP POLICY IF EXISTS instagram_accounts_workspace_policy ON public.instagram_accounts;
CREATE POLICY instagram_accounts_workspace_policy ON public.instagram_accounts
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS instagram_threads_workspace_policy ON public.instagram_threads;
CREATE POLICY instagram_threads_workspace_policy ON public.instagram_threads
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS instagram_messages_workspace_policy ON public.instagram_messages;
CREATE POLICY instagram_messages_workspace_policy ON public.instagram_messages
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS instagram_thread_tags_workspace_policy ON public.instagram_thread_tags;
CREATE POLICY instagram_thread_tags_workspace_policy ON public.instagram_thread_tags
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS instagram_thread_notes_workspace_policy ON public.instagram_thread_notes;
CREATE POLICY instagram_thread_notes_workspace_policy ON public.instagram_thread_notes
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_instagram_accounts_updated_at ON public.instagram_accounts;
CREATE TRIGGER set_instagram_accounts_updated_at
  BEFORE UPDATE ON public.instagram_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_instagram_threads_updated_at ON public.instagram_threads;
CREATE TRIGGER set_instagram_threads_updated_at
  BEFORE UPDATE ON public.instagram_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_instagram_thread_notes_updated_at ON public.instagram_thread_notes;
CREATE TRIGGER set_instagram_thread_notes_updated_at
  BEFORE UPDATE ON public.instagram_thread_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.instagram_accounts IS 'Instagram Business Accounts connected to Gigaviz';
COMMENT ON TABLE public.instagram_threads IS 'Instagram Direct Message conversations';
COMMENT ON TABLE public.instagram_messages IS 'Instagram Direct Messages';
