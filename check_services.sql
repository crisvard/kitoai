-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: services
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'services'
  ) THEN '✅ services EXISTS' ELSE '❌ services MISSING - WILL CREATE' END as table_status;

-- Criar tabela services se não existir
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  price DECIMAL(10,2),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'name') THEN '✅ name' ELSE '❌ name MISSING' END as name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'duration_minutes') THEN '✅ duration_minutes' ELSE '❌ duration_minutes MISSING' END as duration_minutes_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

-- Habilitar RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem (services são visíveis para todos os usuários autenticados)
CREATE POLICY IF NOT EXISTS "Authenticated users can view services" ON public.services
  FOR SELECT USING (auth.role() = 'authenticated');

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_services_updated_at();

SELECT '✅ services table verification and setup completed!' as status;