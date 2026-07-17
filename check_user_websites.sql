-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: user_websites
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_websites'
  ) THEN '✅ user_websites EXISTS' ELSE '❌ user_websites MISSING - WILL CREATE' END as table_status;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS user_websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  activation_date TIMESTAMP WITH TIME ZONE,
  trial_active BOOLEAN DEFAULT false,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  trial_completed BOOLEAN DEFAULT false,
  access_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_websites' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_websites' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_websites' AND column_name = 'domain') THEN '✅ domain' ELSE '❌ domain MISSING' END as domain_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_websites' AND column_name = 'is_active') THEN '✅ is_active' ELSE '❌ is_active MISSING' END as is_active_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_websites' AND column_name = 'trial_active') THEN '✅ trial_active' ELSE '❌ trial_active MISSING' END as trial_active_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_websites' AND column_name = 'trial_completed') THEN '✅ trial_completed' ELSE '❌ trial_completed MISSING' END as trial_completed_col;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_user_websites_user_id ON user_websites(user_id);

-- Habilitar RLS
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
CREATE POLICY IF NOT EXISTS "user_websites_policy" ON user_websites FOR ALL USING (auth.uid() = user_id);

-- Criar trigger se não existir
CREATE TRIGGER IF NOT EXISTS update_user_websites_updated_at
  BEFORE UPDATE ON user_websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ user_websites table verification completed!' as status;