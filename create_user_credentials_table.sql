-- ============================================
-- CREATE USER CREDENTIALS TABLE
-- ============================================

-- Create user_credentials table
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- WAHA credentials
  waha_url TEXT,
  waha_api_key TEXT,

  -- N8N credentials
  n8n_url TEXT,
  n8n_api_key TEXT,

  -- Gemini credentials
  gemini_api_key TEXT,

  -- Supabase credentials (for future use)
  supabase_url TEXT,
  supabase_anon_key TEXT,
  supabase_service_role_key TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for user_credentials
CREATE POLICY "Users can view own credentials" ON user_credentials
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" ON user_credentials
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" ON user_credentials
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials" ON user_credentials
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Allow service role full access (for edge functions)
CREATE POLICY "user_credentials_service_role_policy" ON user_credentials
FOR ALL TO service_role USING (true) WITH CHECK (true);