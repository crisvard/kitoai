-- =============================================
-- KITO EXPERT — SQL COMPLETO E CONSOLIDADO
-- Data: 2026-03-07
-- Inclui: todas as tabelas, colunas, índices,
-- RLS, triggers, functions e planos.
-- Execute no Supabase SQL Editor (idempotente).
-- =============================================


-- ============================================
-- EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================
-- 1. PROFILES (tabela base do Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Dados pessoais
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado TEXT;

-- Pagamento geral
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- WhatsApp
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_whatsapp_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_whatsapp_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_block_reason TEXT;

-- Marketing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_marketing_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_marketing_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_block_reason TEXT;

-- Negociações
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS negociacoes_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS negociacoes_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_negociacoes_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_negociacoes_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS negociacoes_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS negociacoes_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS negociacoes_block_reason TEXT;

-- Ligações
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ligacoes_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ligacoes_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ligacoes_block_reason TEXT;
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

-- Website
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_website_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_website_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_block_reason TEXT;

-- Agendamentos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS appointments_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS appointments_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_appointments_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_appointments_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS appointments_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS appointments_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS appointments_block_reason TEXT;

-- Franquias
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS franchises_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS franchises_activation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_franchises_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_franchises_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS franchises_trial_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS franchises_access_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS franchises_block_reason TEXT;


-- ============================================
-- 2. FUNÇÃO GLOBAL DE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de updated_at para profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='handle_updated_at' AND tgrelid='public.profiles'::regclass) THEN
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Trigger automático de criação de perfil ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;


-- ============================================
-- 3. MARKETING — REDES SOCIAIS
-- ============================================
CREATE TABLE IF NOT EXISTS user_social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_id TEXT,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id),
  CHECK (platform IN ('instagram','facebook','twitter','linkedin','tiktok','youtube'))
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
  CHECK (status IN ('pending','scheduled','published','failed','cancelled'))
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
-- 4. WHATSAPP (WAHA) — LEGADO
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

-- Garante colunas caso tabela já exista com schema antigo
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS waha_status TEXT DEFAULT 'disconnected';
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS waha_session_name TEXT;
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS n8n_workflow_id TEXT;
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS n8n_status TEXT DEFAULT 'not_created';
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS gemini_status TEXT DEFAULT 'configured';

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

-- Garante colunas caso tabela já exista com schema antigo (sem agent_type, personality, etc.)
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

-- Garante constraint unique caso tenha sido criada sem ela
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.agent_configs'::regclass
      AND contype = 'u'
      AND conname = 'agent_configs_user_id_agent_type_key'
  ) THEN
    ALTER TABLE public.agent_configs ADD CONSTRAINT agent_configs_user_id_agent_type_key UNIQUE (user_id, agent_type);
  END IF;
END $$;

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
  whatsapp_id TEXT,
  phone_number TEXT,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante colunas caso tabela já exista com schema antigo (whatsapp_user_id → whatsapp_id, is_active → active)
ALTER TABLE public.whatsapp_user_ids ADD COLUMN IF NOT EXISTS whatsapp_id TEXT;
ALTER TABLE public.whatsapp_user_ids ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.whatsapp_user_ids ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.whatsapp_user_ids ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;


-- ============================================
-- 5. WHATSAPP BUSINESS API OFICIAL (META)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_business_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  webhook_url TEXT,
  verify_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_business_conversations (
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

CREATE TABLE IF NOT EXISTS whatsapp_business_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_business_conversations(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS whatsapp_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- 6. WEBSITES
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

-- Landing pages
CREATE TABLE IF NOT EXISTS user_landing_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT,
  subdomain TEXT,
  template TEXT,
  content JSONB,
  settings JSONB,
  is_active BOOLEAN DEFAULT false,
  activation_date TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS landing_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landing_page_id UUID REFERENCES user_landing_pages(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- 7. LIGAÇÕES (DIALER)
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
-- 8. NEGOCIAÇÕES (CRIPTO)
-- ============================================
CREATE TABLE IF NOT EXISTS exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  exchange_id UUID REFERENCES exchanges ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  average_price NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  exchange_id UUID REFERENCES exchanges ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy','sell')),
  symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
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
-- 9. SISTEMA DE FRANQUIAS / AGENDAMENTO
-- ============================================
CREATE TABLE IF NOT EXISTS franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante colunas caso tabela já exista com schema antigo (franchise_name → name, contact_email → email, etc.)
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

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

-- Garante colunas caso tabela já exista com schema antigo
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS franchise_id UUID;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'professional';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

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

-- Garante colunas caso tabela já exista com schema antigo
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS franchise_id UUID;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

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

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  service TEXT,
  date DATE,
  time TIME,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante colunas caso tabela já exista com schema antigo
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS franchise_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS professional_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS time TIME;

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
-- 10. CREDENCIAIS DE USUÁRIO
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
-- 11. PAGAMENTOS E PLANOS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_payment_id TEXT,
  asaas_customer_id TEXT,
  amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  plan_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garante colunas caso tabela já exista com schema antigo
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_type TEXT;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'asaas';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  monthly_price DECIMAL(10,2),
  annual_price DECIMAL(10,2),
  trial_days INTEGER DEFAULT 0,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;


-- ============================================
-- 12. SISTEMA DE COMISSÕES
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
-- 13. VERIFICAÇÃO DE E-MAIL
-- ============================================
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- ÍNDICES
-- ============================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_active ON profiles(marketing_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_marketing_active ON profiles(trial_marketing_active);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_access_blocked ON profiles(marketing_access_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_negociacoes_active ON profiles(negociacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_negociacoes_active ON profiles(trial_negociacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_negociacoes_access_blocked ON profiles(negociacoes_access_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ligacoes_active ON profiles(trial_ligacoes_active);
CREATE INDEX IF NOT EXISTS idx_profiles_ligacoes_access_blocked ON profiles(ligacoes_access_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_website_active ON profiles(website_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_website_active ON profiles(trial_website_active);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_active ON profiles(whatsapp_active);

-- user_social_accounts
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);

-- scheduled_posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);

-- whatsapp
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id ON whatsapp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_user_id ON agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_agent_type ON agent_configs(agent_type);
CREATE INDEX IF NOT EXISTS idx_chat_templates_user_id ON chat_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_user_ids_user_id_active ON whatsapp_user_ids(user_id, active);

-- whatsapp business api
CREATE INDEX IF NOT EXISTS idx_wb_creds_user_id ON whatsapp_business_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_creds_phone ON whatsapp_business_credentials(phone_number);
CREATE INDEX IF NOT EXISTS idx_wb_convs_user ON whatsapp_business_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_convs_phone ON whatsapp_business_conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_wb_msgs_conv ON whatsapp_business_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wb_audit_user ON whatsapp_audit_logs(user_id);

-- websites
CREATE INDEX IF NOT EXISTS idx_user_websites_user_id ON user_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_status ON user_websites(status);
CREATE INDEX IF NOT EXISTS idx_website_services_user_id ON website_services(user_id);
CREATE INDEX IF NOT EXISTS idx_website_services_status ON website_services(status);

-- exchanges / portfolio / transactions
CREATE INDEX IF NOT EXISTS idx_exchanges_user_id ON exchanges(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_exchange_id ON portfolio(exchange_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- franchises / appointments
CREATE INDEX IF NOT EXISTS idx_franchises_owner_id ON franchises(owner_id);
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_franchise_id ON professionals(franchise_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_professional_working_hours_professional_id ON professional_working_hours(professional_id);
CREATE INDEX IF NOT EXISTS idx_customers_franchise_id ON customers(franchise_id);

-- payments / plans
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);

-- user_credentials
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);

-- verification_codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- access_requests
CREATE INDEX IF NOT EXISTS idx_marketing_access_requests_user_id ON marketing_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ligacoes_access_requests_user_id ON ligacoes_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_access_requests_user_id ON negociacoes_access_requests(user_id);


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_user_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_services ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- user_social_accounts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_social_accounts' AND policyname='Users can view their own social accounts') THEN
    CREATE POLICY "Users can view their own social accounts" ON user_social_accounts FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own social accounts" ON user_social_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own social accounts" ON user_social_accounts FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own social accounts" ON user_social_accounts FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- scheduled_posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='scheduled_posts' AND policyname='Users can view their own scheduled posts') THEN
    CREATE POLICY "Users can view their own scheduled posts" ON scheduled_posts FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own scheduled posts" ON scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own scheduled posts" ON scheduled_posts FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own scheduled posts" ON scheduled_posts FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- marketing_access_requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketing_access_requests' AND policyname='Users can view own marketing requests') THEN
    CREATE POLICY "Users can view own marketing requests" ON marketing_access_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own marketing requests" ON marketing_access_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;

  -- whatsapp_connections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_connections' AND policyname='Users can view own whatsapp connection') THEN
    CREATE POLICY "Users can view own whatsapp connection" ON whatsapp_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own whatsapp connection" ON whatsapp_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own whatsapp connection" ON whatsapp_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- agent_configs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_configs' AND policyname='Users can view own agent configs') THEN
    CREATE POLICY "Users can view own agent configs" ON agent_configs FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own agent configs" ON agent_configs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own agent configs" ON agent_configs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- chat_templates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_templates' AND policyname='Users can view own chat templates') THEN
    CREATE POLICY "Users can view own chat templates" ON chat_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own chat templates" ON chat_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own chat templates" ON chat_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own chat templates" ON chat_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- whatsapp_user_ids
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_user_ids' AND policyname='Users can view own whatsapp users') THEN
    CREATE POLICY "Users can view own whatsapp users" ON whatsapp_user_ids FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own whatsapp users" ON whatsapp_user_ids FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own whatsapp users" ON whatsapp_user_ids FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- whatsapp_business_credentials
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_business_credentials' AND policyname='users_own_wb_credentials') THEN
    CREATE POLICY "users_own_wb_credentials" ON whatsapp_business_credentials FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- whatsapp_business_conversations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_business_conversations' AND policyname='users_own_wb_conversations') THEN
    CREATE POLICY "users_own_wb_conversations" ON whatsapp_business_conversations FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "service_role_insert_wb_convs" ON whatsapp_business_conversations FOR INSERT WITH CHECK (true);
  END IF;

  -- whatsapp_business_messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_business_messages' AND policyname='users_own_wb_messages') THEN
    CREATE POLICY "users_own_wb_messages" ON whatsapp_business_messages FOR SELECT USING (
      conversation_id IN (SELECT id FROM whatsapp_business_conversations WHERE user_id = auth.uid())
    );
    CREATE POLICY "service_role_insert_wb_msgs" ON whatsapp_business_messages FOR INSERT WITH CHECK (true);
  END IF;

  -- whatsapp_audit_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_audit_logs' AND policyname='users_own_audit_logs') THEN
    CREATE POLICY "users_own_audit_logs" ON whatsapp_audit_logs FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "service_role_insert_audit" ON whatsapp_audit_logs FOR INSERT WITH CHECK (true);
  END IF;

  -- user_websites
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_websites' AND policyname='Users can view their own websites') THEN
    CREATE POLICY "Users can view their own websites" ON user_websites FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own websites" ON user_websites FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own websites" ON user_websites FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own websites" ON user_websites FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- website_services
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='website_services' AND policyname='Users can view own websites') THEN
    CREATE POLICY "Users can view own websites" ON website_services FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own websites" ON website_services FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own websites" ON website_services FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own websites" ON website_services FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- user_landing_pages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_landing_pages' AND policyname='Users can view own landing pages') THEN
    CREATE POLICY "Users can view own landing pages" ON user_landing_pages FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own landing pages" ON user_landing_pages FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own landing pages" ON user_landing_pages FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own landing pages" ON user_landing_pages FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- landing_services
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='landing_services' AND policyname='Users can view own landing services') THEN
    CREATE POLICY "Users can view own landing services" ON landing_services FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own landing services" ON landing_services FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own landing services" ON landing_services FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own landing services" ON landing_services FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- ligacoes_access_requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ligacoes_access_requests' AND policyname='Users can view own ligacoes requests') THEN
    CREATE POLICY "Users can view own ligacoes requests" ON ligacoes_access_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own ligacoes requests" ON ligacoes_access_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;

  -- exchanges
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exchanges' AND policyname='Users can view own exchanges') THEN
    CREATE POLICY "Users can view own exchanges" ON exchanges FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own exchanges" ON exchanges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own exchanges" ON exchanges FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own exchanges" ON exchanges FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- portfolio
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio' AND policyname='Users can view own portfolio') THEN
    CREATE POLICY "Users can view own portfolio" ON portfolio FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own portfolio" ON portfolio FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own portfolio" ON portfolio FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own portfolio" ON portfolio FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- transactions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='Users can view own transactions') THEN
    CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- negociacoes_access_requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='negociacoes_access_requests' AND policyname='Users can view own negociacoes requests') THEN
    CREATE POLICY "Users can view own negociacoes requests" ON negociacoes_access_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own negociacoes requests" ON negociacoes_access_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;

  -- franchises
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='franchises' AND policyname='Users can view franchises they own') THEN
    CREATE POLICY "Users can view franchises they own" ON franchises FOR SELECT TO authenticated USING (auth.uid() = owner_id);
    CREATE POLICY "Users can insert franchises they own" ON franchises FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
    CREATE POLICY "Users can update franchises they own" ON franchises FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
  END IF;

  -- packages, customer_packages, services, customers (políticas abertas pois dependem de franchise_id)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='packages' AND policyname='Franchise packages access') THEN
    CREATE POLICY "Franchise packages access" ON packages FOR ALL TO authenticated USING (true);
    CREATE POLICY "Franchise customer_packages access" ON customer_packages FOR ALL TO authenticated USING (true);
    CREATE POLICY "Franchise services access" ON services FOR ALL TO authenticated USING (true);
    CREATE POLICY "Franchise customers access" ON customers FOR ALL TO authenticated USING (true);
  END IF;

  -- professionals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professionals' AND policyname='Users can view own professionals') THEN
    CREATE POLICY "Users can view own professionals" ON professionals FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own professionals" ON professionals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own professionals" ON professionals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own professionals" ON professionals FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- appointments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointments' AND policyname='Users can view own appointments') THEN
    CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own appointments" ON appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- professional_working_hours
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_working_hours' AND policyname='Users can view own working hours') THEN
    CREATE POLICY "Users can view own working hours" ON professional_working_hours FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own working hours" ON professional_working_hours FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own working hours" ON professional_working_hours FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own working hours" ON professional_working_hours FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- user_credentials
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_credentials' AND policyname='Users can view own credentials') THEN
    CREATE POLICY "Users can view own credentials" ON user_credentials FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own credentials" ON user_credentials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own credentials" ON user_credentials FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own credentials" ON user_credentials FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- payments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='Users can view own payments') THEN
    CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Webhook insert payments" ON payments FOR INSERT WITH CHECK (true);
    CREATE POLICY "Webhook update payments" ON payments FOR UPDATE USING (true);
  END IF;

  -- plans
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plans' AND policyname='Everyone can view active plans') THEN
    CREATE POLICY "Everyone can view active plans" ON plans FOR SELECT USING (is_active = true);
  END IF;

  -- commission_configs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='commission_configs' AND policyname='commission_configs_access') THEN
    CREATE POLICY "commission_configs_access" ON commission_configs FOR ALL USING (true);
  END IF;

  -- verification_codes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='verification_codes' AND policyname='verification_codes_policy') THEN
    CREATE POLICY "verification_codes_policy" ON verification_codes FOR ALL USING (true);
  END IF;

END $$;


-- ============================================
-- TRIGGERS DE updated_at
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_user_social_accounts_updated_at') THEN
    CREATE TRIGGER update_user_social_accounts_updated_at BEFORE UPDATE ON user_social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_scheduled_posts_updated_at') THEN
    CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_marketing_access_requests_updated_at') THEN
    CREATE TRIGGER update_marketing_access_requests_updated_at BEFORE UPDATE ON marketing_access_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_whatsapp_connections_updated_at') THEN
    CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON whatsapp_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_agent_configs_updated_at') THEN
    CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_chat_templates_updated_at') THEN
    CREATE TRIGGER update_chat_templates_updated_at BEFORE UPDATE ON chat_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_user_websites_updated_at') THEN
    CREATE TRIGGER update_user_websites_updated_at BEFORE UPDATE ON user_websites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_website_services_updated_at') THEN
    CREATE TRIGGER update_website_services_updated_at BEFORE UPDATE ON website_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_ligacoes_access_requests_updated_at') THEN
    CREATE TRIGGER update_ligacoes_access_requests_updated_at BEFORE UPDATE ON ligacoes_access_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_exchanges_updated_at') THEN
    CREATE TRIGGER update_exchanges_updated_at BEFORE UPDATE ON exchanges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_negociacoes_access_requests_updated_at') THEN
    CREATE TRIGGER update_negociacoes_access_requests_updated_at BEFORE UPDATE ON negociacoes_access_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_franchises_updated_at') THEN
    CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON franchises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_packages_updated_at') THEN
    CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_customer_packages_updated_at') THEN
    CREATE TRIGGER update_customer_packages_updated_at BEFORE UPDATE ON customer_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_professionals_updated_at') THEN
    CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_appointments_updated_at') THEN
    CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_professional_working_hours_updated_at') THEN
    CREATE TRIGGER update_professional_working_hours_updated_at BEFORE UPDATE ON professional_working_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_services_updated_at') THEN
    CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_customers_updated_at') THEN
    CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_user_credentials_updated_at') THEN
    CREATE TRIGGER update_user_credentials_updated_at BEFORE UPDATE ON user_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_payments_updated_at') THEN
    CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_plans_updated_at') THEN
    CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  -- whatsapp business api
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='wb_credentials_updated_at') THEN
    CREATE TRIGGER wb_credentials_updated_at BEFORE UPDATE ON whatsapp_business_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='wb_conversations_updated_at') THEN
    CREATE TRIGGER wb_conversations_updated_at BEFORE UPDATE ON whatsapp_business_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  -- landing pages
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='handle_updated_at_landing_pages') THEN
    CREATE TRIGGER handle_updated_at_landing_pages BEFORE UPDATE ON user_landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='handle_updated_at_landing_services') THEN
    CREATE TRIGGER handle_updated_at_landing_services BEFORE UPDATE ON landing_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_verification_codes_updated_at') THEN
    CREATE TRIGGER update_verification_codes_updated_at BEFORE UPDATE ON verification_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ============================================
-- FUNÇÕES RPC — ATIVAÇÃO DE PLANOS
-- ============================================

CREATE OR REPLACE FUNCTION public.activate_whatsapp_plan(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET
    whatsapp_active = true,
    whatsapp_activation_date = NOW(),
    trial_whatsapp_active = false,
    whatsapp_trial_completed = true,
    whatsapp_access_blocked = false,
    whatsapp_block_reason = NULL
  WHERE id = p_user_id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.activate_ligacoes_plan(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET
    ligacoes_active = true,
    ligacoes_activation_date = NOW(),
    trial_ligacoes_active = false,
    ligacoes_trial_completed = true,
    ligacoes_access_blocked = false,
    ligacoes_block_reason = NULL
  WHERE id = p_user_id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.activate_marketing_plan(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET
    marketing_active = true,
    marketing_activation_date = NOW(),
    trial_marketing_active = false,
    marketing_trial_completed = true,
    marketing_access_blocked = false,
    marketing_block_reason = NULL
  WHERE id = p_user_id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.activate_negociacoes_plan(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET
    negociacoes_active = true,
    negociacoes_activation_date = NOW(),
    trial_negociacoes_active = false,
    negociacoes_trial_completed = true,
    negociacoes_access_blocked = false,
    negociacoes_block_reason = NULL
  WHERE id = p_user_id;
  RETURN true;
END; $$;


-- ============================================
-- DADOS DE PLANOS
-- ============================================

INSERT INTO plans (id, name, description, price, monthly_price, annual_price, trial_days, features, is_active)
VALUES
  ('plan-agendamentos', 'Plano de Agendamentos WhatsApp', 'Gestão de agendamentos via WhatsApp', 299.00, 299.00, 2990.00, 7,
   '["Agendamentos ilimitados","Integração WhatsApp","Notificações automáticas","Gerenciamento de clientes"]', true),
  ('plan-ligacoes', 'Plano de Ligações', 'Gestão de ligações e atendimento', 199.00, 199.00, 1990.00, 7,
   '["Ligações ilimitadas","Gravação de chamadas","Relatórios de atendimento","Integração com CRM"]', true),
  ('plan-marketing', 'Plano de Marketing Digital', 'Gestão de campanhas de marketing digital', 399.00, 399.00, 3990.00, 7,
   '["Gestão de redes sociais","Campanhas pagas","Análise de desempenho","Relatórios personalizados"]', true),
  ('plan-negociacoes', 'Plano de Negociações', 'Gestão de negociações e transações', 499.00, 499.00, 4990.00, 7,
   '["Gestão de transações","Análise de mercado","Relatórios financeiros","Integração com exchanges"]', true),
  ('website', 'Desenvolvimento de Sites', 'Plano completo para gerenciamento de projetos web', 149.00, 149.00, 1490.00, 0,
   '["Desenvolvimento personalizado","Hospedagem inclusiva","Suporte técnico","Domínio personalizado"]', true),
  ('desenvolvimento', 'Agente de Desenvolvimento', 'IA para geração de código, desenvolvimento de sites e aplicações', 0.00, 0.00, 0.00, 0,
   '["Geração de código com IA","Desenvolvimento de sites e aplicações","Integração com GitHub","Suporte a múltiplas linguagens"]', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  trial_days = EXCLUDED.trial_days,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 'KITO EXPERT — SQL completo executado com sucesso!' AS status;

