-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: user_social_accounts
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_social_accounts'
  ) THEN '✅ user_social_accounts EXISTS' ELSE '❌ user_social_accounts MISSING - WILL CREATE' END as table_status;

-- Criar tabela se não existir
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

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_social_accounts' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_social_accounts' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_social_accounts' AND column_name = 'platform') THEN '✅ platform' ELSE '❌ platform MISSING' END as platform_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_social_accounts' AND column_name = 'account_name') THEN '✅ account_name' ELSE '❌ account_name MISSING' END as account_name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_social_accounts' AND column_name = 'access_token') THEN '✅ access_token' ELSE '❌ access_token MISSING' END as access_token_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_social_accounts' AND column_name = 'is_active') THEN '✅ is_active' ELSE '❌ is_active MISSING' END as is_active_col;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);

-- Habilitar RLS
ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
CREATE POLICY IF NOT EXISTS "user_social_accounts_policy" ON user_social_accounts FOR ALL USING (auth.uid() = user_id);

-- Criar trigger se não existir
CREATE TRIGGER IF NOT EXISTS update_user_social_accounts_updated_at
  BEFORE UPDATE ON user_social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ user_social_accounts table verification completed!' as status;