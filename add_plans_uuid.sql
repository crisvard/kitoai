-- SQL para adicionar planos à tabela 'plans' com IDs UUID
-- Este script insere os planos necessários para o funcionamento do sistema

-- Plano de Website (Desenvolvimento)
INSERT INTO public.plans (id, name, description, price, features, is_active, billing_cycle, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Plano de Desenvolvimento de Website',
  'Plano para desenvolvimento e hospedagem de websites personalizados',
  1490.00,
  '{"features": ["Desenvolvimento personalizado", "Hospedagem inclusiva", "Suporte técnico", "Domínio personalizado"]}',
  true,
  'monthly',
  NOW(),
  NOW()
);

-- Plano de WhatsApp (Agendamentos)
INSERT INTO public.plans (id, name, description, price, features, is_active, billing_cycle, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'Plano de Agendamentos WhatsApp',
  'Plano para gestão de agendamentos via WhatsApp',
  299.00,
  '{"features": ["Agendamentos ilimitados", "Integração com WhatsApp", "Notificações automáticas", "Gerenciamento de clientes"]}',
  true,
  'monthly',
  NOW(),
  NOW()
);

-- Plano de Ligações
INSERT INTO public.plans (id, name, description, price, features, is_active, billing_cycle, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'Plano de Ligações',
  'Plano para gestão de ligações e atendimento',
  199.00,
  '{"features": ["Ligações ilimitadas", "Gravação de chamadas", "Relatórios de atendimento", "Integração com CRM"]}',
  true,
  'monthly',
  NOW(),
  NOW()
);

-- Plano de Marketing
INSERT INTO public.plans (id, name, description, price, features, is_active, billing_cycle, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  'Plano de Marketing Digital',
  'Plano para gestão de campanhas de marketing digital',
  399.00,
  '{"features": ["Gestão de redes sociais", "Campanhas pagas", "Análise de desempenho", "Relatórios personalizados"]}',
  true,
  'monthly',
  NOW(),
  NOW()
);

-- Plano de Negociações
INSERT INTO public.plans (id, name, description, price, features, is_active, billing_cycle, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'Plano de Negociações',
  'Plano para gestão de negociações e transações',
  499.00,
  '{"features": ["Gestão de transações", "Análise de mercado", "Relatórios financeiros", "Integração com exchanges"]}',
  true,
  'monthly',
  NOW(),
  NOW()
);