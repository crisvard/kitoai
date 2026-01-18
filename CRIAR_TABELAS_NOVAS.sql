-- ============================================
-- CRIAR TABELAS COMPLETAMENTE NOVAS
-- Execute APENAS se as tabelas NÃO existirem no banco
-- ============================================

-- Verificar se as tabelas existem
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_social_accounts'
  ) THEN 'user_social_accounts EXISTS' ELSE 'user_social_accounts MISSING' END as user_social_accounts_check,

  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'scheduled_posts'
  ) THEN 'scheduled_posts EXISTS' ELSE 'scheduled_posts MISSING' END as scheduled_posts_check;

-- ============================================
-- CRIAR user_social_accounts (APENAS se não existir)
-- ============================================

CREATE TABLE IF NOT EXISTS user_social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_id TEXT,
  account_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_platform CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'))
);

-- ============================================
-- CRIAR scheduled_posts (APENAS se não existir)
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES user_social_accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  platform TEXT NOT NULL,
  post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'scheduled', 'published', 'failed', 'cancelled'))
);

-- ============================================
-- ÍNDICES (serão criados apenas se não existirem)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);

-- ============================================
-- RLS (será habilitado apenas se não estiver)
-- ============================================

ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Políticas (serão criadas apenas se não existirem)
CREATE POLICY "user_social_accounts_policy" ON user_social_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "scheduled_posts_policy" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS (serão criados apenas se não existirem)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_social_accounts_updated_at BEFORE UPDATE ON user_social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Tabelas criadas/verficadas com sucesso! Verifique os resultados acima.' as status;