-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: customer_packages
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customer_packages'
  ) THEN '✅ customer_packages EXISTS' ELSE '❌ customer_packages MISSING - WILL CREATE' END as table_status;

-- Criar tabela customer_packages se não existir
CREATE TABLE IF NOT EXISTS public.customer_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_subscription_id TEXT,
  asaas_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_packages' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_packages' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_packages' AND column_name = 'package_id') THEN '✅ package_id' ELSE '❌ package_id MISSING' END as package_id_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_customer_packages_user_id ON public.customer_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_package_id ON public.customer_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_status ON public.customer_packages(status);

-- Habilitar RLS
ALTER TABLE public.customer_packages ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own customer packages" ON public.customer_packages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own customer packages" ON public.customer_packages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own customer packages" ON public.customer_packages
  FOR UPDATE USING (auth.uid() = user_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_customer_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_customer_packages_updated_at
  BEFORE UPDATE ON public.customer_packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_customer_packages_updated_at();

SELECT '✅ customer_packages table verification and setup completed!' as status;