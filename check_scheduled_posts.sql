-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO: scheduled_posts
-- ============================================

-- Verificar se a tabela existe
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'scheduled_posts'
  ) THEN '✅ scheduled_posts EXISTS' ELSE '❌ scheduled_posts MISSING - WILL CREATE' END as table_status;

-- Criar tabela se não existir
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

-- Verificar colunas existentes
SELECT
  'Column Check:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_posts' AND column_name = 'id') THEN '✅ id' ELSE '❌ id MISSING' END as id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_posts' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id MISSING' END as user_id_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_posts' AND column_name = 'content') THEN '✅ content' ELSE '❌ content MISSING' END as content_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_posts' AND column_name = 'scheduled_at') THEN '✅ scheduled_at' ELSE '❌ scheduled_at MISSING' END as scheduled_at_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_posts' AND column_name = 'status') THEN '✅ status' ELSE '❌ status MISSING' END as status_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_posts' AND column_name = 'platform') THEN '✅ platform' ELSE '❌ platform MISSING' END as platform_col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_posts' AND column_name = 'post_id') THEN '✅ post_id' ELSE '❌ post_id MISSING' END as post_id_col;

-- Adicionar colunas que podem estar faltando
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS upload_post_id VARCHAR(255);
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS social_account_id UUID REFERENCES user_social_accounts(id) ON DELETE CASCADE;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);

-- Habilitar RLS
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
CREATE POLICY IF NOT EXISTS "scheduled_posts_policy" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);

-- Criar trigger se não existir
CREATE TRIGGER IF NOT EXISTS update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ scheduled_posts table verification completed!' as status;