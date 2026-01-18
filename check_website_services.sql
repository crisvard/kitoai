-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: website_services
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'website_services'
  ) THEN '✅ website_services EXISTS' ELSE '❌ website_services MISSING - WILL CREATE' END as table_status;

-- Criar tabela website_services se não existir
CREATE TABLE IF NOT EXISTS public.website_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES public.user_websites(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'website_services' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'website_services' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'website_services' AND column_name = 'website_id') THEN '✅ website_id' ELSE '❌ website_id MISSING' END as website_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'website_services' AND column_name = 'service_type') THEN '✅ service_type' ELSE '❌ service_type MISSING' END as service_type_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_website_services_user_id ON public.website_services(user_id);
CREATE INDEX IF NOT EXISTS idx_website_services_website_id ON public.website_services(website_id);
CREATE INDEX IF NOT EXISTS idx_website_services_type ON public.website_services(service_type);

-- Habilitar RLS
ALTER TABLE public.website_services ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own website services" ON public.website_services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own website services" ON public.website_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own website services" ON public.website_services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own website services" ON public.website_services
  FOR DELETE USING (auth.uid() = user_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_website_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_website_services_updated_at
  BEFORE UPDATE ON public.website_services
  FOR EACH ROW EXECUTE FUNCTION public.handle_website_services_updated_at();

SELECT '✅ website_services table verification and setup completed!' as status;