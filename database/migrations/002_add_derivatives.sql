-- Migration: Add derivative support to photo_files table
-- Date: 2026-01-09
-- Version: 1.0.11

-- Add parent_file_id column for tracking derivative relationships
ALTER TABLE photo_files 
ADD COLUMN IF NOT EXISTS parent_file_id INTEGER REFERENCES photo_files(id) ON DELETE CASCADE;

-- Add derivative_type column for tracking operation type
ALTER TABLE photo_files 
ADD COLUMN IF NOT EXISTS derivative_type VARCHAR(50);

-- Update CHECK constraint to include 'derivative' kind
-- Note: PostgreSQL doesn't support ALTER CHECK constraint directly, so we need to:
-- 1. Drop the existing constraint
-- 2. Add a new constraint with 'derivative' included

-- First, find and drop the existing constraint
DO $$ 
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE photo_files DROP CONSTRAINT IF EXISTS photo_files_kind_check;
    
    -- Add new constraint with 'derivative' included
    ALTER TABLE photo_files ADD CONSTRAINT photo_files_kind_check 
    CHECK (kind IN ('original', 'preview', 'thumbnail', 'derivative'));
END $$;

-- Remove the old UNIQUE constraint that included kind (if it exists)
-- We'll allow multiple derivatives per photo
ALTER TABLE photo_files DROP CONSTRAINT IF EXISTS photo_files_photo_id_kind_key;

-- Create index on parent_file_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_photo_files_parent_file_id ON photo_files(parent_file_id);

-- Create index on derivative_type for filtering
CREATE INDEX IF NOT EXISTS idx_photo_files_derivative_type ON photo_files(derivative_type);
