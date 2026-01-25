-- ============================================================================
-- WhatsApp Contacts & Audience Management - Complete Schema
-- Migration: 20260125210000_wa_contacts_complete.sql
-- Safe: Uses IF NOT EXISTS, IF EXISTS for idempotent upgrades
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE wa_contacts TABLE
-- ============================================================================

-- Add new columns if they don't exist
ALTER TABLE wa_contacts 
  ADD COLUMN IF NOT EXISTS normalized_phone TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS opt_in_status TEXT DEFAULT 'unknown' CHECK (opt_in_status IN ('unknown', 'opted_in', 'opted_out')),
  ADD COLUMN IF NOT EXISTS opt_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opt_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill normalized_phone from existing data if needed
UPDATE wa_contacts 
SET normalized_phone = regexp_replace(COALESCE(phone, wa_id, ''), '[^0-9]', '', 'g')
WHERE normalized_phone IS NULL AND (phone IS NOT NULL OR wa_id IS NOT NULL);

-- Make normalized_phone NOT NULL after backfill
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wa_contacts' AND column_name = 'normalized_phone'
  ) THEN
    EXECUTE 'ALTER TABLE wa_contacts ALTER COLUMN normalized_phone SET NOT NULL';
  END IF;
END $$;

-- Add unique constraint for workspace + normalized_phone
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wa_contacts_workspace_phone_unique'
  ) THEN
    ALTER TABLE wa_contacts 
      ADD CONSTRAINT wa_contacts_workspace_phone_unique 
      UNIQUE (workspace_id, normalized_phone);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS wa_contacts_workspace_phone_idx 
  ON wa_contacts(workspace_id, normalized_phone);

CREATE INDEX IF NOT EXISTS wa_contacts_tags_idx 
  ON wa_contacts USING GIN(tags);

CREATE INDEX IF NOT EXISTS wa_contacts_custom_fields_idx 
  ON wa_contacts USING GIN(custom_fields);

CREATE INDEX IF NOT EXISTS wa_contacts_opt_in_status_idx 
  ON wa_contacts(workspace_id, opt_in_status);

CREATE INDEX IF NOT EXISTS wa_contacts_last_seen_idx 
  ON wa_contacts(workspace_id, last_seen_at DESC);

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_wa_contacts_updated_at ON wa_contacts;
CREATE TRIGGER set_wa_contacts_updated_at
  BEFORE UPDATE ON wa_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ============================================================================
-- 2. CREATE wa_contact_segments TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS wa_contact_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}',
  -- rules format: {
  --   "includeTags": ["tag1", "tag2"],
  --   "excludeTags": ["tag3"],
  --   "customFieldFilters": [{"field": "city", "operator": "equals", "value": "Jakarta"}],
  --   "optInOnly": true
  -- }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wa_contact_segments_workspace_name_unique UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS wa_contact_segments_workspace_idx 
  ON wa_contact_segments(workspace_id);

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for segments
DROP TRIGGER IF EXISTS set_wa_contact_segments_updated_at ON wa_contact_segments;
CREATE TRIGGER set_wa_contact_segments_updated_at
  BEFORE UPDATE ON wa_contact_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_contact_segments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "wa_contacts_workspace_access" ON wa_contacts;
DROP POLICY IF EXISTS "wa_contact_segments_workspace_access" ON wa_contact_segments;

-- wa_contacts: users access contacts in their workspaces
CREATE POLICY "wa_contacts_workspace_access" ON wa_contacts
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- wa_contact_segments: users access segments in their workspaces
CREATE POLICY "wa_contact_segments_workspace_access" ON wa_contact_segments
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to normalize phone number (digits only)
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to count contacts matching segment rules
CREATE OR REPLACE FUNCTION count_segment_contacts(
  p_workspace_id UUID,
  p_rules JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_include_tags TEXT[];
  v_exclude_tags TEXT[];
  v_opt_in_only BOOLEAN;
BEGIN
  -- Extract rules
  v_include_tags := COALESCE((p_rules->>'includeTags')::TEXT[], '{}');
  v_exclude_tags := COALESCE((p_rules->>'excludeTags')::TEXT[], '{}');
  v_opt_in_only := COALESCE((p_rules->>'optInOnly')::BOOLEAN, false);

  -- Build query
  SELECT COUNT(*)
  INTO v_count
  FROM wa_contacts
  WHERE workspace_id = p_workspace_id
    AND (
      cardinality(v_include_tags) = 0 
      OR tags && v_include_tags
    )
    AND (
      cardinality(v_exclude_tags) = 0 
      OR NOT (tags && v_exclude_tags)
    )
    AND (
      NOT v_opt_in_only 
      OR opt_in_status = 'opted_in'
    );

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE wa_contacts IS 'WhatsApp contacts with tags, custom fields, and opt-in status';
COMMENT ON COLUMN wa_contacts.normalized_phone IS 'Phone number in digits-only format (E.164 without +)';
COMMENT ON COLUMN wa_contacts.tags IS 'Array of tags for segmentation';
COMMENT ON COLUMN wa_contacts.custom_fields IS 'Flexible JSON storage for additional contact data';
COMMENT ON COLUMN wa_contacts.opt_in_status IS 'Consent status: unknown, opted_in, opted_out';

COMMENT ON TABLE wa_contact_segments IS 'Audience segments with rule-based definitions';
COMMENT ON COLUMN wa_contact_segments.rules IS 'JSON rules: includeTags, excludeTags, customFieldFilters, optInOnly';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Smoke test:
-- 1. Insert test contact: INSERT INTO wa_contacts (workspace_id, normalized_phone, display_name) VALUES (...);
-- 2. Query with RLS: SELECT * FROM wa_contacts WHERE workspace_id = ...;
-- 3. Create segment: INSERT INTO wa_contact_segments (workspace_id, name, rules) VALUES (...);
-- 4. Test count function: SELECT count_segment_contacts(...);
-- ============================================================================
