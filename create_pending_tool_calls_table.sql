-- Tabela para rastrear tool calls pendentes (n8n async pattern)
CREATE TABLE IF NOT EXISTS pending_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT NOT NULL,
  tool_call_id TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES user_agents(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL, -- 'check_availability' ou 'book_appointment'
  input_data JSONB NOT NULL,
  result JSONB,
  status TEXT DEFAULT 'pending', -- pending | completed | failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  
  UNIQUE(call_id, tool_call_id)
);

-- Enable RLS
ALTER TABLE pending_tool_calls ENABLE ROW LEVEL SECURITY;

-- Service role policy
CREATE POLICY "service_role_full_access" ON pending_tool_calls 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index para cleanup de records expirados
CREATE INDEX idx_pending_tool_calls_expires ON pending_tool_calls(expires_at);
CREATE INDEX idx_pending_tool_calls_status ON pending_tool_calls(status);

-- Optional: Cleanup trigger (remove records expirados após 2 horas)
CREATE OR REPLACE FUNCTION cleanup_expired_tool_calls()
RETURNS void AS $$
BEGIN
  DELETE FROM pending_tool_calls 
  WHERE expires_at < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;
