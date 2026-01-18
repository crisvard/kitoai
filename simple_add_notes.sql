-- Add notes column to user_websites table
-- Execute this in Supabase SQL Editor

ALTER TABLE "user_websites" ADD COLUMN IF NOT EXISTS "notes" TEXT;