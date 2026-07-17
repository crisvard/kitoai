-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: whatsapp_connections
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'whatsapp_connections'
  ) THEN '✅ whatsapp_connections EXISTS' ELSE '❌ whatsapp_connections MISSING - WILL CREATE' END as table_status;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  phone_number TEXT,
  is_connected BOOLEAN DEFAULT false,
  qr_code TEXT,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_connections' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_connections' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_connections' AND column_name = 'session_name') THEN '✅ session_name' ELSE '❌ session_name MISSING' END as session_name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_connections' AND column_name = 'is_connected') THEN '✅ is_connected' ELSE '❌ is_connected MISSING' END as is_connected_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_connections' AND column_name = 'qr_code') THEN '✅ qr_code' ELSE '❌ qr_code MISSING' END as qr_code_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_connections' AND column_name = 'session_data') THEN '✅ session_data' ELSE '❌ session_data MISSING' END as session_data_col;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id ON whatsapp_connections(user_id);

-- Habilitar RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
CREATE POLICY IF NOT EXISTS "whatsapp_connections_policy" ON whatsapp_connections FOR ALL USING (auth.uid() = user_id);

-- Criar trigger se não existir
CREATE TRIGGER IF NOT EXISTS update_whatsapp_connections_updated_at
  BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ whatsapp_connections table verification completed!' as status;