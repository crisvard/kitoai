-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: negociacoes_access_requests
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'negociacoes_access_requests'
  ) THEN '✅ negociacoes_access_requests EXISTS' ELSE '❌ negociacoes_access_requests MISSING - WILL CREATE' END as table_status;

-- Criar tabela negociacoes_access_requests se não existir
CREATE TABLE IF NOT EXISTS public.negociacoes_access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negociacoes_access_requests' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negociacoes_access_requests' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'negociacoes_access_requests' AND column_name = 'status') THEN '✅ status' ELSE '❌ status MISSING' END as status_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_negociacoes_access_requests_user_id ON public.negociacoes_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_access_requests_status ON public.negociacoes_access_requests(status);

-- Habilitar RLS
ALTER TABLE public.negociacoes_access_requests ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own negociacoes access requests" ON public.negociacoes_access_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own negociacoes access requests" ON public.negociacoes_access_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own negociacoes access requests" ON public.negociacoes_access_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_negociacoes_access_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_negociacoes_access_requests_updated_at
  BEFORE UPDATE ON public.negociacoes_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_negociacoes_access_requests_updated_at();

SELECT '✅ negociacoes_access_requests table verification and setup completed!' as status;