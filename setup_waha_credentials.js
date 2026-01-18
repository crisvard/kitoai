import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hedxxbsieoazrmbayzab.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupWAHACredentials() {
  try {
    console.log('🔧 Configurando credenciais WAHA...');

    // User ID do usuário logado (do log anterior)
    const userId = '6cc2aaa7-4d96-4ae8-b9f2-d7df84e72ae2';

    // Credenciais WAHA de exemplo (substitua pelos valores reais)
    const wahaCredentials = {
      user_id: userId,
      waha_url: 'https://waha.example.com', // Substitua pela URL real do WAHA
      waha_api_key: 'your-waha-api-key-here', // Substitua pela chave real
      n8n_url: 'https://n8n.example.com', // Substitua pela URL real do N8N
      n8n_api_key: 'your-n8n-api-key-here', // Substitua pela chave real
      gemini_api_key: 'your-gemini-api-key-here' // Substitua pela chave real
    };

    console.log('📝 Inserindo credenciais para usuário:', userId);

    const { data, error } = await supabase
      .from('user_credentials')
      .upsert(wahaCredentials, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('❌ Erro ao inserir credenciais:', error);
      return;
    }

    console.log('✅ Credenciais WAHA configuradas com sucesso!');
    console.log('🔑 Dados inseridos:', data);

    console.log('\n⚠️ IMPORTANTE: Substitua os valores de exemplo pelas credenciais reais:');
    console.log('- waha_url: URL do seu servidor WAHA');
    console.log('- waha_api_key: Chave API do WAHA');
    console.log('- n8n_url: URL do seu servidor N8N');
    console.log('- n8n_api_key: Chave API do N8N');
    console.log('- gemini_api_key: Chave API do Google Gemini');

  } catch (error) {
    console.error('💥 Erro geral:', error);
    process.exit(1);
  }
}

setupWAHACredentials();