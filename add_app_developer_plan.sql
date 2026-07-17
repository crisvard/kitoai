-- INSERIR PLANO PARA AGENTE APP DEVELOPER

INSERT INTO plans (id, name, description, price, billing_cycle, features, is_active, created_at, updated_at) 
VALUES (
  'app-developer-plan',
  'Plano App Developer',
  'Desenvolvimento de aplicativos mobile e web com entrega completa',
  499.00,
  'one_time',
  '[
    "Desenvolvimento completo de app mobile (iOS/Android)",
    "Desenvolvimento de aplicação web responsiva",
    "Integração com APIs e bancos de dados",
    "Design UI/UX profissional",
    "Testes e garantia de qualidade",
    "Deploy nas lojas (App Store/Play Store)",
    "Suporte técnico por 30 dias",
    "Código fonte completo"
  ]'::jsonb,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  updated_at = NOW();
