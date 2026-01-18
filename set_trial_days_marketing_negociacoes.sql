-- ============================================
-- SET TRIAL DAYS (Marketing + Negociações)
-- ============================================
-- O trial no app é controlado por campos em `profiles` e a página `/trial-confirmation` usa 3 dias.
-- Este SQL só alinha o campo `trial_days` na tabela `plans` (se você usa isso em relatórios/adm).

UPDATE public.plans
SET trial_days = 3
WHERE id IN ('marketing', 'negociacoes');
