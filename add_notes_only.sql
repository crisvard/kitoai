-- Add notes column to user_websites table
-- Execute this in Supabase SQL Editor

-- If you get an error that the table doesn't exist, run create_user_websites_table.sql first

ALTER TABLE user_websites ADD COLUMN IF NOT EXISTS notes TEXT;

-- Check if it worked
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_websites' AND column_name = 'notes';