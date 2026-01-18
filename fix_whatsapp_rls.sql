-- ============================================
-- FIX RLS POLICIES FOR WHATSAPP TABLES
-- ============================================

-- Enable RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (force drop)
DROP POLICY IF EXISTS "Users can view own whatsapp connection" ON whatsapp_connections;
DROP POLICY IF EXISTS "Users can insert own whatsapp connection" ON whatsapp_connections;
DROP POLICY IF EXISTS "Users can update own whatsapp connection" ON whatsapp_connections;
DROP POLICY IF EXISTS "whatsapp_connections_select" ON whatsapp_connections;
DROP POLICY IF EXISTS "whatsapp_connections_insert" ON whatsapp_connections;
DROP POLICY IF EXISTS "whatsapp_connections_update" ON whatsapp_connections;
DROP POLICY IF EXISTS "whatsapp_connections_delete" ON whatsapp_connections;
DROP POLICY IF EXISTS "whatsapp_connections_service_role" ON whatsapp_connections;

DROP POLICY IF EXISTS "Users can view own agent configs" ON agent_configs;
DROP POLICY IF EXISTS "Users can insert own agent configs" ON agent_configs;
DROP POLICY IF EXISTS "Users can update own agent configs" ON agent_configs;
DROP POLICY IF EXISTS "agent_configs_select" ON agent_configs;
DROP POLICY IF EXISTS "agent_configs_insert" ON agent_configs;
DROP POLICY IF EXISTS "agent_configs_update" ON agent_configs;
DROP POLICY IF EXISTS "agent_configs_delete" ON agent_configs;
DROP POLICY IF EXISTS "agent_configs_service_role" ON agent_configs;

-- Create new policies for whatsapp_connections
CREATE POLICY "whatsapp_connections_select_policy" ON whatsapp_connections
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "whatsapp_connections_insert_policy" ON whatsapp_connections
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "whatsapp_connections_update_policy" ON whatsapp_connections
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "whatsapp_connections_delete_policy" ON whatsapp_connections
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create new policies for agent_configs
CREATE POLICY "agent_configs_select_policy" ON agent_configs
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "agent_configs_insert_policy" ON agent_configs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_configs_update_policy" ON agent_configs
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_configs_delete_policy" ON agent_configs
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Allow service role full access (for edge functions)
CREATE POLICY "whatsapp_connections_service_role_policy" ON whatsapp_connections
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "agent_configs_service_role_policy" ON agent_configs
FOR ALL TO service_role USING (true) WITH CHECK (true);