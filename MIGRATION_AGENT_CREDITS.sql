-- ============================================
-- MIGRATION: PRE-PAID AGENT CREDITS
-- ============================================

-- 1. Add allocated_credits to user_agents
ALTER TABLE public.user_agents 
ADD COLUMN IF NOT EXISTS allocated_credits NUMERIC DEFAULT 0;

-- 2. Function to allocate credits from user profile to specific agent
CREATE OR REPLACE FUNCTION public.allocate_agent_credits(p_agent_id UUID, p_user_id UUID, p_amount NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_credits NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'A quantidade de créditos deve ser maior que zero.';
  END IF;

  -- Obter o saldo atual
  SELECT COALESCE(credits, 0) INTO v_user_credits
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_user_credits < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente.';
  END IF;

  -- Descontar do perfil global
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id;

  -- Adicionar no agente específico
  UPDATE public.user_agents
  SET allocated_credits = COALESCE(allocated_credits, 0) + p_amount
  WHERE id = p_agent_id AND user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Function to refund agent credits back to user profile (used before deletion)
CREATE OR REPLACE FUNCTION public.refund_agent_credits(p_agent_id UUID, p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_agent_credits NUMERIC;
BEGIN
  -- Obter saldo atual do agente
  SELECT COALESCE(allocated_credits, 0) INTO v_agent_credits
  FROM public.user_agents
  WHERE id = p_agent_id AND user_id = p_user_id;

  IF v_agent_credits > 0 THEN
    -- Zerar saldo do agente
    UPDATE public.user_agents
    SET allocated_credits = 0
    WHERE id = p_agent_id AND user_id = p_user_id;

    -- Devolver os créditos para o perfil principal
    UPDATE public.profiles
    SET credits = credits + v_agent_credits
    WHERE id = p_user_id;
  END IF;

  RETURN COALESCE(v_agent_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
