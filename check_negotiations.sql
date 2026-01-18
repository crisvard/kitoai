-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: negotiations (NEGOCIAÇÕES)
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'negotiations'
  ) THEN '✅ negotiations EXISTS' ELSE '❌ negotiations MISSING - WILL CREATE' END as table_status;

-- Criar tabela negotiations se não existir
CREATE TABLE IF NOT EXISTS public.negotiations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  service_type TEXT NOT NULL,
  status TEXT DEFAULT 'contact' CHECK (status IN ('contact', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  value DECIMAL(15,2),
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negotiations' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negotiations' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negotiations' AND column_name = 'client_name') THEN '✅ client_name' ELSE '❌ client_name MISSING' END as client_name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negotiations' AND column_name = 'status') THEN '✅ status' ELSE '❌ status MISSING' END as status_col;

-- Adicionar colunas adicionais se não existirem
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100);
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMP WITH TIME ZONE;

-- Verificar colunas adicionais
SELECT
  'Additional Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negotiations' AND column_name = 'probability') THEN '✅ probability' ELSE '❌ probability MISSING' END as probability_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negotiations' AND column_name = 'priority') THEN '❌ priority MISSING' END as priority_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_negotiations_user_id ON public.negotiations(user_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON public.negotiations(status);
CREATE INDEX IF NOT EXISTS idx_negotiations_expected_close ON public.negotiations(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_negotiations_priority ON public.negotiations(priority);

-- Habilitar RLS
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own negotiations" ON public.negotiations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own negotiations" ON public.negotiations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own negotiations" ON public.negotiations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own negotiations" ON public.negotiations
  FOR DELETE USING (auth.uid() = user_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_negotiations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_negotiations_updated_at
  BEFORE UPDATE ON public.negotiations
  FOR EACH ROW EXECUTE FUNCTION public.handle_negotiations_updated_at();

SELECT '✅ negotiations table verification and setup completed!' as status;