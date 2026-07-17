-- ============================================
-- ADD MARKETING + NEGOCIACOES ACCESS CONTROL
-- (Manual SQL - same style as existing root scripts)
-- ============================================

-- PROFILES: Marketing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_activation_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS trial_marketing_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_marketing_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS marketing_trial_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_access_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_block_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_marketing_active ON public.profiles(marketing_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_marketing_active ON public.profiles(trial_marketing_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_marketing_end_date ON public.profiles(trial_marketing_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_access_blocked ON public.profiles(marketing_access_blocked);


-- PROFILES: Negociações
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS negociacoes_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS negociacoes_activation_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS trial_negociacoes_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_negociacoes_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS negociacoes_trial_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS negociacoes_access_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS negociacoes_block_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_negociacoes_active ON public.profiles(negociacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_negociacoes_active ON public.profiles(trial_negociacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_negociacoes_end_date ON public.profiles(trial_negociacoes_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_negociacoes_access_blocked ON public.profiles(negociacoes_access_blocked);


-- REQUEST TABLES
CREATE TABLE IF NOT EXISTS public.marketing_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- trial | activate | block | unblock
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_access_requests_user_id ON public.marketing_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_access_requests_status ON public.marketing_access_requests(status);

ALTER TABLE public.marketing_access_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketing_access_requests'
      AND policyname = 'Users can view own marketing requests'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own marketing requests" ON public.marketing_access_requests FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketing_access_requests'
      AND policyname = 'Users can insert own marketing requests'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own marketing requests" ON public.marketing_access_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
  END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.negociacoes_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- trial | activate | block | unblock
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negociacoes_access_requests_user_id ON public.negociacoes_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_access_requests_status ON public.negociacoes_access_requests(status);

ALTER TABLE public.negociacoes_access_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'negociacoes_access_requests'
      AND policyname = 'Users can view own negociacoes requests'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own negociacoes requests" ON public.negociacoes_access_requests FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'negociacoes_access_requests'
      AND policyname = 'Users can insert own negociacoes requests'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own negociacoes requests" ON public.negociacoes_access_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
  END IF;
END
$$;


-- Protect access flags in profiles (block upgrades, allow downgrades)
CREATE OR REPLACE FUNCTION public.prevent_self_update_agent_access_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  is_starting_marketing_trial BOOLEAN := false;
  is_starting_negociacoes_trial BOOLEAN := false;
  is_expiring_marketing_trial BOOLEAN := false;
  is_expiring_negociacoes_trial BOOLEAN := false;
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

    -- Permitir marketing_active = true SE está iniciando trial
    -- Permitir marketing_active = false SE está expirando trial
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
      AND NOT (
        (OLD.marketing_trial_completed IS NOT TRUE)
        AND (COALESCE(OLD.trial_marketing_active, false) = false)
        AND (OLD.trial_marketing_end_date IS NULL)
        AND (NEW.trial_marketing_end_date IS NOT NULL)
      )
    THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.trial_marketing_end_date IS DISTINCT FROM OLD.trial_marketing_end_date THEN
      IF NEW.trial_marketing_end_date IS NOT NULL AND NOT (
        (OLD.marketing_trial_completed IS NOT TRUE)
        AND (COALESCE(OLD.trial_marketing_active, false) = false)
        AND (COALESCE(NEW.trial_marketing_active, false) = true)
        AND (OLD.trial_marketing_end_date IS NULL)
      ) THEN
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

    -- Permitir negociacoes_active = true SE está iniciando trial
    -- Permitir negociacoes_active = false SE está expirando trial
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
      AND NOT (
        (OLD.negociacoes_trial_completed IS NOT TRUE)
        AND (COALESCE(OLD.trial_negociacoes_active, false) = false)
        AND (OLD.trial_negociacoes_end_date IS NULL)
        AND (NEW.trial_negociacoes_end_date IS NOT NULL)
      )
    THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.trial_negociacoes_end_date IS DISTINCT FROM OLD.trial_negociacoes_end_date THEN
      IF NEW.trial_negociacoes_end_date IS NOT NULL AND NOT (
        (OLD.negociacoes_trial_completed IS NOT TRUE)
        AND (COALESCE(OLD.trial_negociacoes_active, false) = false)
        AND (COALESCE(NEW.trial_negociacoes_active, false) = true)
        AND (OLD.trial_negociacoes_end_date IS NULL)
      ) THEN
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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_update_agent_access_fields ON public.profiles;
CREATE TRIGGER trg_prevent_self_update_agent_access_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_update_agent_access_fields();

-- End
