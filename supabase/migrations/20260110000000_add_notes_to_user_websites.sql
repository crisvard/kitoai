-- Add notes column to user_websites table
-- Required for website service notes functionality

ALTER TABLE public.user_websites
  ADD COLUMN IF NOT EXISTS notes TEXT;