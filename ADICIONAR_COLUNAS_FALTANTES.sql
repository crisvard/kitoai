-- ============================================
-- ADICIONAR COLUNAS FALTANTES ÀS TABELAS EXISTENTES
-- Execute apenas se as tabelas já existem mas faltam colunas
-- ============================================

-- Adicionar coluna upload_post_id à tabela scheduled_posts (se não existir)
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS upload_post_id VARCHAR(255);

-- Adicionar coluna post_id à tabela scheduled_posts (se não existir)
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS post_id TEXT;

-- Adicionar coluna platform à tabela scheduled_posts (se não existir)
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS platform TEXT;

-- Verificar se as tabelas existem e têm as colunas necessárias
SELECT
  'scheduled_posts table exists' as check_result,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_posts' AND column_name = 'upload_post_id'
  ) THEN 'upload_post_id column exists' ELSE 'upload_post_id column missing' END as upload_post_id_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_posts' AND column_name = 'post_id'
  ) THEN 'post_id column exists' ELSE 'post_id column missing' END as post_id_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_posts' AND column_name = 'platform'
  ) THEN 'platform column exists' ELSE 'platform column missing' END as platform_check;

-- ============================================
-- SE PRECISAR CRIAR TABELAS COMPLETAMENTE NOVAS:
-- ============================================

-- Execute apenas se a tabela NÃO existir:
/*
-- Tabela user_social_accounts (APENAS se não existir)
CREATE TABLE IF NOT EXISTS user_social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_id TEXT,
  account_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_platform CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'))
);

-- Tabela scheduled_posts (APENAS se não existir)
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES user_social_accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  platform TEXT NOT NULL,
  post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'scheduled', 'published', 'failed', 'cancelled'))
);
*/

SELECT 'Colunas adicionadas com sucesso! Verifique os resultados acima.' as status;