-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: user_plans (PLANOS DOS USUÁRIOS)
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_plans'
  ) THEN '✅ user_plans EXISTS' ELSE '❌ user_plans MISSING - WILL CREATE' END as table_status;

-- Criar tabela user_plans se não existir
CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  asaas_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_plans' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_plans' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_plans' AND column_name = 'plan_id') THEN '✅ plan_id' ELSE '❌ plan_id MISSING' END as plan_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_plans' AND column_name = 'status') THEN '✅ status' ELSE '❌ status MISSING' END as status_col;

-- Adicionar colunas adicionais se não existirem
ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS prorated_amount DECIMAL(10,2);

-- Verificar colunas adicionais
SELECT
  'Additional Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_plans' AND column_name = 'last_payment_date') THEN '✅ last_payment_date' ELSE '❌ last_payment_date MISSING' END as last_payment_date_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_plans' AND column_name = 'discount_percentage') THEN '✅ discount_percentage' ELSE '❌ discount_percentage MISSING' END as discount_percentage_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id ON public.user_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON public.user_plans(status);
CREATE INDEX IF NOT EXISTS idx_user_plans_current_period_end ON public.user_plans(current_period_end);

-- Habilitar RLS
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own user_plans" ON public.user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own user_plans" ON public.user_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own user_plans" ON public.user_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_user_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_plans_updated_at();

SELECT '✅ user_plans table verification and setup completed!' as status;