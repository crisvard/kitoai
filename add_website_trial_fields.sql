-- ============================================
-- ADD WEBSITE TRIAL FIELDS TO PROFILES
-- ============================================

-- Add website trial fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_website_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_website_end_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_trial_website_active ON profiles(trial_website_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_website_end_date ON profiles(trial_website_end_date);
