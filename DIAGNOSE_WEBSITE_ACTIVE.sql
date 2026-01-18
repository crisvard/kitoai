-- ============================================
-- DIAGNÓSTICO: website_active não está sendo atualizado
-- ============================================

-- 1. Verificar se coluna website_active existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('website_active', 'website_activation_date');

-- 2. Ver políticas RLS na tabela profiles
SELECT polname, polcmd, polroles, polqual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Verificar permissões UPDATE na tabela
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
AND privilege_type = 'UPDATE';

-- 4. Tentar atualizar um registro manualmente (substituir UUID)
-- NOTA: Isto vai falhar se houver RLS bloqueando
-- UPDATE profiles 
-- SET website_active = true, 
--     website_activation_date = NOW()
-- WHERE id = 'SEU_UUID_AQUI';

-- 5. Ver valores atuais
SELECT id, website_active, website_activation_date, payment_status 
FROM profiles 
LIMIT 5;
