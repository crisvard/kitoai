-- SQL para adicionar as colunas faltantes na tabela profiles
-- Estas colunas são necessárias para a verificação de dados completos no pagamento

-- Adicionar colunas de dados pessoais
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado TEXT;

-- Exemplo de UPDATE para preencher os dados (substitua pelos valores reais)
-- UPDATE profiles
-- SET
--   cpf = '123.456.789-00',
--   phone = '(11) 99999-9999',
--   cep = '01234-567',
--   logradouro = 'Rua Exemplo',
--   numero = '123',
--   bairro = 'Centro',
--   cidade = 'São Paulo',
--   estado = 'SP'
-- WHERE id = '367d0ede-2e38-4aed-93e3-2821c28f2567';