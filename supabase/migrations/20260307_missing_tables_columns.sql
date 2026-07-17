-- =============================================
-- KITO EXPERT — COLUNAS E TABELAS FALTANTES
-- Data: 2026-03-07
-- Baseado no schema REAL do Supabase comparado
-- com o código-fonte do projeto.
-- Idempotente: use ADD COLUMN IF NOT EXISTS e
-- CREATE TABLE IF NOT EXISTS.
-- =============================================


-- ============================================
-- A. COLUNAS FALTANTES EM TABELAS EXISTENTES
-- ============================================

-- --- franchises ---
-- Schema atual: id, name, owner_id, address, phone, email, is_active, created_at, updated_at
-- Código usa: user_id, phone_number, monthly_revenue, active_sessions
-- CAUSA DO ERRO 400: user_id não existe → .eq('user_id', ...) → Bad Request
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC DEFAULT 0;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS active_sessions INTEGER DEFAULT 0;

-- owner_id pode ser NULL (coluna legada substituída por user_id)
ALTER TABLE public.franchises ALTER COLUMN owner_id DROP NOT NULL;

-- Migra owner_id → user_id para registros existentes que tenham owner_id preenchido
UPDATE public.franchises SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;

-- Índice para queries por user_id
CREATE INDEX IF NOT EXISTS idx_franchises_user_id ON public.franchises(user_id);

-- RLS: garante que existe política de acesso
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='franchises' AND policyname='franchises_user_access') THEN
    CREATE POLICY "franchises_user_access" ON public.franchises FOR ALL TO authenticated USING (auth.uid() = user_id OR auth.uid() = owner_id);
  END IF;
END $$;


-- --- agent_configs ---
-- Schema atual: id, user_id, whatsapp_connection_id, agent_name, system_prompt, is_active
-- Projeto usa: agent_type, personality, waha_url, waha_api_key, n8n_webhook_url, chatid, etc.
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS agent_type TEXT NOT NULL DEFAULT 'commercial';
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS personality JSONB;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS presentation JSONB;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS company_knowledge JSONB;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS product_knowledge JSONB;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS technical_config JSONB;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS personality_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS waha_url TEXT;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS waha_api_key TEXT;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS chatid TEXT;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS additional_instructions JSONB;

-- UNIQUE constraint em (user_id, agent_type)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid='public.agent_configs'::regclass AND contype='u' AND conname='agent_configs_user_id_agent_type_key'
  ) THEN
    ALTER TABLE public.agent_configs ADD CONSTRAINT agent_configs_user_id_agent_type_key UNIQUE (user_id, agent_type);
  END IF;
END $$;

-- --- appointments ---
-- Schema atual: professional_id, customer_name, customer_phone, customer_email, service_type, appointment_date, duration_minutes, status, notes
-- Projeto usa: franchise_id, total_price, uses_package
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS uses_package BOOLEAN DEFAULT false;

-- --- customer_packages ---
-- Schema atual: user_id, package_id, start_date, end_date, is_active
-- Projeto usa: customer_id, franchise_id, professional_id, paid, purchase_date, expiration_date
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE;

-- --- customers ---
-- Schema atual: name, phone, email, notes — sem franchise_id
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- --- packages ---
-- Schema atual: name, description, price, billing_cycle, features, is_active — sem franchise_id
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- --- payments ---
-- Schema atual: amount, currency, payment_method, status, external_payment_id, description, stripe_payment_intent_id, stripe_customer_id, is_renewal
-- Projeto usa: asaas_payment_id, asaas_customer_id, plan_type, payment_date
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

-- --- plans ---
-- Schema atual: name, description, price, billing_cycle, features, is_active, monthly_price, annual_price
-- Faltando: trial_days
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;

-- --- professional_working_hours ---
-- Schema atual: user_id, professional_id, day_of_week, start_time, end_time, is_active — sem franchise_id
ALTER TABLE public.professional_working_hours ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL;

-- --- profiles ---
-- Ligações: campos extendidos de pagamento (não existem no Supabase atual)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_monthly_plan_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_annual_plan_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_billing_cycle VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_plan_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_next_billing_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_stripe_subscription_id VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_stripe_payment_id VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_payment_overdue_days INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_grace_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_last_overdue_check TIMESTAMP WITH TIME ZONE;

-- --- services ---
-- Schema atual: name, description, duration_minutes, price, is_active — sem franchise_id/user_id
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- --- user_credentials ---
-- Schema atual (key-value): service_name, credential_key, credential_value, is_active
-- Projeto usa colunas flat para WAHA, N8N, Gemini, Supabase
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS waha_url TEXT;
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS waha_api_key TEXT;
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS n8n_url TEXT;
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS n8n_api_key TEXT;
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS supabase_url TEXT;
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS supabase_anon_key TEXT;
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS supabase_service_role_key TEXT;

-- --- user_websites ---
-- Schema atual: tem domain, status, config, content, theme_config, etc.
-- Faltando: domain_login, domain_password, domain_registrar, github_link, hosting_data, social_links, site_photos
ALTER TABLE public.user_websites ADD COLUMN IF NOT EXISTS domain_login TEXT;
ALTER TABLE public.user_websites ADD COLUMN IF NOT EXISTS domain_password TEXT;
ALTER TABLE public.user_websites ADD COLUMN IF NOT EXISTS domain_registrar TEXT;
ALTER TABLE public.user_websites ADD COLUMN IF NOT EXISTS github_link TEXT;
ALTER TABLE public.user_websites ADD COLUMN IF NOT EXISTS hosting_data JSONB;
ALTER TABLE public.user_websites ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_websites ADD COLUMN IF NOT EXISTS site_photos JSONB DEFAULT '[]'::jsonb;

-- --- whatsapp_connections ---
-- Schema atual: session_name, phone_number, is_connected, qr_code, session_data
-- Projeto usa: waha_status, waha_session_name, n8n_workflow_id, n8n_webhook_url, n8n_status, gemini_status
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS waha_status TEXT DEFAULT 'disconnected';
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS waha_session_name TEXT;
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS n8n_workflow_id TEXT;
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS n8n_status TEXT DEFAULT 'not_created';
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS gemini_status TEXT DEFAULT 'configured';


-- ============================================
-- B. TABELAS COMPLETAMENTE NOVAS
-- ============================================

-- --- appointment_services ---
-- Serviços vinculados a um agendamento (relação N:N)
CREATE TABLE IF NOT EXISTS public.appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  price NUMERIC DEFAULT 0,
  used_package_session BOOLEAN DEFAULT false,
  customer_package_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id ON public.appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON public.appointment_services(service_id);

ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointment_services' AND policyname='appointment_services_access') THEN
    CREATE POLICY "appointment_services_access" ON public.appointment_services FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- --- chat_messages ---
-- Mensagens do chat do agendamento com clientes
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  is_from_customer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_phone ON public.chat_messages(customer_phone);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='chat_messages_access') THEN
    CREATE POLICY "chat_messages_access" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;


-- --- professional_commissions ---
-- Configurações de comissão por profissional/serviço/pacote
CREATE TABLE IF NOT EXISTS public.professional_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  commission_type TEXT NOT NULL DEFAULT 'service' CHECK (commission_type IN ('service', 'package')),
  calculation_type TEXT NOT NULL DEFAULT 'percentage' CHECK (calculation_type IN ('fixed', 'percentage')),
  commission_value NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professional_commissions_professional_id ON public.professional_commissions(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_commissions_franchise_id ON public.professional_commissions(franchise_id);
CREATE INDEX IF NOT EXISTS idx_professional_commissions_active ON public.professional_commissions(active);

ALTER TABLE public.professional_commissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_commissions' AND policyname='professional_commissions_access') THEN
    CREATE POLICY "professional_commissions_access" ON public.professional_commissions FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- --- package_commissions ---
-- View-like table: comissões específicas por pacote/profissional
-- (consultada separadamente de professional_commissions)
CREATE TABLE IF NOT EXISTS public.package_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  calculation_type TEXT NOT NULL DEFAULT 'percentage' CHECK (calculation_type IN ('fixed', 'percentage')),
  commission_value NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_commissions_professional_id ON public.package_commissions(professional_id);
CREATE INDEX IF NOT EXISTS idx_package_commissions_package_id ON public.package_commissions(package_id);

ALTER TABLE public.package_commissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='package_commissions' AND policyname='package_commissions_access') THEN
    CREATE POLICY "package_commissions_access" ON public.package_commissions FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- --- commission_records ---
-- Registros de comissões pagas/geradas por agendamento ou venda de pacote
CREATE TABLE IF NOT EXISTS public.commission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  customer_package_id UUID REFERENCES public.customer_packages(id) ON DELETE SET NULL,
  service_name TEXT,
  service_price NUMERIC DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  commission_type TEXT,
  commission_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_records_professional_id ON public.commission_records(professional_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_appointment_id ON public.commission_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_franchise_id ON public.commission_records(franchise_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON public.commission_records(status);

ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='commission_records' AND policyname='commission_records_access') THEN
    CREATE POLICY "commission_records_access" ON public.commission_records FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- --- package_services ---
-- Serviços inclusos em um pacote (quantidade por serviço)
CREATE TABLE IF NOT EXISTS public.package_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_services_package_id ON public.package_services(package_id);
CREATE INDEX IF NOT EXISTS idx_package_services_service_id ON public.package_services(service_id);

ALTER TABLE public.package_services ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='package_services' AND policyname='package_services_access') THEN
    CREATE POLICY "package_services_access" ON public.package_services FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- --- professional_services ---
-- Serviços que um profissional pode realizar
CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professional_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_professional_services_professional_id ON public.professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_service_id ON public.professional_services(service_id);

ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_services' AND policyname='professional_services_access') THEN
    CREATE POLICY "professional_services_access" ON public.professional_services FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- --- customer_package_services ---
-- Controle de sessões restantes por pacote+serviço do cliente
CREATE TABLE IF NOT EXISTS public.customer_package_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_package_id UUID NOT NULL REFERENCES public.customer_packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  sessions_remaining INTEGER NOT NULL DEFAULT 0,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_package_services_package_id ON public.customer_package_services(customer_package_id);
CREATE INDEX IF NOT EXISTS idx_customer_package_services_service_id ON public.customer_package_services(service_id);
CREATE INDEX IF NOT EXISTS idx_customer_package_services_franchise_id ON public.customer_package_services(franchise_id);

ALTER TABLE public.customer_package_services ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customer_package_services' AND policyname='customer_package_services_access') THEN
    CREATE POLICY "customer_package_services_access" ON public.customer_package_services FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- --- email_verifications ---
-- Códigos de verificação de e-mail para o agendamento
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON public.email_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_verifications' AND policyname='email_verifications_access') THEN
    CREATE POLICY "email_verifications_access" ON public.email_verifications FOR ALL USING (true);
  END IF;
END $$;


-- --- shared_appointment_data (VIEW) ---
-- View usada pelos profissionais para ver seus agendamentos
-- sem precisar de franchise_id (para profissionais que não são donos)
CREATE OR REPLACE VIEW public.shared_appointment_data AS
SELECT
  a.id AS appointment_id,
  a.professional_id,
  a.customer_name,
  a.customer_phone,
  a.customer_email,
  a.appointment_date,
  a.status,
  a.total_price,
  a.notes,
  a.franchise_id,
  a.uses_package,
  a.created_at,
  a.updated_at
FROM public.appointments a;


-- --- whatsapp_business_credentials ---
CREATE TABLE IF NOT EXISTS public.whatsapp_business_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  webhook_url TEXT,
  verify_token TEXT,
  is_active BOOLEAN DEFAULT true,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Coluna token_expires_at para quem já criou a tabela sem ela
ALTER TABLE public.whatsapp_business_credentials ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_wb_creds_user_id ON public.whatsapp_business_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_creds_phone ON public.whatsapp_business_credentials(phone_number);

ALTER TABLE public.whatsapp_business_credentials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_business_credentials' AND policyname='users_own_wb_credentials') THEN
    CREATE POLICY "users_own_wb_credentials" ON public.whatsapp_business_credentials FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- --- whatsapp_business_conversations ---
CREATE TABLE IF NOT EXISTS public.whatsapp_business_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wa_conversation_id TEXT,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wb_convs_user ON public.whatsapp_business_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_convs_phone ON public.whatsapp_business_conversations(customer_phone);

ALTER TABLE public.whatsapp_business_conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_business_conversations' AND policyname='users_own_wb_conversations') THEN
    CREATE POLICY "users_own_wb_conversations" ON public.whatsapp_business_conversations FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "service_role_insert_wb_convs" ON public.whatsapp_business_conversations FOR INSERT WITH CHECK (true);
  END IF;
END $$;


-- --- whatsapp_business_messages ---
CREATE TABLE IF NOT EXISTS public.whatsapp_business_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.whatsapp_business_conversations(id) ON DELETE CASCADE,
  wa_message_id TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wb_msgs_conv ON public.whatsapp_business_messages(conversation_id);

ALTER TABLE public.whatsapp_business_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_business_messages' AND policyname='users_own_wb_messages') THEN
    CREATE POLICY "users_own_wb_messages" ON public.whatsapp_business_messages FOR SELECT USING (
      conversation_id IN (SELECT id FROM public.whatsapp_business_conversations WHERE user_id = auth.uid())
    );
    CREATE POLICY "service_role_insert_wb_msgs" ON public.whatsapp_business_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;


-- --- whatsapp_audit_logs ---
CREATE TABLE IF NOT EXISTS public.whatsapp_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wb_audit_user ON public.whatsapp_audit_logs(user_id);

ALTER TABLE public.whatsapp_audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_audit_logs' AND policyname='users_own_audit_logs') THEN
    CREATE POLICY "users_own_audit_logs" ON public.whatsapp_audit_logs FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "service_role_insert_audit" ON public.whatsapp_audit_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;


-- ============================================
-- C. TRIGGERS DE updated_at PARA TABELAS NOVAS
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_chat_messages_updated_at') THEN
    CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_professional_commissions_updated_at') THEN
    CREATE TRIGGER update_professional_commissions_updated_at BEFORE UPDATE ON public.professional_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_package_commissions_updated_at') THEN
    CREATE TRIGGER update_package_commissions_updated_at BEFORE UPDATE ON public.package_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_commission_records_updated_at') THEN
    CREATE TRIGGER update_commission_records_updated_at BEFORE UPDATE ON public.commission_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_customer_package_services_updated_at') THEN
    CREATE TRIGGER update_customer_package_services_updated_at BEFORE UPDATE ON public.customer_package_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_wb_credentials_updated_at') THEN
    CREATE TRIGGER update_wb_credentials_updated_at BEFORE UPDATE ON public.whatsapp_business_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_wb_conversations_updated_at') THEN
    CREATE TRIGGER update_wb_conversations_updated_at BEFORE UPDATE ON public.whatsapp_business_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ============================================
-- FIM
-- ============================================
SELECT 'Missing tables and columns added successfully!' AS status;
