-- Check if user_websites table exists and create if needed
-- Execute this in Supabase SQL Editor

-- First check if table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_websites';

-- If table doesn't exist, create it (this is a minimal version)
-- Note: You may need to run the full table creation script if the table is missing

-- Add notes column to existing table
ALTER TABLE user_websites ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_websites' AND column_name = 'notes';