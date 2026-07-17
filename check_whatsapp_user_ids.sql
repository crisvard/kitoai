-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: whatsapp_user_ids
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'whatsapp_user_ids'
  ) THEN '✅ whatsapp_user_ids EXISTS' ELSE '❌ whatsapp_user_ids MISSING - WILL CREATE' END as table_status;

-- Criar tabela whatsapp_user_ids se não existir
CREATE TABLE IF NOT EXISTS public.whatsapp_user_ids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_user_id TEXT NOT NULL,
  whatsapp_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, whatsapp_user_id)
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'whatsapp_user_ids' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'whatsapp_user_ids' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'whatsapp_user_ids' AND column_name = 'whatsapp_user_id') THEN '✅ whatsapp_user_id' ELSE '❌ whatsapp_user_id MISSING' END as whatsapp_user_id_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_whatsapp_user_ids_user_id ON public.whatsapp_user_ids(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_user_ids_active ON public.whatsapp_user_ids(is_active);

-- Habilitar RLS
ALTER TABLE public.whatsapp_user_ids ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own whatsapp user ids" ON public.whatsapp_user_ids
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own whatsapp user ids" ON public.whatsapp_user_ids
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own whatsapp user ids" ON public.whatsapp_user_ids
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own whatsapp user ids" ON public.whatsapp_user_ids
  FOR DELETE USING (auth.uid() = user_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_whatsapp_user_ids_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_whatsapp_user_ids_updated_at
  BEFORE UPDATE ON public.whatsapp_user_ids
  FOR EACH ROW EXECUTE FUNCTION public.handle_whatsapp_user_ids_updated_at();

SELECT '✅ whatsapp_user_ids table verification and setup completed!' as status;