-- =====================================================
-- Seed / upsert plans table with current pricing (IDR)
-- Matches PLAN_PRICES in lib/midtrans/snap.ts
-- =====================================================

-- Add yearly_price_idr if not exists
ALTER TABLE plans ADD COLUMN IF NOT EXISTS yearly_price_idr int NOT NULL DEFAULT 0;

-- Upsert all plan tiers with current pricing
INSERT INTO plans (code, name, type, monthly_price_idr, yearly_price_idr, seat_limit, price_cents, currency, is_active, meta)
VALUES
  -- Free tier
  ('free',       'Free',       'individual',  0,         0,          1,    0,       'IDR', true,
   '{"tokens_monthly": 500, "features": ["dashboard", "office", "studio"]}'::jsonb),

  ('free_locked', 'Free',      'individual',  0,         0,          1,    0,       'IDR', true,
   '{"tokens_monthly": 500, "legacy": true}'::jsonb),

  -- Starter
  ('starter',    'Starter',    'individual',  149000,    1428000,    3,    14900,   'IDR', true,
   '{"tokens_monthly": 5000, "features": ["meta_hub", "helper", "inbox", "studio", "graph", "tracks"]}'::jsonb),

  -- Growth
  ('growth',     'Growth',     'team',        399000,    3828000,    10,   39900,   'IDR', true,
   '{"tokens_monthly": 25000, "features": ["meta_hub", "helper", "inbox", "studio", "graph", "tracks", "automation", "roles"]}'::jsonb),

  -- Business
  ('business',   'Business',   'team',        899000,    8628000,    25,   89900,   'IDR', true,
   '{"tokens_monthly": 50000, "features": ["meta_hub", "helper", "inbox", "studio", "graph", "tracks", "automation", "roles", "marketplace", "apps", "links"]}'::jsonb),

  -- Enterprise
  ('enterprise', 'Enterprise', 'team',        0,         0,          999,  0,       'IDR', true,
   '{"tokens_monthly": 100000, "custom_pricing": true, "features": ["all"]}'::jsonb),

  -- Legacy plans (mapped to canonical)
  ('ind_starter', 'Starter (Individual)', 'individual', 149000, 1428000, 1, 14900, 'IDR', false,
   '{"legacy": true, "maps_to": "starter"}'::jsonb),

  ('ind_pro',    'Pro (Individual)',      'individual', 399000, 3828000, 1, 39900, 'IDR', false,
   '{"legacy": true, "maps_to": "growth"}'::jsonb),

  ('team_starter', 'Starter (Team)',      'team',       399000, 3828000, 10, 39900, 'IDR', false,
   '{"legacy": true, "maps_to": "growth"}'::jsonb),

  ('team_pro',   'Pro (Team)',            'team',       899000, 8628000, 25, 89900, 'IDR', false,
   '{"legacy": true, "maps_to": "business"}'::jsonb)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  monthly_price_idr = EXCLUDED.monthly_price_idr,
  yearly_price_idr = EXCLUDED.yearly_price_idr,
  seat_limit = EXCLUDED.seat_limit,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active,
  meta = EXCLUDED.meta;
