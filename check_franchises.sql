-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: franchises (FRANQUIAS)
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'franchises'
  ) THEN '✅ franchises EXISTS' ELSE '❌ franchises MISSING - WILL CREATE' END as table_status;

-- Criar tabela franchises se não existir
CREATE TABLE IF NOT EXISTS public.franchises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  location TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  monthly_fee DECIMAL(10,2),
  setup_fee DECIMAL(10,2),
  contract_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contract_end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'owner_id') THEN '✅ owner_id' ELSE '❌ owner_id MISSING' END as owner_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'franchise_name') THEN '✅ franchise_name' ELSE '❌ franchise_name MISSING' END as franchise_name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'commission_rate') THEN '✅ commission_rate' ELSE '❌ commission_rate MISSING' END as commission_rate_col;

-- Adicionar colunas adicionais se não existirem
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS bank_details JSONB;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS total_commissions DECIMAL(15,2) DEFAULT 0;

-- Verificar colunas adicionais
SELECT
  'Additional Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'total_earnings') THEN '✅ total_earnings' ELSE '❌ total_earnings MISSING' END as total_earnings_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'bank_details') THEN '✅ bank_details' ELSE '❌ bank_details MISSING' END as bank_details_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_franchises_owner_id ON public.franchises(owner_id);
CREATE INDEX IF NOT EXISTS idx_franchises_status ON public.franchises(status);
CREATE INDEX IF NOT EXISTS idx_franchises_contract_end ON public.franchises(contract_end_date);

-- Habilitar RLS
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own franchises" ON public.franchises
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "Users can insert own franchises" ON public.franchises
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "Users can update own franchises" ON public.franchises
  FOR UPDATE USING (auth.uid() = owner_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_franchises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_franchises_updated_at
  BEFORE UPDATE ON public.franchises
  FOR EACH ROW EXECUTE FUNCTION public.handle_franchises_updated_at();

SELECT '✅ franchises table verification and setup completed!' as status;