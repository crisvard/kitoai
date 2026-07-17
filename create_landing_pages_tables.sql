-- ============================================
-- CRIAÇÃO DAS TABELAS PARA LANDING PAGES
-- Duplicação exata das tabelas de websites
-- ============================================

-- Tabela user_landing_pages (duplicação de user_websites)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Tabela landing_services (duplicação de website_services)
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

-- Habilitar RLS
ALTER TABLE user_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_services ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_landing_pages
CREATE POLICY "Users can view own landing pages" ON user_landing_pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own landing pages" ON user_landing_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landing pages" ON user_landing_pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own landing pages" ON user_landing_pages
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para landing_services
CREATE POLICY "Users can view own landing services" ON landing_services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own landing services" ON landing_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landing services" ON landing_services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own landing services" ON landing_services
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION handle_updated_at_landing()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_landing_pages
  BEFORE UPDATE ON user_landing_pages
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at_landing();

CREATE TRIGGER handle_updated_at_landing_services
  BEFORE UPDATE ON landing_services
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at_landing();