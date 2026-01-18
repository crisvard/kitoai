-- ============================================
-- RPC FUNCTIONS PARA ATIVAR PLANOS VIA PAGAMENTO
-- (Bypass do trigger de proteção para pagamentos legítimos)
-- ============================================

-- Função para ativar plano de WhatsApp/Agendamentos após pagamento
CREATE OR REPLACE FUNCTION public.activate_whatsapp_plan(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    whatsapp_active = true,
    whatsapp_activation_date = NOW(),
    trial_whatsapp_active = false,
    whatsapp_trial_completed = true,
    whatsapp_access_blocked = false,
    whatsapp_block_reason = NULL
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;

-- Função para ativar plano de Ligações após pagamento
CREATE OR REPLACE FUNCTION public.activate_ligacoes_plan(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    ligacoes_active = true,
    ligacoes_activation_date = NOW(),
    trial_ligacoes_active = false,
    ligacoes_trial_completed = true,
    ligacoes_access_blocked = false,
    ligacoes_block_reason = NULL
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;

-- Função para ativar plano de Marketing após pagamento
CREATE OR REPLACE FUNCTION public.activate_marketing_plan(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    marketing_active = true,
    marketing_activation_date = NOW(),
    trial_marketing_active = false,
    marketing_trial_completed = true,
    marketing_access_blocked = false,
    marketing_block_reason = NULL
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;

-- Função para ativar plano de Negociações após pagamento
CREATE OR REPLACE FUNCTION public.activate_negociacoes_plan(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    negociacoes_active = true,
    negociacoes_activation_date = NOW(),
    trial_negociacoes_active = false,
    negociacoes_trial_completed = true,
    negociacoes_access_blocked = false,
    negociacoes_block_reason = NULL
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;

-- Permissões: Apenas usuários autenticados podem chamar essas funções
GRANT EXECUTE ON FUNCTION public.activate_whatsapp_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_ligacoes_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_marketing_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_negociacoes_plan(UUID) TO authenticated;

-- End
