-- Add missing columns to wa_thread_notes table
-- Migration: 20260122100000_wa_thread_notes_author_id

-- Add author_id column if not exists
ALTER TABLE public.wa_thread_notes ADD COLUMN IF NOT EXISTS author_id uuid;

-- Add foreign key constraint (optional, won't fail if auth.users doesn't exist in this schema)
-- ALTER TABLE public.wa_thread_notes ADD CONSTRAINT wa_thread_notes_author_id_fkey 
--   FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for author lookups
CREATE INDEX IF NOT EXISTS wa_thread_notes_author_id_idx 
  ON public.wa_thread_notes (author_id);

-- Ensure other expected columns exist
ALTER TABLE public.wa_thread_notes ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.wa_thread_notes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.wa_thread_notes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
