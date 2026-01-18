-- ============================================
-- AGENTE DE DESENVOLVIMENTO - ACESSO GRATUITO
-- (Sem trial - acesso direto para usuários cadastrados)
-- ============================================

-- Atualizar o plano website para "Agente de Desenvolvimento" na tabela plans
-- Definir como gratuito (price = 0)
UPDATE public.plans 
SET 
  name = 'Agente de Desenvolvimento',
  description = 'IA para geração de código, desenvolvimento de sites e aplicações',
  price = 0,
  monthly_price = 0,
  annual_price = 0,
  trial_days = 0
WHERE id = 'website';

-- Se o plano não existir, criar
INSERT INTO public.plans (id, name, description, price, monthly_price, annual_price, trial_days, features)
VALUES (
  'desenvolvimento', 
  'Agente de Desenvolvimento', 
  'IA para geração de código, desenvolvimento de sites e aplicações',
  0,
  0, 
  0, 
  0, 
  '["Geração de código com IA", "Desenvolvimento de sites e aplicações", "Integração com GitHub", "Suporte a múltiplas linguagens"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  trial_days = EXCLUDED.trial_days;

-- End
