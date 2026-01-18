-- ============================================
-- ADD WEBSITE SERVICE PLAN TO PLANS TABLE
-- ============================================

-- Add website plan to plans table
INSERT INTO plans (id, name, description, price, monthly_price, annual_price, features) VALUES
('website', 'Desenvolvimento de Sites', 'Plano completo para gerenciamento de projetos web com credenciais seguras', 149.00, 149.00, 1490.00,
 '["Gerenciamento de projetos web", "Armazenamento de credenciais", "Dados de hospedagem", "Integração com GitHub"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features;
