-- ============================================================
-- Gigaviz Links — Smart bio pages, QR codes, click-to-WhatsApp
-- ============================================================

-- 1. Bio / link pages
CREATE TABLE IF NOT EXISTS link_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  theme         JSONB NOT NULL DEFAULT '{"bg":"#0f172a","text":"#f5f5dc","accent":"#d4af37","buttonStyle":"filled","radius":"lg"}',
  seo_title     TEXT,
  seo_description TEXT,
  published     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slug must be unique globally (public URLs)
CREATE UNIQUE INDEX IF NOT EXISTS link_pages_slug_unique ON link_pages(slug);
CREATE INDEX IF NOT EXISTS link_pages_workspace_id_idx ON link_pages(workspace_id);

-- 2. Individual link items on a page
CREATE TABLE IF NOT EXISTS link_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id       UUID NOT NULL REFERENCES link_pages(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  url           TEXT,
  link_type     TEXT NOT NULL DEFAULT 'url',  -- url | whatsapp | product | heading | social
  icon          TEXT,                          -- emoji or icon key
  thumbnail_url TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',   -- type-specific: { phone, message, price, currency, ... }
  sort_order    INTEGER NOT NULL DEFAULT 0,
  visible       BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS link_items_page_id_idx ON link_items(page_id);
CREATE INDEX IF NOT EXISTS link_items_workspace_id_idx ON link_items(workspace_id);

-- 3. Click analytics
CREATE TABLE IF NOT EXISTS link_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID NOT NULL REFERENCES link_items(id) ON DELETE CASCADE,
  page_id       UUID NOT NULL REFERENCES link_pages(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  clicked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer      TEXT,
  user_agent    TEXT,
  country       TEXT,
  city          TEXT,
  device_type   TEXT,   -- mobile | desktop | tablet
  ip_hash       TEXT,   -- sha256 of IP for unique visitor detection
  session_id    TEXT    -- to group same-visitor clicks
);

CREATE INDEX IF NOT EXISTS link_clicks_item_id_idx ON link_clicks(item_id);
CREATE INDEX IF NOT EXISTS link_clicks_page_id_idx ON link_clicks(page_id);
CREATE INDEX IF NOT EXISTS link_clicks_workspace_id_idx ON link_clicks(workspace_id);
CREATE INDEX IF NOT EXISTS link_clicks_clicked_at_idx ON link_clicks(clicked_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE link_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- link_pages: workspace members can CRUD their own workspace's pages
CREATE POLICY link_pages_workspace_access ON link_pages
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- link_items: workspace members can CRUD their own workspace's items
CREATE POLICY link_items_workspace_access ON link_items
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- link_clicks: workspace members can read clicks, insert is via service role
CREATE POLICY link_clicks_workspace_read ON link_clicks
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Public read for published pages (used by public bio page route)
-- This uses service role in the API, but we add a policy for safety
CREATE POLICY link_pages_public_read ON link_pages
FOR SELECT USING (published = true);

CREATE POLICY link_items_public_read ON link_items
FOR SELECT USING (
  page_id IN (SELECT id FROM link_pages WHERE published = true)
);
