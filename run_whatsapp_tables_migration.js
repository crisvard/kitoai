import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hedxxbsieoazrmbayzab.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  console.log('💡 Adicione SUPABASE_SERVICE_ROLE_KEY ao seu arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runWhatsAppTablesMigration() {
  try {
    console.log('🔧 Executando migração das tabelas WhatsApp...');

    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./create_whatsapp_tables.sql', 'utf8');

    // Dividir em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    console.log(`📄 Encontrados ${sqlCommands.length} comandos SQL para executar`);

    // Executar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (!command) continue;

      console.log(`🔧 Executando comando ${i + 1}/${sqlCommands.length}...`);
      console.log(`   ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: command
        });

        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
          // Continue com os próximos comandos mesmo se um falhar
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (cmdErr) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, cmdErr);
      }
    }

    console.log('🔍 Verificando se as tabelas foram criadas...');

    // Verificar whatsapp_connections
    const { data: whatsappData, error: whatsappError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'whatsapp_connections')
      .eq('table_schema', 'public');

    if (whatsappError) {
      console.error('❌ Erro ao verificar whatsapp_connections:', whatsappError);
    } else if (whatsappData && whatsappData.length > 0) {
      console.log('✅ Tabela whatsapp_connections criada com sucesso');
    } else {
      console.log('⚠️ Tabela whatsapp_connections não encontrada');
    }

    // Verificar agent_configs
    const { data: agentData, error: agentError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'agent_configs')
      .eq('table_schema', 'public');

    if (agentError) {
      console.error('❌ Erro ao verificar agent_configs:', agentError);
    } else if (agentData && agentData.length > 0) {
      console.log('✅ Tabela agent_configs criada com sucesso');
    } else {
      console.log('⚠️ Tabela agent_configs não encontrada');
    }

    // Verificar chat_templates
    const { data: chatData, error: chatError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'chat_templates')
      .eq('table_schema', 'public');

    if (chatError) {
      console.error('❌ Erro ao verificar chat_templates:', chatError);
    } else if (chatData && chatData.length > 0) {
      console.log('✅ Tabela chat_templates criada com sucesso');
    } else {
      console.log('⚠️ Tabela chat_templates não encontrada');
    }

    console.log('🎉 Migração concluída!');

  } catch (error) {
    console.error('💥 Erro geral na migração:', error);
    process.exit(1);
  }
}

runWhatsAppTablesMigration();