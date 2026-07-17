-- MIGRATION: Migrating credit packages to the plans table
-- Run this in your Supabase SQL Editor

INSERT INTO public.plans (id, name, description, price, monthly_price, annual_price, billing_cycle, features, is_active, created_at, updated_at) 
VALUES 
  ('credits_bronze', 'Bronze: 200 Créditos', 'Pacote de 200 Créditos para o Agente de Ligações', 100.00, 100.00, 100.00, 'one_time', '{"credits_amount": 200}'::jsonb, true, NOW(), NOW()),
  ('credits_silver', 'Silver: 500 Créditos', 'Pacote de 500 Créditos para o Agente de Ligações', 250.00, 250.00, 250.00, 'one_time', '{"credits_amount": 500}'::jsonb, true, NOW(), NOW()),
  ('credits_gold', 'Gold: 1000 Créditos', 'Pacote de 1000 Créditos para o Agente de Ligações', 500.00, 500.00, 500.00, 'one_time', '{"credits_amount": 1000}'::jsonb, true, NOW(), NOW()),
  ('credits_platinum', 'Platinum: 2000 Créditos', 'Pacote de 2000 Créditos para o Agente de Ligações', 1000.00, 1000.00, 1000.00, 'one_time', '{"credits_amount": 2000}'::jsonb, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  billing_cycle = EXCLUDED.billing_cycle,
  features = EXCLUDED.features,
  updated_at = NOW();
