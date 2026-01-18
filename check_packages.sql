-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: packages
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'packages'
  ) THEN '✅ packages EXISTS' ELSE '❌ packages MISSING - WILL CREATE' END as table_status;

-- Criar tabela packages se não existir
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'name') THEN '✅ name' ELSE '❌ name MISSING' END as name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'price') THEN '✅ price' ELSE '❌ price MISSING' END as price_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_packages_active ON public.packages(is_active);

-- Habilitar RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem (packages são visíveis para todos os usuários autenticados)
CREATE POLICY IF NOT EXISTS "Authenticated users can view packages" ON public.packages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_packages_updated_at();

SELECT '✅ packages table verification and setup completed!' as status;