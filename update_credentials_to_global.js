import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hedxxbsieoazrmbayzab.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk');

async function updateToGlobalCredentials() {
  try {
    console.log('🔧 Convertendo credenciais para globais...');

    // Primeiro, vamos verificar se existe algum registro
    const { data: existingCreds, error: checkError } = await supabase
      .from('user_credentials')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar credenciais existentes:', checkError);
      return;
    }

    console.log('📊 Credenciais existentes:', existingCreds);

    if (existingCreds && existingCreds.length > 0) {
      // Se existe, vamos deletar e recriar sem user_id
      console.log('🗑️ Removendo credenciais antigas...');
      const { error: deleteError } = await supabase
        .from('user_credentials')
        .delete()
        .eq('user_id', existingCreds[0].user_id);

      if (deleteError) {
        console.error('❌ Erro ao deletar credenciais antigas:', deleteError);
        return;
      }

      console.log('✅ Credenciais antigas removidas');

      // Inserir credenciais globais (sem user_id - deixar como undefined)
      const insertData = {
        waha_url: existingCreds[0].waha_url,
        waha_api_key: existingCreds[0].waha_api_key,
        n8n_url: existingCreds[0].n8n_url,
        n8n_api_key: existingCreds[0].n8n_api_key,
        gemini_api_key: existingCreds[0].gemini_api_key,
        supabase_url: existingCreds[0].supabase_url,
        supabase_anon_key: existingCreds[0].supabase_anon_key,
        supabase_service_role_key: existingCreds[0].supabase_service_role_key
        // user_id não incluído = será null/undefined
      };

      console.log('📝 Inserindo dados:', insertData);

      const { error: insertError } = await supabase
        .from('user_credentials')
        .insert(insertData);

      if (insertError) {
        console.error('❌ Erro ao inserir credenciais globais:', insertError);
      } else {
        console.log('✅ Credenciais globais inseridas');
      }
    }

    // Agora vamos testar se conseguimos buscar as credenciais globais
    console.log('🔍 Testando busca de credenciais globais...');
    const { data: globalCreds, error: fetchError } = await supabase
      .from('user_credentials')
      .select('waha_url, waha_api_key, n8n_url, n8n_api_key, gemini_api_key')
      .limit(1);

    if (fetchError) {
      console.error('❌ Erro ao buscar credenciais globais:', fetchError);
    } else {
      console.log('✅ Credenciais globais encontradas:', globalCreds);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

updateToGlobalCredentials();