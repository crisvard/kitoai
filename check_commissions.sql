-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: commissions (COMISSÕES)
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'commissions'
  ) THEN '✅ commissions EXISTS' ELSE '❌ commissions MISSING - WILL CREATE' END as table_status;

-- Criar tabela commissions se não existir
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  reference_type TEXT CHECK (reference_type IN ('subscription', 'plan_upgrade', 'service', 'other')),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'franchise_id') THEN '✅ franchise_id' ELSE '❌ franchise_id MISSING' END as franchise_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'amount') THEN '✅ amount' ELSE '❌ amount MISSING' END as amount_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'status') THEN '✅ status' ELSE '❌ status MISSING' END as status_col;

-- Adicionar colunas adicionais se não existirem
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Verificar colunas adicionais
SELECT
  'Additional Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'transaction_id') THEN '✅ transaction_id' ELSE '❌ transaction_id MISSING' END as transaction_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'paid_at') THEN '✅ paid_at' ELSE '❌ paid_at MISSING' END as paid_at_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_commissions_franchise_id ON public.commissions(franchise_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_date ON public.commissions(payment_date);

-- Habilitar RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Franchise owners can view own commissions" ON public.commissions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.franchises WHERE id = commissions.franchise_id
    )
  );

CREATE POLICY IF NOT EXISTS "Users can view commissions they generated" ON public.commissions
  FOR SELECT USING (auth.uid() = user_id);

-- Apenas sistema/admin pode inserir/modificar comissões
CREATE POLICY IF NOT EXISTS "System can manage commissions" ON public.commissions
  FOR ALL USING (auth.role() = 'service_role');

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_commissions_updated_at();

SELECT '✅ commissions table verification and setup completed!' as status;