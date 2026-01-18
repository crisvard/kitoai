-- ============================================
-- KITO EXPERT DASHBOARD - VERSÃO SIMPLIFICADA PARA SUPABASE
-- Estrutura completa sem subqueries para compatibilidade com SQL Editor
-- Execute este SQL no Supabase SQL Editor para criar toda a estrutura
-- Data: Janeiro 2026
-- ============================================

-- ============================================
-- 1. TABELAS DE MARKETING DIGITAL
-- ============================================

CREATE TABLE IF NOT EXISTS user_social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  account_username VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id),
  CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'))
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_post_id VARCHAR(255),
  title VARCHAR(255),
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  platforms JSONB NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (status IN ('pending', 'scheduled', 'published', 'failed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS marketing_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABELAS DE WHATSAPP BUSINESS
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  waha_status TEXT DEFAULT 'disconnected',
  waha_session_name TEXT,
  n8n_workflow_id TEXT,
  n8n_webhook_url TEXT,
  n8n_status TEXT DEFAULT 'not_created',
  gemini_status TEXT DEFAULT 'configured',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL DEFAULT 'commercial',
  personality JSONB,
  presentation JSONB,
  company_knowledge JSONB,
  product_knowledge JSONB,
  technical_config JSONB,
  personality_validated BOOLEAN DEFAULT FALSE,
  waha_url TEXT,
  waha_api_key TEXT,
  n8n_webhook_url TEXT,
  chatid TEXT,
  additional_instructions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_type)
);

CREATE TABLE IF NOT EXISTS chat_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_user_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_id TEXT NOT NULL,
  phone_number TEXT,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELAS DE WEBSITES
-- ============================================

CREATE TABLE IF NOT EXISTS user_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  website_name VARCHAR(255) NOT NULL,
  website_url TEXT,
  segment TEXT,
  status VARCHAR(50) DEFAULT 'paused',
  activated_at TIMESTAMP,
  payment_id VARCHAR(255),
  payment_method VARCHAR(50),
  domain_login TEXT,
  domain_password TEXT,
  domain_registrar TEXT,
  github_link TEXT,
  hosting_data JSONB,
  social_links JSONB DEFAULT '[]'::jsonb,
  site_photos JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_link TEXT,
  domain_login TEXT,
  domain_password TEXT,
  github_link TEXT,
  hosting_data JSONB,
  social_links JSONB DEFAULT '[]'::jsonb,
  site_photos JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABELAS DE LIGAÇÕES (DIALER)
-- ============================================

CREATE TABLE IF NOT EXISTS ligacoes_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABELAS DE NEGOCIAÇÕES (CRIPTO)
-- ============================================

CREATE TABLE IF NOT EXISTS exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  api_key text,
  api_secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  exchange_id uuid REFERENCES exchanges ON DELETE CASCADE,
  symbol text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  average_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  exchange_id uuid REFERENCES exchanges ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  symbol text NOT NULL,
  amount numeric NOT NULL,
  price numeric NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS negociacoes_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABELAS DE SISTEMA DE FRANQUIAS
-- ============================================

CREATE TABLE IF NOT EXISTS franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABELAS DE AGENDAMENTO/PROFISSIONAIS
-- ============================================

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  specialty TEXT,
  role TEXT DEFAULT 'professional',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professional_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TABELAS DE CREDENCIAIS E CONFIGURAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  waha_url TEXT,
  waha_api_key TEXT,
  n8n_url TEXT,
  n8n_api_key TEXT,
  gemini_api_key TEXT,
  supabase_url TEXT,
  supabase_anon_key TEXT,
  supabase_service_role_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- 9. TABELAS DE PAGAMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_payment_id TEXT NOT NULL,
  asaas_customer_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  plan_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price DECIMAL(10,2),
  annual_price DECIMAL(10,2),
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. TABELAS DE SISTEMA DE COMISSÕES
-- ============================================

CREATE TABLE IF NOT EXISTS commission_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  commission_type VARCHAR(50) NOT NULL DEFAULT 'service',
  calculation_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  commission_value DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ALTERAÇÕES NA TABELA PROFILES (SUPABASE AUTH)
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_marketing_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_marketing_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_block_reason TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS negociacoes_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS negociacoes_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_negociacoes_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_negociacoes_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS negociacoes_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS negociacoes_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS negociacoes_block_reason TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ligacoes_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ligacoes_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_block_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_monthly_plan_active BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_annual_plan_active BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_billing_cycle VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_plan_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_next_billing_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_stripe_subscription_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_stripe_payment_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_payment_overdue_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_grace_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ligacoes_last_overdue_check TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_website_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_website_end_date TIMESTAMP WITH TIME ZONE;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_active ON user_social_accounts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_upload_post_id ON scheduled_posts(upload_post_id);

CREATE INDEX IF NOT EXISTS idx_marketing_access_requests_user_id ON marketing_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_access_requests_status ON marketing_access_requests(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id ON whatsapp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_user_id ON agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_agent_type ON agent_configs(agent_type);
CREATE INDEX IF NOT EXISTS idx_chat_templates_user_id ON chat_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_user_ids_user_id_active ON whatsapp_user_ids(user_id, active);

CREATE INDEX IF NOT EXISTS idx_user_websites_user_id ON user_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_status ON user_websites(status);
CREATE INDEX IF NOT EXISTS idx_user_websites_segment ON user_websites(segment);
CREATE INDEX IF NOT EXISTS idx_website_services_user_id ON website_services(user_id);
CREATE INDEX IF NOT EXISTS idx_website_services_status ON website_services(status);
CREATE INDEX IF NOT EXISTS idx_website_services_created_at ON website_services(created_at);

CREATE INDEX IF NOT EXISTS idx_ligacoes_access_requests_user_id ON ligacoes_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ligacoes_access_requests_status ON ligacoes_access_requests(status);

CREATE INDEX IF NOT EXISTS idx_exchanges_user_id ON exchanges(user_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_active ON exchanges(is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_exchange_id ON portfolio(exchange_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_symbol ON portfolio(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_exchange_id ON transactions(exchange_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_negociacoes_access_requests_user_id ON negociacoes_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_access_requests_status ON negociacoes_access_requests(status);

CREATE INDEX IF NOT EXISTS idx_franchises_owner_id ON franchises(owner_id);
CREATE INDEX IF NOT EXISTS idx_franchises_active ON franchises(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_franchise_id ON packages(franchise_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_packages_franchise_id ON customer_packages(franchise_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_id ON customer_packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_user_id ON customer_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_status ON customer_packages(status);

CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_franchise_id ON professionals(franchise_id);
CREATE INDEX IF NOT EXISTS idx_professionals_active ON professionals(active);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_franchise_id ON appointments(franchise_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_user_id ON professional_working_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_franchise_id ON professional_working_hours(franchise_id);
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_professional_id ON professional_working_hours(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_day_of_week ON professional_working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_services_franchise_id ON services(franchise_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_customers_franchise_id ON customers(franchise_id);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_configs_professional ON commission_configs(professional_id);
CREATE INDEX IF NOT EXISTS idx_commission_configs_service ON commission_configs(service_id);
CREATE INDEX IF NOT EXISTS idx_commission_configs_franchise ON commission_configs(franchise_id);
CREATE INDEX IF NOT EXISTS idx_commission_configs_active ON commission_configs(active);

CREATE INDEX IF NOT EXISTS idx_profiles_marketing_active ON profiles(marketing_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_marketing_active ON profiles(trial_marketing_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_marketing_end_date ON profiles(trial_marketing_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_access_blocked ON profiles(marketing_access_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_negociacoes_active ON profiles(negociacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_negociacoes_active ON profiles(trial_negociacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_negociacoes_end_date ON profiles(trial_negociacoes_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_negociacoes_access_blocked ON profiles(negociacoes_access_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ligacoes_active ON profiles(trial_ligacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ligacoes_end_date ON profiles(trial_ligacoes_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_ligacoes_access_blocked ON profiles(ligacoes_access_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_website_active ON profiles(website_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_website_active ON profiles(trial_website_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_website_end_date ON profiles(trial_website_end_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS SIMPLIFICADAS
-- ============================================

ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_user_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE ligacoes_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE negociacoes_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_configs ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas para evitar subqueries
CREATE POLICY "user_social_accounts_policy" ON user_social_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "scheduled_posts_policy" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "marketing_access_requests_policy" ON marketing_access_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "whatsapp_connections_policy" ON whatsapp_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agent_configs_policy" ON agent_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "chat_templates_policy" ON chat_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "whatsapp_user_ids_policy" ON whatsapp_user_ids FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_websites_policy" ON user_websites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "website_services_policy" ON website_services FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ligacoes_access_requests_policy" ON ligacoes_access_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "exchanges_policy" ON exchanges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "portfolio_policy" ON portfolio FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "transactions_policy" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "negociacoes_access_requests_policy" ON negociacoes_access_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "franchises_policy" ON franchises FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "packages_policy" ON packages FOR ALL USING (true);
CREATE POLICY "customer_packages_policy" ON customer_packages FOR ALL USING (true);
CREATE POLICY "professionals_policy" ON professionals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "appointments_policy" ON appointments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "professional_working_hours_policy" ON professional_working_hours FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "services_policy" ON services FOR ALL USING (true);
CREATE POLICY "customers_policy" ON customers FOR ALL USING (true);
CREATE POLICY "user_credentials_policy" ON user_credentials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "payments_policy" ON payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "plans_policy" ON plans FOR SELECT USING (true);
CREATE POLICY "commission_configs_policy" ON commission_configs FOR ALL USING (true);

-- ============================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_social_accounts_updated_at BEFORE UPDATE ON user_social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_access_requests_updated_at BEFORE UPDATE ON marketing_access_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON whatsapp_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_templates_updated_at BEFORE UPDATE ON chat_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_user_ids_updated_at BEFORE UPDATE ON whatsapp_user_ids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_websites_updated_at BEFORE UPDATE ON user_websites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_website_services_updated_at BEFORE UPDATE ON website_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ligacoes_access_requests_updated_at BEFORE UPDATE ON ligacoes_access_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchanges_updated_at BEFORE UPDATE ON exchanges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_negociacoes_access_requests_updated_at BEFORE UPDATE ON negociacoes_access_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON franchises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_packages_updated_at BEFORE UPDATE ON customer_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_working_hours_updated_at BEFORE UPDATE ON professional_working_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_credentials_updated_at BEFORE UPDATE ON user_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_configs_updated_at BEFORE UPDATE ON commission_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIM DO SCRIPT - TODAS AS TABELAS CRIADAS
-- ============================================

SELECT 'Estrutura completa do banco criada com sucesso - versão compatível com Supabase SQL Editor!' as status;