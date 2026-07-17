-- Add access control fields + request tables for new agents
-- Minimal approach aligned with existing project patterns:
-- - Access flags live in profiles (easy reads across the app)
-- - Each agent gets its own request table (activation/block/trial requests)

-- ============================================
-- PROFILES: Marketing
-- ============================================
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

-- ============================================
-- PROFILES: Negociações
-- ============================================
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


-- ============================================
-- REQUEST TABLES (one per agent)
-- ============================================

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


-- ============================================
-- Protect access flags in profiles
-- ============================================
-- The project currently allows authenticated users to update their own profile.
-- To actually control activation/blocking from the database/admin side,
-- block authenticated users from changing these access-related columns directly.

CREATE OR REPLACE FUNCTION public.prevent_self_update_agent_access_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    -- Bloquear qualquer tentativa de "upgrade" de acesso feita pelo próprio usuário.
    -- Permitir apenas "downgrade" (expirar trial / desligar), para não travar rotinas do próprio app.

    -- Permitir iniciar o trial (1x) para os novos agentes, igual ao fluxo do WhatsApp.
    -- Condição: ainda não completou trial, trial estava desligado, e está definindo end_date pela primeira vez.
    IF (OLD.marketing_trial_completed IS NOT TRUE)
      AND (COALESCE(OLD.trial_marketing_active, false) = false)
      AND (COALESCE(NEW.trial_marketing_active, false) = true)
      AND (OLD.trial_marketing_end_date IS NULL)
      AND (NEW.trial_marketing_end_date IS NOT NULL)
    THEN
      -- ok: start trial marketing
      NULL;
    ELSIF (OLD.negociacoes_trial_completed IS NOT TRUE)
      AND (COALESCE(OLD.trial_negociacoes_active, false) = false)
      AND (COALESCE(NEW.trial_negociacoes_active, false) = true)
      AND (OLD.trial_negociacoes_end_date IS NULL)
      AND (NEW.trial_negociacoes_end_date IS NOT NULL)
    THEN
      -- ok: start trial negociacoes
      NULL;
    END IF;

    -- Marketing
    IF (NEW.marketing_active IS DISTINCT FROM OLD.marketing_active) AND COALESCE(NEW.marketing_active, false) = true THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
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
      -- Permitir definir a end_date apenas no start do trial (1x).
      -- Permitir expiração (setar null). Bloquear extensão/alteração em qualquer outro caso.
      IF NEW.trial_marketing_end_date IS NOT NULL AND NOT (
        (OLD.marketing_trial_completed IS NOT TRUE)
        AND (COALESCE(OLD.trial_marketing_active, false) = false)
        AND (COALESCE(NEW.trial_marketing_active, false) = true)
        AND (OLD.trial_marketing_end_date IS NULL)
      ) THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    -- Não permitir resetar "trial_completed" para false
    IF (OLD.marketing_trial_completed = true) AND (COALESCE(NEW.marketing_trial_completed, false) = false) THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.marketing_activation_date IS DISTINCT FROM OLD.marketing_activation_date AND NEW.marketing_activation_date IS NOT NULL THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.marketing_access_blocked IS DISTINCT FROM OLD.marketing_access_blocked THEN
      -- Bloqueio/desbloqueio só por sistema
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    IF NEW.marketing_block_reason IS DISTINCT FROM OLD.marketing_block_reason AND NEW.marketing_block_reason IS NOT NULL THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
    END IF;

    -- Negociações
    IF (NEW.negociacoes_active IS DISTINCT FROM OLD.negociacoes_active) AND COALESCE(NEW.negociacoes_active, false) = true THEN
      RAISE EXCEPTION 'Access fields are managed by the system.';
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
