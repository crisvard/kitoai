-- ============================================
-- FIX: Garantir que website_activation_date existe
-- ============================================

-- 1. Verificar se coluna existe (não vai causar erro se já existir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_activation_date TIMESTAMP WITH TIME ZONE;

-- 2. Se existir mas for NULL em alguns registros, isso é normal
-- O campo será preenchido quando o usuário contratar o serviço

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_website_activation_date ON profiles(website_activation_date);

-- 4. Verificar se o campo foi criado corretamente
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'website_activation_date';
