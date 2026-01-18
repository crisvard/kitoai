-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: commission_configs
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'commission_configs'
  ) THEN '✅ commission_configs EXISTS' ELSE '❌ commission_configs MISSING - WILL CREATE' END as table_status;

-- Criar tabela commission_configs se não existir
CREATE TABLE IF NOT EXISTS public.commission_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commission_configs' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commission_configs' AND column_name = 'franchise_id') THEN '✅ franchise_id' ELSE '❌ franchise_id MISSING' END as franchise_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'commission_configs' AND column_name = 'commission_percentage') THEN '✅ commission_percentage' ELSE '❌ commission_percentage MISSING' END as commission_percentage_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_commission_configs_franchise_id ON public.commission_configs(franchise_id);
CREATE INDEX IF NOT EXISTS idx_commission_configs_service_type ON public.commission_configs(service_type);

-- Habilitar RLS
ALTER TABLE public.commission_configs ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Franchise owners can view own commission configs" ON public.commission_configs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.franchises WHERE id = commission_configs.franchise_id
    )
  );

CREATE POLICY IF NOT EXISTS "Franchise owners can manage own commission configs" ON public.commission_configs
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.franchises WHERE id = commission_configs.franchise_id
    )
  );

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_commission_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_commission_configs_updated_at
  BEFORE UPDATE ON public.commission_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_commission_configs_updated_at();

SELECT '✅ commission_configs table verification and setup completed!' as status;