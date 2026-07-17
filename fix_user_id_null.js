import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hedxxbsieoazrmbayzab.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk');

async function fixUserIdNull() {
  try {
    console.log('🔧 Permitindo user_id ser NULL...');

    // Como não conseguimos executar SQL diretamente, vamos tentar uma abordagem diferente
    // Vamos tentar inserir um registro com user_id null diretamente
    const { error } = await supabase
      .from('user_credentials')
      .insert({
        user_id: null, // tentar null
        waha_url: 'http://whats.kitoai.online:3001',
        waha_api_key: '1261a25254e14a0493a9fb448f343cfd',
        n8n_url: 'https://isa.isadate.online',
        n8n_api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMjM0N2M2Yy1kYTVjLTRiYmMtOWU1YS04OGM5YTY3ZTMzOGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNjcyNTQ1fQ.GAR0DezECXceB0-3HssXh9_20JQcn64WmxmKxl_UBR4',
        gemini_api_key: 'AIzaSyDkeifIM3tdVEhLJCUXFgD-neibnWSH88Q'
      });

    if (error) {
      console.log('❌ Erro (esperado se user_id não pode ser null):', error.message);

      if (error.message.includes('violates not-null constraint')) {
        console.log('📋 A coluna user_id não permite NULL. Você precisa executar este SQL no painel do Supabase:');
        console.log('');
        console.log('ALTER TABLE user_credentials ALTER COLUMN user_id DROP NOT NULL;');
        console.log('');
        console.log('Ou simplesmente não inserir user_id no insert.');
      }
    } else {
      console.log('✅ user_id permite NULL');
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

fixUserIdNull();