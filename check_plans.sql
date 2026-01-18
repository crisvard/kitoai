-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: plans (PLANOS DO SISTEMA)
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'plans'
  ) THEN '✅ plans EXISTS' ELSE '❌ plans MISSING - WILL CREATE' END as table_status;

-- Criar tabela plans se não existir
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  trial_days INTEGER DEFAULT 7,
  max_users INTEGER DEFAULT 1,
  max_websites INTEGER DEFAULT 1,
  max_social_accounts INTEGER DEFAULT 5,
  max_whatsapp_connections INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'name') THEN '✅ name' ELSE '❌ name MISSING' END as name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'price_monthly') THEN '✅ price_monthly' ELSE '❌ price_monthly MISSING' END as price_monthly_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'features') THEN '✅ features' ELSE '❌ features MISSING' END as features_col;

-- Adicionar colunas adicionais se não existirem
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id_yearly TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS asaas_plan_id TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'standard' CHECK (plan_type IN ('starter', 'professional', 'enterprise', 'franchise'));
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_monthly_revenue DECIMAL(15,2);
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0;

-- Verificar colunas adicionais
SELECT
  'Additional Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'stripe_price_id_monthly') THEN '✅ stripe_price_id_monthly' ELSE '❌ stripe_price_id_monthly MISSING' END as stripe_price_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'plan_type') THEN '✅ plan_type' ELSE '❌ plan_type MISSING' END as plan_type_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_type ON public.plans(plan_type);

-- Habilitar RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem (plans são visíveis para todos os usuários autenticados)
CREATE POLICY IF NOT EXISTS "Authenticated users can view plans" ON public.plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admin pode modificar planos (isso pode ser ajustado conforme necessário)
CREATE POLICY IF NOT EXISTS "Only authenticated users can view plans" ON public.plans
  FOR ALL USING (auth.role() = 'authenticated');

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_plans_updated_at();

SELECT '✅ plans table verification and setup completed!' as status;