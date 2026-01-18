-- ============================================
-- GUIA DE EXECUÇÃO: VERIFICAÇÃO E CRIAÇÃO DE TODAS AS TABELAS
-- ============================================

/*
INSTRUÇÕES PARA EXECUTAR OS ARQUIVOS SQL:

1. Abra o Supabase Dashboard
2. Vá para SQL Editor
3. Execute os arquivos nesta ordem:

   a) check_profiles.sql - Perfis de usuário (tabela base)
   b) check_plans.sql - Planos disponíveis no sistema
   c) check_user_plans.sql - Relacionamento usuário-plano
   d) check_user_social_accounts.sql - Contas sociais dos usuários
   e) check_scheduled_posts.sql - Posts agendados
   f) check_whatsapp_connections.sql - Conexões WhatsApp
   g) check_agent_configs.sql - Configurações de agentes
   h) check_user_websites.sql - Websites dos usuários
   i) check_verification_codes.sql - Códigos de verificação
   j) check_exchanges.sql - Exchanges de cripto
   k) check_portfolio.sql - Portfólio de investimentos
   l) check_professionals.sql - Profissionais do sistema
   m) check_appointments.sql - Agendamentos
   n) check_franchises.sql - Franquias
   o) check_commissions.sql - Comissões
   p) check_negotiations.sql - Negociações
   q) check_marketing_access_requests.sql - Solicitações de acesso marketing
   r) check_chat_templates.sql - Templates de chat
   s) check_whatsapp_user_ids.sql - IDs de usuário WhatsApp
   t) check_website_services.sql - Serviços de website
   u) check_ligacoes_access_requests.sql - Solicitações de acesso ligações
   v) check_transactions.sql - Transações de cripto
   w) check_negociacoes_access_requests.sql - Solicitações de acesso negociações
   x) check_packages.sql - Pacotes disponíveis
   y) check_customer_packages.sql - Pacotes dos clientes
   z) check_professional_working_hours.sql - Horários de trabalho profissionais
   aa) check_services.sql - Serviços disponíveis
   bb) check_commission_configs.sql - Configurações de comissão
   cc) check_payments.sql - Pagamentos
   dd) check_user_credentials.sql - Credenciais dos usuários

4. Cada arquivo:
   - Verifica se a tabela existe
   - Cria a tabela se necessário
   - Verifica e adiciona colunas faltantes
   - Configura índices, RLS e triggers
   - Mostra status de verificação

5. Após executar todos, verifique se não há erros no SQL Editor

6. Próximos passos:
   - Deploy das Edge Functions (send-verification-code, verify-verification-code)
   - Teste do fluxo de registro
   - Verificação dos módulos (Marketing, WhatsApp, Website, etc.)

NOTA: Estes arquivos são seguros para executar múltiplas vezes,
pois usam IF NOT EXISTS e IF NOT EXISTS para evitar conflitos.
*/

-- Verificar status geral das tabelas após execução
SELECT
  'TABLE EXISTENCE SUMMARY' as summary,
  COUNT(*) as total_tables_checked,
  SUM(CASE WHEN table_name IN (
    'profiles', 'plans', 'user_plans', 'user_social_accounts',
    'scheduled_posts', 'whatsapp_connections', 'agent_configs',
    'user_websites', 'verification_codes', 'exchanges', 'portfolio',
    'professionals', 'appointments', 'franchises', 'commissions',
    'negotiations'
  ) THEN 1 ELSE 0 END) as tables_found
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'plans', 'user_plans', 'user_social_accounts',
    'scheduled_posts', 'whatsapp_connections', 'agent_configs',
    'user_websites', 'verification_codes', 'exchanges', 'portfolio',
    'professionals', 'appointments', 'franchises', 'commissions',
    'negotiations', 'marketing_access_requests', 'chat_templates',
    'whatsapp_user_ids', 'website_services', 'ligacoes_access_requests',
    'transactions', 'negociacoes_access_requests', 'packages',
    'customer_packages', 'professional_working_hours', 'services',
    'commission_configs', 'payments', 'user_credentials'
  );

-- Verificar se RLS está habilitado nas tabelas críticas
SELECT
  'RLS STATUS CHECK' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'user_social_accounts', 'scheduled_posts',
    'whatsapp_connections', 'user_websites', 'verification_codes',
    'marketing_access_requests', 'ligacoes_access_requests',
    'negociacoes_access_requests', 'user_credentials'
  )
ORDER BY tablename;

SELECT '🎉 Database schema verification completed! All tables should now be properly configured.' as final_status;