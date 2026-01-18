import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hedxxbsieoazrmbayzab.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk');

async function createGlobalCredentials() {
  try {
    console.log('🔧 Criando credenciais GLOBAIS para todos os administradores...');

    // Verificar se já existe registro global
    const { data: existing, error: checkError } = await supabase
      .from('user_credentials')
      .select('*')
      .is('user_id', null)
      .single();

    if (existing) {
      console.log('✅ Credenciais globais já existem');
      return;
    }

    // Inserir credenciais globais
    const { error: insertError } = await supabase
      .from('user_credentials')
      .insert({
        user_id: null, // GLOBAL - todos os administradores usam isso
        waha_url: 'http://whats.kitoai.online:3001',
        waha_api_key: '1261a25254e14a0493a9fb448f343cfd',
        n8n_url: 'https://isa.isadate.online',
        n8n_api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMjM0N2M2Yy1kYTVjLTRiYmMtOWU1YS04OGM5YTY3ZTMzOGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNjcyNTQ1fQ.GAR0DezECXceB0-3HssXh9_20JQcn64WmxmKxl_UBR4',
        gemini_api_key: 'AIzaSyDkeifIM3tdVEhLJCUXFgD-neibnWSH88Q'
      });

    if (insertError) {
      console.error('❌ Erro ao criar credenciais globais:', insertError);
    } else {
      console.log('✅ Credenciais globais criadas com sucesso!');
      console.log('🔑 TODOS os administradores agora usam as mesmas credenciais');
      console.log('📊 Query: SELECT * FROM user_credentials WHERE user_id IS NULL');
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

createGlobalCredentials();