-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: verification_codes
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'verification_codes'
  ) THEN '✅ verification_codes EXISTS' ELSE '❌ verification_codes MISSING - WILL CREATE' END as table_status;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_codes' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_codes' AND column_name = 'email') THEN '✅ email' ELSE '❌ email MISSING' END as email_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_codes' AND column_name = 'code') THEN '✅ code' ELSE '❌ code MISSING' END as code_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_codes' AND column_name = 'expires_at') THEN '✅ expires_at' ELSE '❌ expires_at MISSING' END as expires_at_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_codes' AND column_name = 'used') THEN '✅ used' ELSE '❌ used MISSING' END as used_col;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Criar função para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
-- Criar política (removido IF NOT EXISTS pois não é suportado)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_codes' AND policyname = 'verification_codes_policy') THEN
    CREATE POLICY "verification_codes_policy" ON verification_codes FOR ALL USING (true);
  END IF;
END $$;

-- Criar trigger se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_verification_codes_updated_at') THEN
    CREATE TRIGGER update_verification_codes_updated_at
      BEFORE UPDATE ON verification_codes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

SELECT '✅ verification_codes table verification completed!' as status;