import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://hedxxbsieoazrmbayzab.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk'
);

async function runTrigger() {
  try {
    const sql = readFileSync('supabase/migrations/20251207201500_create_commission_trigger.sql', 'utf8');
    console.log('Executando SQL do trigger...');

    // Executar o SQL diretamente
    const { data, error } = await supabase.rpc('exec', { query: sql });

    if (error) {
      console.error('Erro ao executar SQL:', error);
      // Tentar executar linha por linha
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executando:', statement.trim().substring(0, 50) + '...');
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });
          if (stmtError) {
            console.error('Erro na declaração:', stmtError);
          }
        }
      }
    } else {
      console.log('✅ Trigger criado com sucesso!');
    }
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

runTrigger();