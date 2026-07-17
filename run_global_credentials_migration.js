import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient('https://hedxxbsieoazrmbayzab.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM2MDE2NCwiZXhwIjoyMDYyOTM2MTY0fQ.ZnFUYyclbJhlk_UCqszIpfDSLpbxc9HqG39D7MecOqk');

async function runMigration() {
  try {
    console.log('🔧 Executando migração para credenciais globais...');

    const sql = fs.readFileSync('./migrate_to_global_credentials.sql', 'utf8');
    const commands = sql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd && !cmd.startsWith('--'));

    console.log(`📄 Encontrados ${commands.length} comandos SQL para executar`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) continue;

      console.log(`🔧 Executando comando ${i + 1}/${commands.length}...`);
      console.log(`   ${command.substring(0, 80)}${command.length > 80 ? '...' : ''}`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });

        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
          // Continue tentando próximos comandos
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (cmdErr) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, cmdErr.message);
      }
    }

    console.log('🎉 Migração concluída!');

  } catch (error) {
    console.error('💥 Erro geral na migração:', error);
    process.exit(1);
  }
}

runMigration();