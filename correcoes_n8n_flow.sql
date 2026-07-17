-- ============================================
-- CORREÇÕES PARA COMPATIBILIDADE COM N8N FLOW
-- ============================================

-- 1. Adicionar coluna 'active' na tabela whatsapp_user_ids
ALTER TABLE whatsapp_user_ids ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Adicionar campos faltantes na tabela agent_configs
ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS additional_instructions JSONB;

-- 3. Criar índice para melhorar performance da consulta do fluxo
CREATE INDEX IF NOT EXISTS idx_whatsapp_user_ids_user_id_active ON whatsapp_user_ids(user_id, active);

-- 4. Criar índice para melhorar performance da consulta do fluxo na tabela agent_configs
CREATE INDEX IF NOT EXISTS idx_agent_configs_franchise_id ON agent_configs(franchise_id);

-- 5. Atualizar RLS policies para incluir a nova coluna active
-- (As policies já existem, mas precisam considerar a nova coluna)

-- 6. Verificar se a consulta lógica no fluxo precisa ser corrigida
-- O fluxo faz: WHERE franchise_id = ? AND franchise_id = true
-- Isso deve ser corrigido para: WHERE franchise_id = ? AND active = true

-- 7. Atualizar a consulta no fluxo do n8n (isso deve ser feito no próprio fluxo)
-- Na etapa "Buscar Config", mudar a condição de:
-- franchise_id = ? AND franchise_id = true
-- Para:
-- franchise_id = ? AND active = true

-- 8. Garantir que os campos essenciais existam na tabela agent_configs
-- Verificar se os campos abaixo existem (se não existirem, criar):
-- personality, presentation, company_knowledge, product_knowledge

-- Se algum campo estiver faltando, execute:
-- ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS personality JSONB;
-- ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS presentation JSONB;
-- ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS company_knowledge JSONB;
-- ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS product_knowledge JSONB;

-- 9. Atualizar a estrutura da consulta no fluxo do n8n
-- No nó "Buscar Config", alterar a condição para:
-- Conditions: franchise_id = ? AND active = true

-- 10. Testar as consultas após as correções
-- Teste 1: SELECT * FROM whatsapp_user_ids WHERE user_id = 'algum-uuid' AND active = true;
-- Teste 2: SELECT * FROM agent_configs WHERE franchise_id = 'algum-uuid' AND active = true;