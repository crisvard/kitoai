-- ============================================
-- SUPORTE A TELNYX COMO SEGUNDO PROVEDOR
-- ============================================

-- API key da Telnyx por usuário (cada cliente usa sua conta)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telnyx_api_key TEXT;

COMMENT ON COLUMN public.profiles.telnyx_api_key IS 'Chave de API da Telnyx do usuário para ligações via Telnyx';

-- O campo provider em user_agents já é VARCHAR(50), aceita 'telnyx' sem alteração.
-- Adicionando campo para guardar o ID do assistant na Telnyx (separado do VAPI)
-- O campo agent_provider_id já serve para isso, pois é TEXT genérico.

SELECT 'Telnyx support migration completed!' AS status;
