-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: payments
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN '✅ payments EXISTS' ELSE '❌ payments MISSING - WILL CREATE' END as table_status;

-- Criar tabela payments se não existir
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'asaas', 'paypal', 'manual')),
  provider_payment_id TEXT,
  provider_subscription_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount') THEN '✅ amount' ELSE '❌ amount MISSING' END as amount_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'status') THEN '✅ status' ELSE '❌ status MISSING' END as status_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own payments" ON public.payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_payments_updated_at();

SELECT '✅ payments table verification and setup completed!' as status;