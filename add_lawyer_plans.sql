-- ============================================
-- ADD LAWYER WEBSITE PLANS TO PLANS TABLE
-- ============================================
-- These plans are specifically for lawyers' websites
-- Prices are one-time only (no monthly recurring)
-- Clients are exempt from hosting and maintenance fees
-- Only annual domain renewal is charged separately

-- Ensure the default plan columns exist in the current schema
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS annual_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;

-- Plan 1: Essencial (Essential)
INSERT INTO plans (id, name, description, price, monthly_price, annual_price, features, is_active, plan_type, trial_days) 
VALUES (
  'website-lawyer-essential',
  'Website Essencial para Advogado',
  'Site institucional one-page para advogado autônomo. Construído integralmente dentro do Código de Ética da OAB (Provimento 205/2021).',
  1800.00,  -- One-time price stored in price
  1800.00,  -- Same value in monthly_price for compatibility
  1800.00,  -- Same value in annual_price for compatibility
  '[
    "Página única com áreas de atuação, currículo e contato",
    "Domínio .adv.br e e-mail profissional",
    "WhatsApp e formulário de contato",
    "Ficha no Google Meu Negócio",
    "Hospedagem + SSL no primeiro ano",
    "Isento de taxa de hospedagem e manutenção",
    "Anuidade do domínio cobrada separadamente"
  ]'::jsonb,
  true,
  'professional',
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  plan_type = EXCLUDED.plan_type,
  trial_days = EXCLUDED.trial_days;

-- Plan 2: Profissional (Professional)
INSERT INTO plans (id, name, description, price, monthly_price, annual_price, features, is_active, plan_type, trial_days) 
VALUES (
  'website-lawyer-professional',
  'Website Profissional para Advogado',
  'Solução completa para escritórios pequenos e médios. Construído integralmente dentro do Código de Ética da OAB (Provimento 205/2021).',
  2500.00,  -- One-time price stored in price
  2500.00,  -- Same as monthly_price for compatibility
  2500.00,  -- Same as annual_price for compatibility
  '[
    "Site multi-página (até 6 páginas)",
    "Páginas individuais por área de atuação",
    "Biografia dos sócios e equipe",
    "Espaço para artigos e publicações",
    "Domínio .adv.br, e-mail, WhatsApp, formulário",
    "Hospedagem + SSL + suporte por 30 dias",
    "Isento de taxa de hospedagem e manutenção",
    "Anuidade do domínio cobrada separadamente"
  ]'::jsonb,
  true,
  'professional',
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  plan_type = EXCLUDED.plan_type,
  trial_days = EXCLUDED.trial_days;

-- Plan 3: Boutique
INSERT INTO plans (id, name, description, price, monthly_price, annual_price, features, is_active, plan_type, trial_days) 
VALUES (
  'website-lawyer-boutique',
  'Website Boutique para Advogado',
  'Identidade visual completa para escritórios estabelecidos. Construído integralmente dentro do Código de Ética da OAB (Provimento 205/2021).',
  5800.00,  -- One-time price stored in price
  5800.00,  -- Same as monthly_price for compatibility
  5800.00,  -- Same as annual_price for compatibility
  '[
    "Tudo do pacote Profissional",
    "Criação de identidade visual (marca, paleta, tipografia)",
    "Sessão fotográfica orientada (terceirizada)",
    "Diagramação de publicações e e-books",
    "Hospedagem + SSL + suporte por 90 dias",
    "Isento de taxa de hospedagem e manutenção",
    "Anuidade do domínio cobrada separadamente"
  ]'::jsonb,
  true,
  'professional',
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  plan_type = EXCLUDED.plan_type,
  trial_days = EXCLUDED.trial_days;

-- Verify insertion
SELECT 
  'Lawyer Plans Status:' as check,
  id,
  name,
  price,
  monthly_price,
  annual_price,
  is_active
FROM plans 
WHERE id LIKE 'website-lawyer-%'
ORDER BY price;
