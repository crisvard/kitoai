-- ============================================
-- TABELAS ADICIONAIS PARA KITO EXPERT DASHBOARD
-- Execute APENAS se alguma tabela estiver faltando
-- ============================================

-- Tabela para códigos de verificação de email (se não existir)
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para verification_codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Habilitar RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Política simples
CREATE POLICY "verification_codes_policy" ON verification_codes FOR ALL USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_verification_codes_updated_at BEFORE UPDATE ON verification_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SE ALGUMA TABELA ESTIVER FALTANDO, EXECUTE OS ARQUIVOS SQL ESPECÍFICOS:
-- ============================================

-- Para adicionar campos específicos às tabelas existentes, use estes arquivos:
-- - add_payment_fields.sql
-- - add_stripe_fields.sql
-- - add_website_fields_to_profile.sql
-- - add_notes_column.sql
-- - add_ligacoes_payment_fields.sql
-- - add_marketing_negociacoes_access.sql

SELECT 'Tabelas adicionais criadas com sucesso!' as status;