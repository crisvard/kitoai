-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: exchanges
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'exchanges'
  ) THEN '✅ exchanges EXISTS' ELSE '❌ exchanges MISSING - WILL CREATE' END as table_status;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS exchanges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchanges' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchanges' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchanges' AND column_name = 'name') THEN '✅ name' ELSE '❌ name MISSING' END as name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchanges' AND column_name = 'api_key') THEN '✅ api_key' ELSE '❌ api_key MISSING' END as api_key_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchanges' AND column_name = 'is_active') THEN '✅ is_active' ELSE '❌ is_active MISSING' END as is_active_col;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_exchanges_user_id ON exchanges(user_id);

-- Habilitar RLS
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
CREATE POLICY IF NOT EXISTS "exchanges_policy" ON exchanges FOR ALL USING (auth.uid() = user_id);

-- Criar trigger se não existir
CREATE TRIGGER IF NOT EXISTS update_exchanges_updated_at
  BEFORE UPDATE ON exchanges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ exchanges table verification completed!' as status;