-- Add description column to workspaces table
-- This enables workspace settings/update functionality

ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN workspaces.description IS 'Optional workspace description, editable by owner/admin';
