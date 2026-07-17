-- ============================================
-- SISTEMA MULTI-AGENTE DE LIGAÇÕES
-- Sistema de telemarketing com múltiplos agentes por usuário
-- ============================================

-- ============================================
-- TABELA DE AGENTES DO USUÁRIO
-- ============================================
CREATE TABLE IF NOT EXISTS user_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação
  agent_name VARCHAR(100) NOT NULL,
  agent_avatar VARCHAR(255), -- URL do avatar
  agent_color VARCHAR(7) DEFAULT '#c4d82e', -- Cor tema do agente
  
  -- Integração com provedor (VAPI/Retell/Bland)
  provider VARCHAR(50) NOT NULL DEFAULT 'vapi', -- vapi, retell, bland
  agent_provider_id TEXT, -- ID do assistant no VAPI
  
  -- Configurações de voz e IA
  voice_id VARCHAR(100) DEFAULT '21m00Tcm4TlvDq8ikWAM', -- ElevenLabs voice ID
  voice_provider VARCHAR(50) DEFAULT 'elevenlabs',
  llm_model VARCHAR(100) DEFAULT 'claude-3-5-sonnet-20241022',
  system_prompt TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  
  -- Número de telefone
  phone_number VARCHAR(20),
  phone_number_provider_id TEXT,
  
  -- Limites e controle
  daily_minutes_limit INTEGER DEFAULT 150,
  minutes_used_today DECIMAL(10,2) DEFAULT 0.00,
  calls_made_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Status operacional
  status VARCHAR(20) DEFAULT 'idle', -- idle, calling, paused, disabled, error
  current_call_id TEXT,
  current_contact_id UUID,
  last_call_at TIMESTAMPTZ,
  
  -- Posição na mesa visual
  table_position INTEGER NOT NULL, -- 0-11 (12 posições)
  
  -- Configurações avançadas
  max_concurrent_calls INTEGER DEFAULT 1,
  call_interval_seconds INTEGER DEFAULT 5,
  retry_failed_calls BOOLEAN DEFAULT true,
  max_retry_attempts INTEGER DEFAULT 3,
  
  -- Analytics
  total_calls_made INTEGER DEFAULT 0,
  total_minutes_used DECIMAL(10,2) DEFAULT 0.00,
  total_credits_spent DECIMAL(10,2) DEFAULT 0.00,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Webhooks
  webhook_url TEXT,
  
  -- Flags
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_agent_position UNIQUE(user_id, table_position),
  CONSTRAINT check_table_position CHECK (table_position >= 0 AND table_position <= 11)
);

-- ============================================
-- CAMPANHAS VINCULADAS A AGENTES (opcional — só executa se a tabela existir)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'campaigns'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'agent_id'
    ) THEN
      ALTER TABLE campaigns ADD COLUMN agent_id UUID REFERENCES user_agents(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_campaigns_agent_id ON campaigns(agent_id);
    END IF;
  END IF;
END
$$;

-- ============================================
-- CONTATOS VINCULADOS A AGENTES
-- ============================================
-- Assumindo que você tem uma tabela de contatos
-- Se não existir, criar estrutura básica
CREATE TABLE IF NOT EXISTS agent_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES user_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados do contato
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  sector VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, calling, completed, failed, skipped
  attempt_count INTEGER DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  last_call_duration INTEGER, -- segundos
  last_call_status VARCHAR(50),
  
  -- Notas
  notes TEXT,
  
  -- Controle de tentativas de chamada
  last_attempt_at TIMESTAMPTZ, -- quando foi a última tentativa de ligar
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOG DE USO DE CRÉDITOS POR AGENTE (opcional — só executa se a tabela existir)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'credit_usage_log'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'credit_usage_log' AND column_name = 'agent_id'
    ) THEN
      ALTER TABLE credit_usage_log ADD COLUMN agent_id UUID REFERENCES user_agents(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_credit_usage_agent_id ON credit_usage_log(agent_id);
    END IF;
  END IF;
END
$$;

-- ============================================
-- HISTÓRICO DE CHAMADAS POR AGENTE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES user_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES agent_contacts(id) ON DELETE SET NULL,
  
  -- Dados da chamada
  vapi_call_id TEXT NOT NULL, -- ID da chamada no VAPI/Retell
  phone_number VARCHAR(20) NOT NULL,
  direction VARCHAR(20) DEFAULT 'outbound', -- outbound, inbound
  
  -- Status e duração
  status VARCHAR(50) NOT NULL, -- completed, failed, no-answer, busy, voicemail
  duration_seconds INTEGER DEFAULT 0,
  
  -- Custos
  credits_used DECIMAL(10,2) DEFAULT 0,
  cost_per_minute DECIMAL(10,4) DEFAULT 0.50,
  total_cost DECIMAL(10,2),
  
  -- Transcrição e análise
  transcript TEXT,
  summary TEXT,
  sentiment VARCHAR(50), -- positive, neutral, negative
  
  -- Datas
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  end_reason VARCHAR(100), -- hangup, voicemail, no-answer, error, stopped_by_user

  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ESTATÍSTICAS DIÁRIAS POR AGENTE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES user_agents(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Métricas
  calls_made INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  calls_failed INTEGER DEFAULT 0,
  minutes_used DECIMAL(10,2) DEFAULT 0.00,
  credits_spent DECIMAL(10,2) DEFAULT 0.00,
  
  -- Performance
  avg_call_duration INTEGER DEFAULT 0, -- segundos
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_agent_daily_stats UNIQUE(agent_id, date)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON user_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_status ON user_agents(status);
CREATE INDEX IF NOT EXISTS idx_user_agents_active ON user_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_user_agents_provider_id ON user_agents(agent_provider_id);

CREATE INDEX IF NOT EXISTS idx_agent_contacts_agent_id ON agent_contacts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_contacts_status ON agent_contacts(status);
CREATE INDEX IF NOT EXISTS idx_agent_contacts_phone ON agent_contacts(phone);

CREATE INDEX IF NOT EXISTS idx_agent_call_history_agent_id ON agent_call_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_call_history_started_at ON agent_call_history(started_at);
CREATE INDEX IF NOT EXISTS idx_agent_call_history_status ON agent_call_history(status);

CREATE INDEX IF NOT EXISTS idx_agent_daily_stats_agent_id ON agent_daily_stats(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_daily_stats_date ON agent_daily_stats(date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_daily_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para user_agents
DROP POLICY IF EXISTS "Users can view own agents" ON user_agents;
CREATE POLICY "Users can view own agents" ON user_agents 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own agents" ON user_agents;
CREATE POLICY "Users can create own agents" ON user_agents 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agents" ON user_agents;
CREATE POLICY "Users can update own agents" ON user_agents 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own agents" ON user_agents;
CREATE POLICY "Users can delete own agents" ON user_agents 
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para agent_contacts
DROP POLICY IF EXISTS "Users can view own agent contacts" ON agent_contacts;
CREATE POLICY "Users can view own agent contacts" ON agent_contacts 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own agent contacts" ON agent_contacts;
CREATE POLICY "Users can manage own agent contacts" ON agent_contacts 
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para agent_call_history
DROP POLICY IF EXISTS "Users can view own call history" ON agent_call_history;
CREATE POLICY "Users can view own call history" ON agent_call_history 
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para agent_daily_stats
DROP POLICY IF EXISTS "Users can view own stats" ON agent_daily_stats;
CREATE POLICY "Users can view own stats" ON agent_daily_stats 
  FOR SELECT USING (
    agent_id IN (SELECT id FROM user_agents WHERE user_id = auth.uid())
  );

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_user_agents_updated_at ON user_agents;
CREATE TRIGGER update_user_agents_updated_at
  BEFORE UPDATE ON user_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_contacts_updated_at ON agent_contacts;
CREATE TRIGGER update_agent_contacts_updated_at
  BEFORE UPDATE ON agent_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para resetar contadores diários
CREATE OR REPLACE FUNCTION reset_agent_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE user_agents
  SET 
    minutes_used_today = 0,
    calls_made_today = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas do agente
CREATE OR REPLACE FUNCTION update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar totais do agente
  UPDATE user_agents
  SET
    total_calls_made = total_calls_made + 1,
    total_minutes_used = total_minutes_used + (NEW.duration_seconds / 60.0),
    total_credits_spent = total_credits_spent + NEW.credits_used,
    last_call_at = NEW.ended_at
  WHERE id = NEW.agent_id;
  
  -- Atualizar ou criar estatísticas diárias
  INSERT INTO agent_daily_stats (
    agent_id,
    date,
    calls_made,
    calls_completed,
    calls_failed,
    minutes_used,
    credits_spent
  ) VALUES (
    NEW.agent_id,
    CURRENT_DATE,
    1,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    NEW.duration_seconds / 60.0,
    NEW.credits_used
  )
  ON CONFLICT (agent_id, date) DO UPDATE
  SET
    calls_made = agent_daily_stats.calls_made + 1,
    calls_completed = agent_daily_stats.calls_completed + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    calls_failed = agent_daily_stats.calls_failed + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    minutes_used = agent_daily_stats.minutes_used + (NEW.duration_seconds / 60.0),
    credits_spent = agent_daily_stats.credits_spent + NEW.credits_used,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agent_stats ON agent_call_history;
CREATE TRIGGER trigger_update_agent_stats
  AFTER INSERT ON agent_call_history
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE user_agents IS 'Agentes de IA de ligações - múltiplos por usuário';
COMMENT ON TABLE agent_contacts IS 'Contatos vinculados a cada agente';
COMMENT ON TABLE agent_call_history IS 'Histórico completo de chamadas por agente';
COMMENT ON TABLE agent_daily_stats IS 'Estatísticas diárias agregadas por agente';

COMMENT ON COLUMN user_agents.table_position IS 'Posição visual na mesa (0-11 para 12 agentes)';
COMMENT ON COLUMN user_agents.daily_minutes_limit IS 'Limite de minutos por dia por agente (padrão 150)';
COMMENT ON COLUMN user_agents.status IS 'Status atual: idle, calling, paused, disabled, error';

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Função para criar agente padrão ao criar usuário
CREATE OR REPLACE FUNCTION create_default_agent_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar primeiro agente padrão
  INSERT INTO user_agents (
    user_id,
    agent_name,
    system_prompt,
    table_position
  ) VALUES (
    NEW.id,
    'Agente 1',
    'Você é Isabela, uma agente de vendas simpática e experiente da Agente Zap...',
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar agente padrão (OPCIONAL - comentado)
-- DROP TRIGGER IF EXISTS trigger_create_default_agent ON auth.users;
-- CREATE TRIGGER trigger_create_default_agent
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION create_default_agent_for_user();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- ============================================
-- COLUNA credits NA TABELA profiles
-- Necessária para o sistema de débito de créditos por ligação
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.profiles.credits IS 'Saldo de créditos do usuário para ligações (R$0,50 debitado por minuto)';

SELECT 'Multi-Agent System tables created successfully!' AS status;
