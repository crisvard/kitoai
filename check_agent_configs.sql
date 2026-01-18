-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: agent_configs
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'agent_configs'
  ) THEN '✅ agent_configs EXISTS' ELSE '❌ agent_configs MISSING - WILL CREATE' END as table_status;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'agent_name') THEN '✅ agent_name' ELSE '❌ agent_name MISSING' END as agent_name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'system_prompt') THEN '✅ system_prompt' ELSE '❌ system_prompt MISSING' END as system_prompt_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'is_active') THEN '✅ is_active' ELSE '❌ is_active MISSING' END as is_active_col;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_agent_configs_user_id ON agent_configs(user_id);

-- Habilitar RLS
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
CREATE POLICY IF NOT EXISTS "agent_configs_policy" ON agent_configs FOR ALL USING (auth.uid() = user_id);

-- Criar trigger se não existir
CREATE TRIGGER IF NOT EXISTS update_agent_configs_updated_at
  BEFORE UPDATE ON agent_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ agent_configs table verification completed!' as status;