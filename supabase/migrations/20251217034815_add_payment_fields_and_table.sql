-- Apenas campos essenciais na tabela profiles (já existentes)
-- Nenhuma alteração na estrutura do banco necessária
-- Os campos serão adicionados apenas se não existirem

-- Popular tabela plans com dados dos planos existentes
INSERT INTO plans (id, name, monthly_price, annual_price, features) VALUES
('whatsapp', 'Agente de WhatsApp', 250.00, 1500.00,
 '["Agendamento online 24/7", "Gestão de profissionais", "Lembretes automáticos", "Relatórios de performance"]'::jsonb),
('ligacoes', 'Plano Agente de Ligações', 299.00, 2990.00,
 '["Até 10.000 ligações/mês", "IA de voz natural", "Relatórios detalhados", "Suporte prioritário"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features;