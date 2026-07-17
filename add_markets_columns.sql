-- Migration: Add corners and cards columns to betting_odds
-- Run this in the Supabase SQL Editor

ALTER TABLE public.betting_odds 
ADD COLUMN IF NOT EXISTS corners_over_odds NUMERIC,
ADD COLUMN IF NOT EXISTS corners_under_odds NUMERIC,
ADD COLUMN IF NOT EXISTS corners_line NUMERIC,
ADD COLUMN IF NOT EXISTS cards_over_odds NUMERIC,
ADD COLUMN IF NOT EXISTS cards_under_odds NUMERIC,
ADD COLUMN IF NOT EXISTS cards_line NUMERIC;
