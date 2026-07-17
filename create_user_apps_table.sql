-- CLONE EXATO DA TABELA user_websites PARA user_apps

CREATE TABLE IF NOT EXISTS user_apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_name TEXT,
  segment TEXT,
  site_link TEXT,
  status TEXT DEFAULT 'paused',
  notes TEXT,
  payment_id TEXT,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_apps_user_id ON user_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_apps_status ON user_apps(status);
CREATE INDEX IF NOT EXISTS idx_user_apps_segment ON user_apps(segment);

ALTER TABLE user_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own apps" ON user_apps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own apps" ON user_apps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own apps" ON user_apps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own apps" ON user_apps
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_apps_updated_at BEFORE UPDATE ON user_apps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
