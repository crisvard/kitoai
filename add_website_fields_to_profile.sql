-- ============================================
-- ADD WEBSITE SERVICE FIELDS TO PROFILES
-- ============================================

-- Add website service fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_activation_date TIMESTAMP WITH TIME ZONE;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_website_active ON profiles(website_active);
