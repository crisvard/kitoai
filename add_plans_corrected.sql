-- SQL para adicionar planos à tabela 'plans' com as colunas corretas
-- Este script insere os planos necessários para o funcionamento do sistema

-- Plano de Website (Desenvolvimento)
INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, features, is_active, trial_days, max_users, max_websites, max_social_accounts, max_whatsapp_connections, created_at, updated_at)
VALUES (
  'website',
  'Plano de Desenvolvimento de Website',
  'Plano para desenvolvimento e hospedagem de websites personalizados',
  1490.00,
  14900.00,
  '{"features": ["Desenvolvimento personalizado", "Hospedagem inclusiva", "Suporte técnico", "Domínio personalizado"]}',
  true,
  7,
  1,
  1,
  5,
  1,
  NOW(),
  NOW()
);

-- Plano de WhatsApp (Agendamentos)
INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, features, is_active, trial_days, max_users, max_websites, max_social_accounts, max_whatsapp_connections, created_at, updated_at)
VALUES (
  'plan-agendamentos',
  'Plano de Agendamentos WhatsApp',
  'Plano para gestão de agendamentos via WhatsApp',
  299.00,
  2990.00,
  '{"features": ["Agendamentos ilimitados", "Integração com WhatsApp", "Notificações automáticas", "Gerenciamento de clientes"]}',
  true,
  7,
  1,
  1,
  5,
  1,
  NOW(),
  NOW()
);

-- Plano de Ligações
INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, features, is_active, trial_days, max_users, max_websites, max_social_accounts, max_whatsapp_connections, created_at, updated_at)
VALUES (
  'plan-ligacoes',
  'Plano de Ligações',
  'Plano para gestão de ligações e atendimento',
  199.00,
  1990.00,
  '{"features": ["Ligações ilimitadas", "Gravação de chamadas", "Relatórios de atendimento", "Integração com CRM"]}',
  true,
  7,
  1,
  1,
  5,
  1,
  NOW(),
  NOW()
);

-- Plano de Marketing
INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, features, is_active, trial_days, max_users, max_websites, max_social_accounts, max_whatsapp_connections, created_at, updated_at)
VALUES (
  'plan-marketing',
  'Plano de Marketing Digital',
  'Plano para gestão de campanhas de marketing digital',
  399.00,
  3990.00,
  '{"features": ["Gestão de redes sociais", "Campanhas pagas", "Análise de desempenho", "Relatórios personalizados"]}',
  true,
  7,
  1,
  1,
  5,
  1,
  NOW(),
  NOW()
);

-- Plano de Negociações
INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, features, is_active, trial_days, max_users, max_websites, max_social_accounts, max_whatsapp_connections, created_at, updated_at)
VALUES (
  'plan-negociacoes',
  'Plano de Negociações',
  'Plano para gestão de negociações e transações',
  499.00,
  4990.00,
  '{"features": ["Gestão de transações", "Análise de mercado", "Relatórios financeiros", "Integração com exchanges"]}',
  true,
  7,
  1,
  1,
  5,
  1,
  NOW(),
  NOW()
);