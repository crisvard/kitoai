-- ============================================================
-- FIX: Permitir 'telnyx' no campo provider da user_agents
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Se existir alguma constraint CHECK limitando os valores do provider,
-- precisamos removê-la e recriá-lu com 'telnyx' incluso.
-- O nome padrão gerado pelo Supabase geralmente é user_agents_provider_check
-- ou algo similar. Vamos remover as mais comuns se existirem:

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.user_agents DROP CONSTRAINT IF EXISTS user_agents_provider_check;
  EXCEPTION
    WHEN undefined_object THEN null;
  END;
END $$;

-- 2. Adicionar a constraint correta permitindo telnyx
ALTER TABLE public.user_agents 
  ADD CONSTRAINT user_agents_provider_check 
  CHECK (provider IN ('vapi', 'retell', 'bland', 'telnyx'));

SELECT 'Provider constraint atualizada com sucesso para permitir telnyx!' AS status;
