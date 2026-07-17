-- ============================================
-- CORREÇÃO: Campo whatsapp_trial_completed
-- Este script garante que o campo existe e está 
-- marcado corretamente para usuários que já usaram o trial
-- ============================================

-- 1. Adicionar coluna whatsapp_trial_completed se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'whatsapp_trial_completed'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN whatsapp_trial_completed BOOLEAN DEFAULT false;
    
    RAISE NOTICE 'Coluna whatsapp_trial_completed criada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna whatsapp_trial_completed já existe';
  END IF;
END $$;

-- 2. Marcar whatsapp_trial_completed = true para usuários que:
--    - Já usaram o trial (trial_active = false) E
--    - Tinham uma data de término de trial no passado OU
--    - Têm trial_completed = true (se esse campo existir)
UPDATE public.profiles
SET whatsapp_trial_completed = true
WHERE 
  (
    -- Caso 1: Trial estava ativo mas expirou
    (trial_active = false AND trial_end_date IS NOT NULL AND trial_end_date < NOW())
    OR
    -- Caso 2: Tinha trial_completed = true (campo antigo, se existir)
    (trial_completed = true)
    OR
    -- Caso 3: Usuário contratou o plano (prova que usou ou pulou o trial)
    (whatsapp_active = true)
    OR
    (agendamentos_active = true AND trial_active = false)
  )
  AND whatsapp_trial_completed = false;

-- 3. Verificar quantos usuários foram atualizados
DO $$
DECLARE
  total_updated INTEGER;
  total_completed INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_completed 
  FROM public.profiles 
  WHERE whatsapp_trial_completed = true;
  
  RAISE NOTICE 'Total de usuários com trial do WhatsApp completado: %', total_completed;
END $$;

-- 4. Listar usuários afetados (opcional - para debug)
-- SELECT id, email, trial_active, trial_end_date, whatsapp_trial_completed, whatsapp_active, agendamentos_active
-- FROM public.profiles
-- WHERE whatsapp_trial_completed = true
-- ORDER BY trial_end_date DESC NULLS LAST
-- LIMIT 20;

-- ============================================
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- para garantir que a coluna existe e está configurada corretamente
-- ============================================
