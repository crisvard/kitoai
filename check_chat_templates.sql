-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: chat_templates
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_templates'
  ) THEN '✅ chat_templates EXISTS' ELSE '❌ chat_templates MISSING - WILL CREATE' END as table_status;

-- Criar tabela chat_templates se não existir
CREATE TABLE IF NOT EXISTS public.chat_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_templates' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_templates' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_templates' AND column_name = 'name') THEN '✅ name' ELSE '❌ name MISSING' END as name_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_templates' AND column_name = 'content') THEN '✅ content' ELSE '❌ content MISSING' END as content_col;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_chat_templates_user_id ON public.chat_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_templates_category ON public.chat_templates(category);

-- Habilitar RLS
ALTER TABLE public.chat_templates ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
CREATE POLICY IF NOT EXISTS "Users can view own chat templates" ON public.chat_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own chat templates" ON public.chat_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own chat templates" ON public.chat_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own chat templates" ON public.chat_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Criar função e trigger para updated_at se não existirem
CREATE OR REPLACE FUNCTION public.handle_chat_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS handle_chat_templates_updated_at
  BEFORE UPDATE ON public.chat_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_chat_templates_updated_at();

SELECT '✅ chat_templates table verification and setup completed!' as status;