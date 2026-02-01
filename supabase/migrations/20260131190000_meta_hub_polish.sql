-- =====================================================
-- META HUB POLISH MIGRATION
-- =====================================================
-- Add Instagram DM and Messenger support
-- Bulk actions infrastructure
-- Enhanced meta messaging capabilities

-- =====================================================
-- 1. INSTAGRAM DIRECT MESSAGES
-- =====================================================

-- Instagram Accounts (like wa_phone_numbers)
create table if not exists public.ig_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Instagram account info
  ig_account_id text not null unique, -- Meta Instagram Business Account ID
  username text not null,
  name text,
  profile_picture_url text,
  
  -- Connection status
  is_active boolean default true,
  access_token_encrypted text, -- Encrypted access token
  token_expires_at timestamptz,
  
  -- Limits
  messaging_limit_tier text default 'standard',
  daily_message_limit integer default 1000,
  
  -- Stats
  followers_count integer default 0,
  following_count integer default 0,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ig_accounts_workspace on public.ig_accounts(workspace_id);
create index if not exists idx_ig_accounts_ig_id on public.ig_accounts(ig_account_id);

-- Instagram Threads (conversations)
create table if not exists public.ig_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  ig_account_id uuid not null references public.ig_accounts(id) on delete cascade,
  
  -- Thread info
  ig_thread_id text not null, -- Meta thread ID
  participant_ig_user_id text not null, -- Instagram user IGID
  participant_username text,
  participant_name text,
  
  -- Conversation state
  status text default 'open' check (status in ('open', 'pending', 'closed', 'archived')),
  last_message_at timestamptz,
  last_message_snippet text,
  unread_count integer default 0,
  
  -- Assignment
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  
  -- Tags
  tags text[] default array[]::text[],
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(ig_account_id, ig_thread_id)
);

create index if not exists idx_ig_threads_workspace on public.ig_threads(workspace_id);
create index if not exists idx_ig_threads_account on public.ig_threads(ig_account_id);
create index if not exists idx_ig_threads_status on public.ig_threads(status);
create index if not exists idx_ig_threads_assigned on public.ig_threads(assigned_to);

-- Instagram Messages
create table if not exists public.ig_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id uuid not null references public.ig_threads(id) on delete cascade,
  ig_account_id uuid not null references public.ig_accounts(id) on delete cascade,
  
  -- Message info
  ig_message_id text not null unique, -- Meta message ID
  direction text not null check (direction in ('incoming', 'outgoing')),
  message_type text not null check (message_type in ('text', 'image', 'video', 'audio', 'story_reply', 'story_mention')),
  
  -- Content
  text_content text,
  media_url text,
  media_type text,
  
  -- Story context (if reply/mention)
  story_id text,
  story_url text,
  
  -- Sender info
  sender_ig_user_id text not null,
  sender_username text,
  
  -- Status
  status text default 'sent' check (status in ('sending', 'sent', 'delivered', 'read', 'failed')),
  
  -- Metadata
  payload_json jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ig_messages_thread on public.ig_messages(thread_id, created_at);
create index if not exists idx_ig_messages_workspace on public.ig_messages(workspace_id);
create index if not exists idx_ig_messages_ig_id on public.ig_messages(ig_message_id);

comment on table public.ig_accounts is 'Instagram Business Accounts for messaging';
comment on table public.ig_threads is 'Instagram Direct Message threads';
comment on table public.ig_messages is 'Instagram DM messages';

-- =====================================================
-- 2. MESSENGER (FACEBOOK MESSAGES)
-- =====================================================

-- Messenger Pages
create table if not exists public.messenger_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Facebook Page info
  page_id text not null unique, -- Meta Page ID
  page_name text not null,
  page_username text,
  page_category text,
  profile_picture_url text,
  
  -- Connection status
  is_active boolean default true,
  access_token_encrypted text,
  token_expires_at timestamptz,
  
  -- Messaging features
  messaging_enabled boolean default true,
  response_time_minutes integer, -- Average response time
  
  -- Stats
  follower_count integer default 0,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messenger_pages_workspace on public.messenger_pages(workspace_id);
create index if not exists idx_messenger_pages_page_id on public.messenger_pages(page_id);

-- Messenger Threads
create table if not exists public.messenger_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.messenger_pages(id) on delete cascade,
  
  -- Thread info
  psid text not null, -- Page-scoped ID for user
  participant_name text,
  participant_profile_pic text,
  
  -- Conversation state
  status text default 'open' check (status in ('open', 'pending', 'closed', 'archived')),
  last_message_at timestamptz,
  last_message_snippet text,
  unread_count integer default 0,
  
  -- Assignment
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  
  -- Tags
  tags text[] default array[]::text[],
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(page_id, psid)
);

create index if not exists idx_messenger_threads_workspace on public.messenger_threads(workspace_id);
create index if not exists idx_messenger_threads_page on public.messenger_threads(page_id);
create index if not exists idx_messenger_threads_status on public.messenger_threads(status);

-- Messenger Messages
create table if not exists public.messenger_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id uuid not null references public.messenger_threads(id) on delete cascade,
  page_id uuid not null references public.messenger_pages(id) on delete cascade,
  
  -- Message info
  message_id text not null unique, -- Meta message ID
  direction text not null check (direction in ('incoming', 'outgoing')),
  message_type text not null check (message_type in ('text', 'image', 'video', 'audio', 'file', 'template')),
  
  -- Content
  text_content text,
  attachments jsonb default '[]'::jsonb,
  
  -- Sender info
  sender_psid text not null,
  
  -- Status
  status text default 'sent' check (status in ('sending', 'sent', 'delivered', 'read', 'failed')),
  
  -- Metadata
  payload_json jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messenger_messages_thread on public.messenger_messages(thread_id, created_at);
create index if not exists idx_messenger_messages_workspace on public.messenger_messages(workspace_id);

comment on table public.messenger_pages is 'Facebook Pages with Messenger enabled';
comment on table public.messenger_threads is 'Messenger conversations';
comment on table public.messenger_messages is 'Messenger messages';

-- =====================================================
-- 3. BULK ACTIONS LOG
-- =====================================================

-- Track bulk operations across all messaging platforms
create table if not exists public.messaging_bulk_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Action info
  action_type text not null check (action_type in ('send_message', 'send_template', 'assign', 'tag', 'close', 'archive', 'delete')),
  platform text not null check (platform in ('whatsapp', 'instagram', 'messenger')),
  
  -- Target
  target_count integer not null,
  filters_json jsonb default '{}'::jsonb, -- Filters used to select targets
  
  -- Execution
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  success_count integer default 0,
  failure_count integer default 0,
  error_log jsonb default '[]'::jsonb,
  
  -- Content (for send actions)
  message_content text,
  template_name text,
  
  -- Metadata
  initiated_by uuid references auth.users(id) on delete set null,
  
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_bulk_actions_workspace on public.messaging_bulk_actions(workspace_id);
create index if not exists idx_bulk_actions_status on public.messaging_bulk_actions(status);
create index if not exists idx_bulk_actions_platform on public.messaging_bulk_actions(platform);

comment on table public.messaging_bulk_actions is 'Bulk messaging operations log';

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Instagram Accounts
alter table public.ig_accounts enable row level security;
drop policy if exists "ig_accounts_workspace_all" on public.ig_accounts;
drop policy if exists ig_accounts_workspace_all on public.ig_accounts;
create policy "ig_accounts_workspace_all"
  on public.ig_accounts
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Instagram Threads
alter table public.ig_threads enable row level security;
drop policy if exists "ig_threads_workspace_all" on public.ig_threads;
drop policy if exists ig_threads_workspace_all on public.ig_threads;
create policy "ig_threads_workspace_all"
  on public.ig_threads
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Instagram Messages
alter table public.ig_messages enable row level security;
drop policy if exists "ig_messages_workspace_all" on public.ig_messages;
drop policy if exists ig_messages_workspace_all on public.ig_messages;
create policy "ig_messages_workspace_all"
  on public.ig_messages
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Messenger Pages
alter table public.messenger_pages enable row level security;
drop policy if exists "messenger_pages_workspace_all" on public.messenger_pages;
drop policy if exists messenger_pages_workspace_all on public.messenger_pages;
create policy "messenger_pages_workspace_all"
  on public.messenger_pages
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Messenger Threads
alter table public.messenger_threads enable row level security;
drop policy if exists "messenger_threads_workspace_all" on public.messenger_threads;
drop policy if exists messenger_threads_workspace_all on public.messenger_threads;
create policy "messenger_threads_workspace_all"
  on public.messenger_threads
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Messenger Messages
alter table public.messenger_messages enable row level security;
drop policy if exists "messenger_messages_workspace_all" on public.messenger_messages;
drop policy if exists messenger_messages_workspace_all on public.messenger_messages;
create policy "messenger_messages_workspace_all"
  on public.messenger_messages
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Bulk Actions
alter table public.messaging_bulk_actions enable row level security;
drop policy if exists "bulk_actions_workspace_all" on public.messaging_bulk_actions;
drop policy if exists bulk_actions_workspace_all on public.messaging_bulk_actions;
create policy "bulk_actions_workspace_all"
  on public.messaging_bulk_actions
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. SEED DATA (for testing)
-- =====================================================

-- Note: No seed data - these require actual Meta API connections
-- Tables ready for production integration
