import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('🔄 Criando tabelas de contas sociais...');

    // Criar tabela user_social_accounts
    console.log('📋 Criando tabela user_social_accounts...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_social_accounts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          platform VARCHAR(50) NOT NULL,
          account_id VARCHAR(255) NOT NULL,
          account_name VARCHAR(255),
          account_username VARCHAR(255),
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          token_expires_at TIMESTAMP WITH TIME ZONE,
          scopes TEXT[],
          is_active BOOLEAN DEFAULT true,
          last_used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, platform, account_id),
          CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'))
        );
      `
    });

    if (error1) {
      console.error('❌ Erro ao criar user_social_accounts:', error1);
    } else {
      console.log('✅ Tabela user_social_accounts criada!');
    }

    // Criar tabela scheduled_posts
    console.log('📋 Criando tabela scheduled_posts...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS scheduled_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          upload_post_id VARCHAR(255),
          title VARCHAR(255),
          content TEXT NOT NULL,
          hashtags TEXT[],
          media_urls TEXT[],
          platforms JSONB NOT NULL,
          scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          error_message TEXT,
          published_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CHECK (status IN ('pending', 'scheduled', 'published', 'failed', 'cancelled'))
        );
      `
    });

    if (error2) {
      console.error('❌ Erro ao criar scheduled_posts:', error2);
    } else {
      console.log('✅ Tabela scheduled_posts criada!');
    }

    // Criar índices
    console.log('📋 Criando índices...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);',
      'CREATE INDEX IF NOT EXISTS idx_user_social_accounts_active ON user_social_accounts(is_active) WHERE is_active = true;',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);'
    ];

    for (const indexSQL of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (error) {
        console.error('❌ Erro ao criar índice:', error);
      }
    }
    console.log('✅ Índices criados!');

    // Habilitar RLS
    console.log('🔒 Configurando Row Level Security...');
    const rlsCommands = [
      'ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;'
    ];

    for (const rlsSQL of rlsCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: rlsSQL });
      if (error) {
        console.error('❌ Erro ao configurar RLS:', error);
      }
    }
    console.log('✅ RLS configurado!');

    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

createTables();