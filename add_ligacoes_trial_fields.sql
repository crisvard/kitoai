-- ============================================
-- ADD LIGACOES (DIALER) TRIAL ACCESS CONTROL
-- (Igual ao padrão do WhatsApp/Marketing/Negociações)
-- ============================================

-- PROFILES: Ligações (Dialer) Trial Fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ligacoes_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_ligacoes_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ligacoes_trial_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ligacoes_access_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ligacoes_block_reason TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_ligacoes_active ON public.profiles(ligacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ligacoes_active ON public.profiles(trial_ligacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ligacoes_end_date ON public.profiles(trial_ligacoes_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_ligacoes_access_blocked ON public.profiles(ligacoes_access_blocked);


-- REQUEST TABLE para Ligações
CREATE TABLE IF NOT EXISTS public.ligacoes_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- trial | activate | block | unblock
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ligacoes_access_requests_user_id ON public.ligacoes_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ligacoes_access_requests_status ON public.ligacoes_access_requests(status);

ALTER TABLE public.ligacoes_access_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ligacoes_access_requests'
      AND policyname = 'Users can view own ligacoes requests'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own ligacoes requests" ON public.ligacoes_access_requests FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ligacoes_access_requests'
      AND policyname = 'Users can insert own ligacoes requests'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own ligacoes requests" ON public.ligacoes_access_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
  END IF;
END
$$;


-- ============================================
-- TRIGGER: Proteção dos campos de acesso Ligações
-- (Atualizar o trigger existente para incluir Ligações)
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_self_update_agent_access_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  is_starting_marketing_trial BOOLEAN := false;
  is_starting_negociacoes_trial BOOLEAN := false;
  is_starting_ligacoes_trial BOOLEAN := false;
  is_expiring_marketing_trial BOOLEAN := false;
  is_expiring_negociacoes_trial BOOLEAN := false;
  is_expiring_ligacoes_trial BOOLEAN := false;
BEGIN
  IF auth.role() = 'authenticated' THEN
    -- Detectar se está iniciando o trial de Marketing (1x)
    is_starting_marketing_trial := (
      (OLD.marketing_trial_completed IS NOT TRUE)
      AND (COALESCE(OLD.trial_marketing_active, false) = false)
      AND (COALESCE(NEW.trial_marketing_active, false) = true)
      AND (OLD.trial_marketing_end_date IS NULL)
      AND (NEW.trial_marketing_end_date IS NOT NULL)
    );

    -- Detectar se está iniciando o trial de Negociações (1x)
    is_starting_negociacoes_trial := (
      (OLD.negociacoes_trial_completed IS NOT TRUE)
      AND (COALESCE(OLD.trial_negociacoes_active, false) = false)
      AND (COALESCE(NEW.trial_negociacoes_active, false) = true)
      AND (OLD.trial_negociacoes_end_date IS NULL)
      AND (NEW.trial_negociacoes_end_date IS NOT NULL)
    );

    -- Detectar se está iniciando o trial de Ligações (1x)
    is_starting_ligacoes_trial := (
      (OLD.ligacoes_trial_completed IS NOT TRUE)
      AND (COALESCE(OLD.trial_ligacoes_active, false) = false)
      AND (COALESCE(NEW.trial_ligacoes_active, false) = true)
      AND (OLD.trial_ligacoes_end_date IS NULL)
      AND (NEW.trial_ligacoes_end_date IS NOT NULL)
    );

    -- Detectar se está expirando trial de Marketing (desativando)
    is_expiring_marketing_trial := (
      (COALESCE(OLD.trial_marketing_active, false) = true)
      AND (COALESCE(NEW.trial_marketing_active, false) = false)
      AND (COALESCE(NEW.marketing_trial_completed, false) = true)
    );

    -- Detectar se está expirando trial de Negociações (desativando)
    is_expiring_negociacoes_trial := (
      (COALESCE(OLD.trial_negociacoes_active, false) = true)
      AND (COALESCE(NEW.trial_negociacoes_active, false) = false)
      AND (COALESCE(NEW.negociacoes_trial_completed, false) = true)
    );

    -- Detectar se está expirando trial de Ligações (desativando)
    is_expiring_ligacoes_trial := (
      (COALESCE(OLD.trial_ligacoes_active, false) = true)
      AND (COALESCE(NEW.trial_ligacoes_active, false) = false)
      AND (COALESCE(NEW.ligacoes_trial_completed, false) = true)
    );

    -- ========== MARKETING ==========
    IF (NEW.marketing_active IS DISTINCT FROM OLD.marketing_active) THEN
      IF COALESCE(NEW.marketing_active, false) = true AND NOT is_starting_marketing_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
      IF COALESCE(NEW.marketing_active, false) = false AND COALESCE(OLD.marketing_active, false) = true AND NOT is_expiring_marketing_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    IF (NEW.trial_marketing_active IS DISTINCT FROM OLD.trial_marketing_active)
      AND COALESCE(NEW.trial_marketing_active, false) = true
      AND NOT is_starting_marketing_trial
    THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.trial_marketing_end_date IS DISTINCT FROM OLD.trial_marketing_end_date THEN
      IF NEW.trial_marketing_end_date IS NOT NULL AND NOT is_starting_marketing_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    IF (OLD.marketing_trial_completed = true) AND (COALESCE(NEW.marketing_trial_completed, false) = false) THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.marketing_activation_date IS DISTINCT FROM OLD.marketing_activation_date AND NEW.marketing_activation_date IS NOT NULL THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.marketing_access_blocked IS DISTINCT FROM OLD.marketing_access_blocked THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.marketing_block_reason IS DISTINCT FROM OLD.marketing_block_reason AND NEW.marketing_block_reason IS NOT NULL THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    -- ========== NEGOCIAÇÕES ==========
    IF (NEW.negociacoes_active IS DISTINCT FROM OLD.negociacoes_active) THEN
      IF COALESCE(NEW.negociacoes_active, false) = true AND NOT is_starting_negociacoes_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
      IF COALESCE(NEW.negociacoes_active, false) = false AND COALESCE(OLD.negociacoes_active, false) = true AND NOT is_expiring_negociacoes_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    IF (NEW.trial_negociacoes_active IS DISTINCT FROM OLD.trial_negociacoes_active)
      AND COALESCE(NEW.trial_negociacoes_active, false) = true
      AND NOT is_starting_negociacoes_trial
    THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.trial_negociacoes_end_date IS DISTINCT FROM OLD.trial_negociacoes_end_date THEN
      IF NEW.trial_negociacoes_end_date IS NOT NULL AND NOT is_starting_negociacoes_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    IF (OLD.negociacoes_trial_completed = true) AND (COALESCE(NEW.negociacoes_trial_completed, false) = false) THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.negociacoes_activation_date IS DISTINCT FROM OLD.negociacoes_activation_date AND NEW.negociacoes_activation_date IS NOT NULL THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.negociacoes_access_blocked IS DISTINCT FROM OLD.negociacoes_access_blocked THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.negociacoes_block_reason IS DISTINCT FROM OLD.negociacoes_block_reason AND NEW.negociacoes_block_reason IS NOT NULL THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    -- ========== LIGAÇÕES ==========
    IF (NEW.ligacoes_active IS DISTINCT FROM OLD.ligacoes_active) THEN
      IF COALESCE(NEW.ligacoes_active, false) = true AND NOT is_starting_ligacoes_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
      IF COALESCE(NEW.ligacoes_active, false) = false AND COALESCE(OLD.ligacoes_active, false) = true AND NOT is_expiring_ligacoes_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    IF (NEW.trial_ligacoes_active IS DISTINCT FROM OLD.trial_ligacoes_active)
      AND COALESCE(NEW.trial_ligacoes_active, false) = true
      AND NOT is_starting_ligacoes_trial
    THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.trial_ligacoes_end_date IS DISTINCT FROM OLD.trial_ligacoes_end_date THEN
      IF NEW.trial_ligacoes_end_date IS NOT NULL AND NOT is_starting_ligacoes_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    IF (OLD.ligacoes_trial_completed = true) AND (COALESCE(NEW.ligacoes_trial_completed, false) = false) THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.ligacoes_activation_date IS DISTINCT FROM OLD.ligacoes_activation_date AND NEW.ligacoes_activation_date IS NOT NULL THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.ligacoes_access_blocked IS DISTINCT FROM OLD.ligacoes_access_blocked THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.ligacoes_block_reason IS DISTINCT FROM OLD.ligacoes_block_reason AND NEW.ligacoes_block_reason IS NOT NULL THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_update_agent_access_fields ON public.profiles;
CREATE TRIGGER trg_prevent_self_update_agent_access_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_update_agent_access_fields();

-- Adicionar plano ligacoes na tabela plans (se não existir)
INSERT INTO public.plans (id, name, description, price, monthly_price, annual_price, trial_days, features)
VALUES (
  'ligacoes', 
  'Plano Agente de Ligações', 
  'Agente de voz com IA para ligações automáticas com fala natural e humana',
  299.00,
  299.00, 
  2990.00, 
  3, 
  '["Até 10.000 ligações/mês", "IA de voz natural", "Relatórios detalhados", "Suporte prioritário"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  trial_days = 3,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price;

-- End
