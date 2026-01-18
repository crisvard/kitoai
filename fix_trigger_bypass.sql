-- ============================================
-- FIX TRIGGER - ADD SERVICE_ROLE BYPASS
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_self_update_agent_access_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
DECLARE
  is_starting_marketing_trial BOOLEAN := false;
  is_starting_negociacoes_trial BOOLEAN := false;
  is_starting_ligacoes_trial BOOLEAN := false;
  is_expiring_marketing_trial BOOLEAN := false;
  is_expiring_negociacoes_trial BOOLEAN := false;
  is_expiring_ligacoes_trial BOOLEAN := false;
BEGIN
  -- BYPASS: Service role pode fazer qualquer coisa (Edge Functions)
  IF auth.role() = 'service_role' OR auth.role() IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.role() = 'authenticated' THEN
    -- Ligacoes trial detection
    is_starting_ligacoes_trial := (
      (OLD.ligacoes_trial_completed IS NOT TRUE)
      AND (COALESCE(OLD.trial_ligacoes_active, false) = false)
      AND (COALESCE(NEW.trial_ligacoes_active, false) = true)
      AND (OLD.trial_ligacoes_end_date IS NULL)
      AND (NEW.trial_ligacoes_end_date IS NOT NULL)
    );

    is_expiring_ligacoes_trial := (
      (COALESCE(OLD.trial_ligacoes_active, false) = true)
      AND (COALESCE(NEW.trial_ligacoes_active, false) = false)
      AND (COALESCE(NEW.ligacoes_trial_completed, false) = true)
    );

    -- Marketing trial detection
    is_starting_marketing_trial := (
      (OLD.marketing_trial_completed IS NOT TRUE)
      AND (COALESCE(OLD.trial_marketing_active, false) = false)
      AND (COALESCE(NEW.trial_marketing_active, false) = true)
      AND (OLD.trial_marketing_end_date IS NULL)
      AND (NEW.trial_marketing_end_date IS NOT NULL)
    );

    is_expiring_marketing_trial := (
      (COALESCE(OLD.trial_marketing_active, false) = true)
      AND (COALESCE(NEW.trial_marketing_active, false) = false)
      AND (COALESCE(NEW.marketing_trial_completed, false) = true)
    );

    -- Negociacoes trial detection  
    is_starting_negociacoes_trial := (
      (OLD.negociacoes_trial_completed IS NOT TRUE)
      AND (COALESCE(OLD.trial_negociacoes_active, false) = false)
      AND (COALESCE(NEW.trial_negociacoes_active, false) = true)
      AND (OLD.trial_negociacoes_end_date IS NULL)
      AND (NEW.trial_negociacoes_end_date IS NOT NULL)
    );

    is_expiring_negociacoes_trial := (
      (COALESCE(OLD.trial_negociacoes_active, false) = true)
      AND (COALESCE(NEW.trial_negociacoes_active, false) = false)
      AND (COALESCE(NEW.negociacoes_trial_completed, false) = true)
    );

    -- Block ligacoes_active changes (except trial start/expire)
    IF (NEW.ligacoes_active IS DISTINCT FROM OLD.ligacoes_active) THEN
      IF COALESCE(NEW.ligacoes_active, false) = true AND NOT is_starting_ligacoes_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    -- Block marketing_active changes
    IF (NEW.marketing_active IS DISTINCT FROM OLD.marketing_active) THEN
      IF COALESCE(NEW.marketing_active, false) = true AND NOT is_starting_marketing_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;

    -- Block negociacoes_active changes
    IF (NEW.negociacoes_active IS DISTINCT FROM OLD.negociacoes_active) THEN
      IF COALESCE(NEW.negociacoes_active, false) = true AND NOT is_starting_negociacoes_trial THEN
        RAISE EXCEPTION 'Access fields are managed by the system.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$func$;

-- End
