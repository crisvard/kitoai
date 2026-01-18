-- Inserir usuário admin na tabela users para permitir criação de profissionais
-- Execute este SQL no Supabase SQL Editor

INSERT INTO users (id, email, created_at, updated_at)
VALUES (
  '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2',
  'admin@kitoexpert.com', -- Substitua pelo email real do admin
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se foi inserido
SELECT * FROM users WHERE id = '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2';