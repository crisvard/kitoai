-- Migration: Add notes column to user_websites table
-- Execute this SQL in your Supabase SQL Editor

-- First, check if the table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_websites';

-- Add the notes column (using quotes to avoid reserved word issues)
ALTER TABLE public.user_websites
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_websites'
AND column_name = 'notes';