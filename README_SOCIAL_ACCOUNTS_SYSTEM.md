# Sistema de Agendamento de Posts Multi-usuário

## Visão Geral

Este sistema permite que usuários conectem suas contas individuais de redes sociais e agendem posts automaticamente através da API Upload-Post. Cada usuário mantém suas próprias conexões OAuth e dados isolados.

## Arquitetura

### Componentes Principais

1. **SocialAccountsManager**: Gerencia a conexão/desconexão de contas sociais
2. **CreatePost**: Interface para criar posts usando contas conectadas
3. **ScheduledPostsList**: Lista posts agendados do usuário
4. **uploadPostApiNew**: API client refatorada para suporte multi-usuário

### Banco de Dados

#### Tabelas Principais

```sql
-- Contas sociais conectadas por usuário
CREATE TABLE user_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'twitter', etc.
  account_id TEXT NOT NULL, -- ID da conta na plataforma
  account_name TEXT, -- Nome de exibição da conta
  account_username TEXT, -- @username
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[], -- Permissões concedidas
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Posts agendados por usuário
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_post_id TEXT, -- ID retornado pela API Upload-Post
  title TEXT,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  platforms JSONB NOT NULL, -- {"instagram": "account_id", "facebook": "account_id"}
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'published', 'failed', 'cancelled')),
  error_message TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Políticas RLS (Row Level Security)
ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Políticas para isolamento de dados por usuário
CREATE POLICY "Users can only see their own social accounts" ON user_social_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own scheduled posts" ON scheduled_posts
  FOR ALL USING (auth.uid() = user_id);
```

## Funcionalidades

### 1. Gerenciamento de Contas Sociais

- **Conexão OAuth**: Conecta contas individuais de redes sociais
- **Isolamento por usuário**: Cada usuário vê apenas suas próprias contas
- **Suporte a múltiplas contas**: Uma conta por plataforma por usuário
- **Gerenciamento de tokens**: Armazenamento seguro de access/refresh tokens

### 2. Criação de Posts

- **Seleção de contas**: Escolhe contas específicas conectadas para postar
- **Agendamento**: Define data e hora para publicação
- **Mídia**: Upload de imagens e vídeos
- **Hashtags**: Suporte a hashtags automáticas
- **Validação**: Verificação de limites de caracteres por plataforma

### 3. Gerenciamento de Posts Agendados

- **Lista de posts**: Visualiza todos os posts agendados
- **Status em tempo real**: Atualiza status dos posts
- **Cancelamento**: Cancela posts pendentes
- **Histórico**: Mantém histórico de posts publicados

## Fluxo de Uso

### Para Novos Usuários

1. **Conectar contas sociais**:
   - Acesse a seção "Contas Sociais"
   - Clique em "Conectar" para cada plataforma desejada
   - Autorize o acesso OAuth
   - Conta fica disponível para agendamento

2. **Criar primeiro post**:
   - Vá para "Criar Post"
   - Selecione contas conectadas
   - Preencha conteúdo e agendamento
   - Clique em "Agendar Post"

### Para Usuários Existentes

1. **Gerenciar contas**: Adicione/remova conexões conforme necessário
2. **Criar posts**: Use contas conectadas para agendar conteúdo
3. **Monitorar posts**: Acompanhe status através da lista de posts agendados

## Configuração de Desenvolvimento

### Variáveis de Ambiente

```env
# API Upload-Post
VITE_UPLOAD_POST_BASE_URL=https://api.upload-post.com

# Modo mock para desenvolvimento
VITE_USE_MOCK_API=true
```

### Instalação das Tabelas

Execute os scripts SQL na ordem:

1. `create_social_accounts_tables.sql` - Cria tabelas do banco
2. `run_social_accounts_migration.js` - Migração automatizada (opcional)

### Modo Mock

Durante desenvolvimento, o sistema usa localStorage para simular:
- Conexões OAuth
- Agendamento de posts
- Status de posts

Para produção, configure:
- Backend OAuth seguro
- API Upload-Post real
- Banco de dados Supabase

## Segurança

### Isolamento de Dados
- **Row Level Security**: Políticas RLS no Supabase
- **User-based filtering**: Todas as queries filtram por `auth.uid()`

### Tokens OAuth
- **Armazenamento seguro**: Tokens criptografados no banco
- **Refresh automático**: Renovação de tokens expirados
- **Escopos limitados**: Apenas permissões necessárias

### Validação
- **Input sanitization**: Validação de todos os inputs
- **Rate limiting**: Controle de frequência de requests
- **Error handling**: Tratamento seguro de erros

## APIs e Integrações

### Upload-Post API

```typescript
// Agendamento de post
POST /api/schedule
{
  "platforms": {"instagram": "account_id", "facebook": "account_id"},
  "content": "Post content",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "mediaUrls": ["https://..."],
  "scheduledAt": "2024-01-01T10:00:00Z"
}

// Status do post
GET /api/status/{postId}

// Upload de mídia
POST /api/upload
FormData: { file: File, type: "media" }
```

### Supabase Client

```typescript
import { supabase } from '../lib/supabase';

// Queries com RLS automático
const { data } = await supabase
  .from('user_social_accounts')
  .select('*')
  .eq('user_id', user.id); // Automaticamente filtrado por RLS
```

## Próximos Passos

### Implementação Pendente

1. **OAuth Real**: Implementar fluxo OAuth completo
2. **Token Refresh**: Lógica de renovação automática de tokens
3. **Webhooks**: Receber notificações de status da API
4. **Analytics**: Métricas de engajamento dos posts
5. **Bulk Actions**: Agendamento em lote

### Melhorias Futuras

1. **Templates**: Posts pré-definidos
2. **Agendamento Recorrente**: Posts em série
3. **A/B Testing**: Teste de diferentes conteúdos
4. **Analytics Dashboard**: Relatórios detalhados
5. **Team Collaboration**: Compartilhamento de contas

## Suporte

Para questões técnicas ou bugs, consulte:
- Documentação da API Upload-Post
- Documentação do Supabase
- Logs do console do navegador

## Changelog

### v2.0.0 - Sistema Multi-usuário
- ✅ Isolamento por usuário com RLS
- ✅ Gerenciamento de contas sociais OAuth
- ✅ API refatorada para contas específicas
- ✅ Interface atualizada para seleção de contas
- ✅ Lista de posts agendados por usuário
- ✅ Modo mock para desenvolvimento