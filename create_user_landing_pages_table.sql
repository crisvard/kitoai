-- TABELA user_landing_pages CORRETA (clone de user_websites)

CREATE TABLE IF NOT EXISTS user_landing_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_name TEXT,
  segment TEXT,
  site_link TEXT,
  status TEXT DEFAULT 'paused',
  notes TEXT,
  payment_id TEXT,
  activated_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT false,
  is_trial BOOLEAN DEFAULT true,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  activation_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  domain_login TEXT,
  domain_password TEXT,
  domain_registrar TEXT,
  github_link TEXT,
  hosting_data JSONB,
  social_links JSONB,
  site_photos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_landing_pages_user_id ON user_landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_landing_pages_status ON user_landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_user_landing_pages_segment ON user_landing_pages(segment);

ALTER TABLE user_landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own landing pages" ON user_landing_pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own landing pages" ON user_landing_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own landing pages" ON user_landing_pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own landing pages" ON user_landing_pages
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_landing_pages_updated_at BEFORE UPDATE ON user_landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
