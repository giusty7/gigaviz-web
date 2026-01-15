-- Gigaviz KB schema (pgvector, sources, chunks, runs, suggestions)

-- Enable pgvector
create extension if not exists vector;

-- Tables
create table if not exists public.gv_kb_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null,
  slug text not null,
  title text null,
  url text null,
  kind text not null check (kind in ('page','doc','release','faq','suggestion')),
  is_public boolean default true,
  content_hash text null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.gv_kb_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.gv_kb_sources(id) on delete cascade,
  workspace_id uuid null,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.gv_kb_index_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('running','success','failed')),
  stats jsonb null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  error text null
);

create table if not exists public.gv_kb_suggestions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null,
  user_id uuid null,
  question text not null,
  context_hint text null,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','accepted','rejected')),
  note text null
);

-- Indexes
create index if not exists gv_kb_sources_workspace_slug_idx on public.gv_kb_sources (workspace_id, slug);
create index if not exists gv_kb_chunks_source_idx on public.gv_kb_chunks (source_id, chunk_index);
create index if not exists gv_kb_chunks_workspace_idx on public.gv_kb_chunks (workspace_id);
create index if not exists gv_kb_chunks_embedding_idx on public.gv_kb_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists gv_kb_suggestions_workspace_idx on public.gv_kb_suggestions (workspace_id);

-- RLS
alter table public.gv_kb_sources enable row level security;
alter table public.gv_kb_chunks enable row level security;
alter table public.gv_kb_index_runs enable row level security;
alter table public.gv_kb_suggestions enable row level security;

-- Enforce RLS even for owners
alter table public.gv_kb_sources force row level security;
alter table public.gv_kb_chunks force row level security;
alter table public.gv_kb_suggestions force row level security;

-- Policies: sources
create policy gv_kb_sources_service_role_full on public.gv_kb_sources
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy gv_kb_sources_public_read on public.gv_kb_sources
  for select using (workspace_id is null and is_public = true);

create policy gv_kb_sources_member_read on public.gv_kb_sources
  for select using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = public.gv_kb_sources.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- Policies: chunks
create policy gv_kb_chunks_service_role_full on public.gv_kb_chunks
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy gv_kb_chunks_public_read on public.gv_kb_chunks
  for select using (
    workspace_id is null and exists (
      select 1 from public.gv_kb_sources s
      where s.id = public.gv_kb_chunks.source_id
        and s.is_public = true
    )
  );

create policy gv_kb_chunks_member_read on public.gv_kb_chunks
  for select using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = public.gv_kb_chunks.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- Policies: index runs (service role only)
create policy gv_kb_index_runs_service_role_full on public.gv_kb_index_runs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Policies: suggestions
create policy gv_kb_suggestions_service_role_full on public.gv_kb_suggestions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy gv_kb_suggestions_member_read on public.gv_kb_suggestions
  for select using (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = public.gv_kb_suggestions.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy gv_kb_suggestions_member_insert on public.gv_kb_suggestions
  for insert with check (
    auth.role() = 'authenticated'
    and (
      workspace_id is null
      or exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = public.gv_kb_suggestions.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );

-- RPC for similarity search with strict scoping
create or replace function public.gv_kb_match_chunks(
  query_embedding vector,
  match_count int,
  workspace_filter uuid,
  include_public boolean,
  kinds text[] default null
) returns table (
  id uuid,
  source_id uuid,
  workspace_id uuid,
  chunk_index int,
  content text,
  embedding vector,
  updated_at timestamptz,
  created_at timestamptz,
  source_title text,
  source_url text,
  source_kind text,
  source_is_public boolean
) language sql security definer set search_path = public as $$
  with params as (
    select
      coalesce(nullif(match_count, 0), 6) as requested_count
  ),
  limited as (
    select least(greatest((select requested_count from params), 1), 50) as limit_count
  )
  select
    c.id,
    c.source_id,
    c.workspace_id,
    c.chunk_index,
    c.content,
    c.embedding,
    c.updated_at,
    c.created_at,
    s.title as source_title,
    s.url as source_url,
    s.kind as source_kind,
    s.is_public as source_is_public
  from public.gv_kb_chunks c
  join public.gv_kb_sources s on s.id = c.source_id
  where (
    (workspace_filter is not null and c.workspace_id = workspace_filter)
    or (include_public = true and c.workspace_id is null and s.is_public = true)
  )
  and (kinds is null or s.kind = any(kinds))
  order by c.embedding <-> query_embedding
  limit (select limit_count from limited);
$$;

grant execute on function public.gv_kb_match_chunks(vector, int, uuid, boolean, text[]) to authenticated, anon;

comment on function public.gv_kb_match_chunks is 'Vector similarity search restricted to workspace scope or public KB.';
