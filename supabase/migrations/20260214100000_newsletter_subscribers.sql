-- Newsletter subscribers table
-- Stores email captures from marketing pages (homepage footer, blog, etc.)
-- No workspace scope needed — these are anonymous visitors.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'homepage',       -- where the signup happened
  locale text NOT NULL DEFAULT 'en',             -- language preference
  status text NOT NULL DEFAULT 'active'          -- active | unsubscribed
    CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint on email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_unique
  ON newsletter_subscribers (lower(email));

-- RLS: no user-facing access (only service role inserts)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon or authenticated
-- Only service role (supabaseAdmin) can read/write
