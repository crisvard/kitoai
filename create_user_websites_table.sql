-- Create user_websites table with notes column
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  website_name VARCHAR(255) NOT NULL,
  website_url TEXT,
  segment TEXT,
  status VARCHAR(50) DEFAULT 'paused',
  activated_at TIMESTAMP,
  payment_id VARCHAR(255),
  payment_method VARCHAR(50),
  domain_login TEXT,
  domain_password TEXT,
  domain_registrar TEXT,
  github_link TEXT,
  hosting_data JSONB,
  social_links JSONB DEFAULT '[]'::jsonb,
  site_photos JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_websites_user_id ON user_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_status ON user_websites(status);
CREATE INDEX IF NOT EXISTS idx_user_websites_segment ON user_websites(segment);

-- Enable RLS
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own websites" ON user_websites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own websites" ON user_websites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own websites" ON user_websites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites" ON user_websites
  FOR DELETE USING (auth.uid() = user_id);

-- Verify the table and column were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_websites';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_websites' AND column_name = 'notes';