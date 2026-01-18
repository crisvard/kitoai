import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hedxxbsieoazrmbayzab.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk');

async function checkTable() {
  try {
    console.log('🔍 Verificando se a tabela user_credentials existe...');

    // Tentar fazer uma query simples
    const { data, error } = await supabase
      .from('user_credentials')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Tabela não existe ou erro:', error.message);
      return false;
    }

    console.log('✅ Tabela user_credentials existe');
    return true;

  } catch (error) {
    console.error('💥 Erro ao verificar tabela:', error);
    return false;
  }
}

async function checkUserCredentials() {
  try {
    console.log('🔍 Verificando credenciais do usuário 6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2...');

    // Verificar user_credentials
    console.log('📋 Verificando user_credentials...');
    const { data: userCreds, error: userCredsError } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2');

    if (userCredsError) {
      console.log('❌ Erro em user_credentials:', userCredsError);
    } else if (userCreds && userCreds.length > 0) {
      console.log('✅ Credenciais encontradas em user_credentials:');
      console.log('   WAHA URL:', userCreds[0].waha_url);
      console.log('   WAHA API Key:', userCreds[0].waha_api_key ? 'Presente' : 'Ausente');
      console.log('   N8N URL:', userCreds[0].n8n_url);
      console.log('   N8N API Key:', userCreds[0].n8n_api_key ? 'Presente' : 'Ausente');
      console.log('   Gemini API Key:', userCreds[0].gemini_api_key ? 'Presente' : 'Ausente');
    } else {
      console.log('⚠️ Nenhuma credencial em user_credentials');
    }

    // Verificar agent_configs
    console.log('📋 Verificando agent_configs...');
    const { data: agentCreds, error: agentCredsError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('user_id', '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2');

    if (agentCredsError) {
      console.log('❌ Erro em agent_configs:', agentCredsError);
    } else if (agentCreds && agentCreds.length > 0) {
      console.log('✅ Credenciais encontradas em agent_configs:');
      console.log('   WAHA URL:', agentCreds[0].waha_url);
      console.log('   WAHA API Key:', agentCreds[0].waha_api_key ? 'Presente' : 'Ausente');
      console.log('   Agent Type:', agentCreds[0].agent_type);
    } else {
      console.log('⚠️ Nenhuma credencial em agent_configs');
    }

    if ((!userCreds || userCreds.length === 0) && (!agentCreds || agentCreds.length === 0)) {
      console.log('❌ Nenhuma credencial encontrada em nenhuma tabela');
      console.log('📝 Você precisa inserir as credenciais WAHA no banco de dados');
    }

  } catch (error) {
    console.error('💥 Erro ao verificar credenciais:', error);
  }
}

async function createTableManually() {
  try {
    console.log('🔧 Criando tabela user_credentials manualmente...');

    // Tentar criar a tabela usando uma inserção que vai falhar se a tabela não existir
    // Isso vai nos dar uma ideia se a tabela existe
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // ID inválido para teste
      waha_url: 'test',
      waha_api_key: 'test'
    };

    const { error } = await supabase
      .from('user_credentials')
      .insert(testData);

    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('❌ Tabela user_credentials não existe');
      console.log('📋 Você precisa criar a tabela manualmente no painel do Supabase:');
      console.log('');
      console.log('SQL para criar a tabela:');
      console.log(`
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  waha_url TEXT,
  waha_api_key TEXT,
  n8n_url TEXT,
  n8n_api_key TEXT,
  gemini_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials" ON user_credentials
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" ON user_credentials
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" ON user_credentials
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_credentials_service_role_policy" ON user_credentials
FOR ALL TO service_role USING (true) WITH CHECK (true);
      `);
    } else if (error) {
      console.log('✅ Tabela existe, mas erro na inserção (esperado):', error.message);
    } else {
      console.log('✅ Tabela existe e inserção funcionou (inesperado)');
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

async function main() {
  const exists = await checkTable();
  if (!exists) {
    await createTableManually();
  } else {
    await checkUserCredentials();
  }
}

main();