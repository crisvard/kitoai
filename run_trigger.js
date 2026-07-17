import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://hedxxbsieoazrmbayzab.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk'
);

async function runTrigger() {
  try {
    const sql = readFileSync('create_commission_trigger.sql', 'utf8');
    console.log('Executando SQL do trigger...');

    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Erro ao executar SQL:', error);
    } else {
      console.log('✅ Trigger criado com sucesso!');
    }
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

runTrigger();