-- Tabela para armazenar contas sociais conectadas dos usuários
CREATE TABLE IF NOT EXISTS user_social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'
  account_id VARCHAR(255) NOT NULL, -- ID da conta na plataforma
  account_name VARCHAR(255), -- Nome de exibição da conta
  account_username VARCHAR(255), -- @username
  access_token TEXT NOT NULL, -- Token de acesso OAuth
  refresh_token TEXT, -- Token de refresh (quando aplicável)
  token_expires_at TIMESTAMP WITH TIME ZONE, -- Quando o token expira
  scopes TEXT[], -- Permissões concedidas
  is_active BOOLEAN DEFAULT true, -- Se a conta está ativa
  last_used_at TIMESTAMP WITH TIME ZONE, -- Último uso
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, platform, account_id),
  CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_active ON user_social_accounts(is_active) WHERE is_active = true;

-- Tabela para armazenar posts agendados
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_post_id VARCHAR(255), -- ID retornado pela API Upload-Post
  title VARCHAR(255),
  content TEXT NOT NULL,
  hashtags TEXT[], -- Array de hashtags
  media_urls TEXT[], -- URLs das mídias enviadas
  platforms JSONB NOT NULL, -- {"instagram": "account_id", "facebook": "account_id"}
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'scheduled', 'published', 'failed', 'cancelled'
  error_message TEXT, -- Mensagem de erro se falhou
  published_at TIMESTAMP WITH TIME ZONE, -- Quando foi publicado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CHECK (status IN ('pending', 'scheduled', 'published', 'failed', 'cancelled'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_upload_post_id ON scheduled_posts(upload_post_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Políticas para user_social_accounts
CREATE POLICY "Users can view their own social accounts" ON user_social_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts" ON user_social_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts" ON user_social_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts" ON user_social_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para scheduled_posts
CREATE POLICY "Users can view their own scheduled posts" ON scheduled_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled posts" ON scheduled_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts" ON scheduled_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_user_social_accounts_updated_at
  BEFORE UPDATE ON user_social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();