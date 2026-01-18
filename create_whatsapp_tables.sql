-- ============================================
-- CREATE WHATSAPP TABLES
-- ============================================

-- Create whatsapp_connections table
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status WAHA
  waha_status TEXT DEFAULT 'disconnected',
  waha_session_name TEXT,

  -- Status N8N
  n8n_workflow_id TEXT,
  n8n_webhook_url TEXT,
  n8n_status TEXT DEFAULT 'not_created',

  -- Status Gemini
  gemini_status TEXT DEFAULT 'configured',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Create agent_configs table
CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL DEFAULT 'commercial',

  -- Configuration fields
  personality JSONB,
  presentation JSONB,
  company_knowledge JSONB,
  product_knowledge JSONB,

  -- Technical config
  technical_config JSONB,

  -- Status
  personality_validated BOOLEAN DEFAULT FALSE,

  -- WAHA/N8N config
  waha_url TEXT,
  waha_api_key TEXT,
  n8n_webhook_url TEXT,
  chatid TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, agent_type)
);

-- Enable RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_connections
CREATE POLICY "Users can view own whatsapp connection" ON whatsapp_connections
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whatsapp connection" ON whatsapp_connections
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whatsapp connection" ON whatsapp_connections
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create policies for agent_configs
CREATE POLICY "Users can view own agent configs" ON agent_configs
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent configs" ON agent_configs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent configs" ON agent_configs
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create chat_templates table (if not exists)
CREATE TABLE IF NOT EXISTS chat_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for chat_templates
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_templates
CREATE POLICY "Users can view own chat templates" ON chat_templates
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat templates" ON chat_templates
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat templates" ON chat_templates
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat templates" ON chat_templates
FOR DELETE TO authenticated USING (auth.uid() = user_id);