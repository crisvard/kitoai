-- Script to create the betting_odds table for the dashboard
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.betting_odds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport TEXT NOT NULL,
    league TEXT,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    home_odds NUMERIC NOT NULL,
    draw_odds NUMERIC,
    away_odds NUMERIC NOT NULL,
    bookmaker TEXT NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.betting_odds ENABLE ROW LEVEL SECURITY;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_betting_odds_last_update ON public.betting_odds(last_update DESC);

-- Create policies for access
DO $$ 
BEGIN
  -- Policy for authenticated users (Read)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'betting_odds' AND policyname = 'Allow authenticated users to read betting_odds'
  ) THEN
    CREATE POLICY "Allow authenticated users to read betting_odds" ON public.betting_odds
    FOR SELECT TO authenticated USING (true);
  END IF;

  -- Policy for service_role (Full Access for Scrapers)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'betting_odds' AND policyname = 'Allow service_role to manage betting_odds'
  ) THEN
    CREATE POLICY "Allow service_role to manage betting_odds" ON public.betting_odds
    FOR ALL TO service_role USING (true);
  END IF;
END $$;
