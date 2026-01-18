-- ============================================
-- CREATE WEBSITE SERVICES TABLE
-- ============================================

-- Create website_services table
CREATE TABLE IF NOT EXISTS website_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_link TEXT,
  domain_login TEXT,
  domain_password TEXT,
  github_link TEXT,
  hosting_data JSONB,
  social_links JSONB DEFAULT '[]'::jsonb,
  site_photos JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_services_user_id ON website_services(user_id);
CREATE INDEX IF NOT EXISTS idx_website_services_status ON website_services(status);
CREATE INDEX IF NOT EXISTS idx_website_services_created_at ON website_services(created_at);

-- Enable RLS
ALTER TABLE website_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own websites" ON website_services;
CREATE POLICY "Users can view own websites"
ON website_services FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own websites" ON website_services;
CREATE POLICY "Users can insert own websites"
ON website_services FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own websites" ON website_services;
CREATE POLICY "Users can update own websites"
ON website_services FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own websites" ON website_services;
CREATE POLICY "Users can delete own websites"
ON website_services FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Add website_services_service_role_policy for admin operations
DROP POLICY IF EXISTS "website_services_service_role_policy" ON website_services;
CREATE POLICY "website_services_service_role_policy"
ON website_services
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
