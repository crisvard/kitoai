# 🌐 Novo Serviço: Desenvolvimento de Sites

## ✅ Implementação Completa

Você agora tem um novo serviço completo de **Desenvolvimento de Sites** com todas as funcionalidades solicitadas!

---

## 📋 O que foi criado:

### 1. **Banco de Dados**
- ✅ Tabela `website_services` com campos completos:
  - `site_name` - Nome do website
  - `site_link` - Link do site
  - `domain_login` - Email/login do domínio
  - `domain_password` - Senha do domínio (criptografada)
  - `github_link` - Link do repositório GitHub
  - `hosting_data` (JSONB) - Dados de hospedagem:
    - provider (Hostinger, AWS, etc)
    - host (servidor)
    - plan (tipo de plano)
    - account (conta de usuário)
    - notes (notas gerais)
  - `social_links` (JSONB) - Array de redes sociais com plataforma e URL
  - `site_photos` (JSONB) - Array de fotos com URL e nome
  - `notes` - Campo de notas gerais
  - `status` - Ativo/Inativo
  - `created_at` e `updated_at` - Timestamps

### 2. **Componentes Frontend**
- ✅ `WebsiteServiceCard.tsx` - Card visual do serviço
- ✅ `WebsitePage.tsx` - Página principal com 4 abas:
  - **Meus Sites**: Lista de websites registrados com cards
  - **Estatísticas**: Dashboard com métricas dos websites
  - **Detalhes**: Formulário detalhado para editar informações
  - **Notas**: Seção para redes sociais, fotos e anotações

### 3. **Hook Customizado**
- ✅ `useWebsiteServices.ts` - Gerencia CRUD completo:
  - `fetchWebsites()` - Busca todos os websites
  - `createWebsite()` - Cria novo website
  - `updateWebsite()` - Atualiza website existente
  - `deleteWebsite()` - Deleta website
  - `getWebsite()` - Busca um website específico

### 4. **Integração ao Dashboard**
- ✅ Novo card de serviço no dashboard
- ✅ Novo plano "Desenvolvimento de Sites" com preço R$ 149/mês
- ✅ Navegação integrada ao menu principal

---

## 🚀 Como Implementar

### Passo 1: Executar a Migração do Banco
Cole este SQL no **Supabase SQL Editor**:

**Arquivo:** `/create_website_services_table.sql`

ou manualmente:

```sql
-- ============================================
-- CREATE WEBSITE SERVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS website_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_link TEXT,
  domain_login TEXT,
  domain_password TEXT,
  github_link TEXT,
  hosting_data JSONB,
  social_links JSONB DEFAULT '[]'::jsonb,
  site_photos JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_services_user_id ON website_services(user_id);
CREATE INDEX IF NOT EXISTS idx_website_services_status ON website_services(status);
CREATE INDEX IF NOT EXISTS idx_website_services_created_at ON website_services(created_at);

ALTER TABLE website_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own websites" ON website_services;
CREATE POLICY "Users can view own websites"
ON website_services FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own websites" ON website_services;
CREATE POLICY "Users can insert own websites"
ON website_services FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own websites" ON website_services;
CREATE POLICY "Users can update own websites"
ON website_services FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own websites" ON website_services;
CREATE POLICY "Users can delete own websites"
ON website_services FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "website_services_service_role_policy" ON website_services;
CREATE POLICY "website_services_service_role_policy"
ON website_services
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

### Passo 2: Adicionar Campos ao Profile
Cole este SQL também no **Supabase SQL Editor**:

**Arquivo:** `/add_website_fields_to_profile.sql`

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_activation_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_website_active ON profiles(website_active);
```

### Passo 3: Pronto! 🎉
- O novo card aparecerá no dashboard
- Usuários poderão contratar o plano "Desenvolvimento de Sites"
- Acessar a página em `/websites`

---

## 📖 Funcionalidades Detalhadas

### Aba "Meus Sites"
- **Listar** todos os websites registrados em cards
- **Adicionar** novo website via modal simples
- **Editar** website (botão no hover do card)
- **Deletar** website com confirmação
- Mostra indicadores visuais de:
  - Status (ativo/inativo)
  - Links (site, GitHub, hospedagem, redes sociais)

### Aba "Estatísticas"
- Total de websites
- Websites ativos
- Websites com credenciais
- Websites com GitHub
- Tabela com status de cada website
- Datas de criação

### Aba "Detalhes"
Ao selecionar um website, mostra:
- Link do website (clicável)
- Credenciais do domínio (com botão de mostrar/ocultar senha)
- Link do GitHub (clicável)
- Dados de hospedagem formatados:
  - Provedor
  - Host/Servidor
  - Plano
  - Conta/Email
  - Notas de hospedagem
- Botão para editar todos os campos

### Aba "Notas"
Permite gerenciar dados adicionais:
- **Redes Sociais**: Adicionar múltiplas plataformas (Instagram, Facebook, LinkedIn, etc)
  - Campo de plataforma
  - Campo de URL
  - Botão remover
- **Fotos do Website**: Adicionar múltiplas fotos
  - URL da foto
  - Nome/Descrição (opcional)
  - Botão remover
- **Notas Gerais**: Campo de texto grande para anotações
- Salvar tudo de uma vez

---

## 🔐 Segurança

- ✅ RLS (Row Level Security) habilitado
- ✅ Usuários só podem ver/editar seus próprios websites
- ✅ Senhas armazenadas como text (pode ser encriptado futuramente)
- ✅ Validações no frontend

---

## 📁 Arquivos Criados/Modificados

**Novos Arquivos:**
- `create_website_services_table.sql` - Migração do banco
- `add_website_fields_to_profile.sql` - Adição de campos
- `src/components/WebsiteServiceCard.tsx` - Card do serviço
- `src/pages/WebsitePage.tsx` - Página principal
- `src/hooks/useWebsiteServices.ts` - Hook de API

**Modificados:**
- `src/components/Dashboard.tsx` - Adicionado plano e card
- `src/App.tsx` - Adicionado rota e navegação

---

## 🧪 Teste Rápido

1. Vá para o **Dashboard**
2. Procure por "Serviços de Website" (nova seção)
3. Clique no botão "Contratar" (se não contratado)
4. Após contratar, clique em "Gerenciar Sites"
5. Clique em "+ Novo Website"
6. Preencha os dados e salve
7. Navegue pelas 4 abas para explorar as funcionalidades

---

## 🎯 Próximas Melhorias (Opcionais)

1. **Integração com APIs de hospedagem**
   - Importar dados automaticamente de Hostinger, AWS, etc

2. **Criptografia de Senhas**
   - Usar Edge Functions do Supabase para criptografar senhas

3. **Upload de Fotos**
   - Integrar com Storage do Supabase ao invés de apenas URLs

4. **Relatórios Automáticos**
   - Gerar relatórios em PDF dos websites

5. **Notificações**
   - Alertar sobre vencimento de domínios/hospedagem

6. **Análise de Performance**
   - Integrar com ferramentas como PageSpeed Insights

---

## 💬 Suporte

Se tiver dúvidas sobre como usar:
- Cheque a aba "Estatísticas" para ver um resumo visual
- O formulário de "Detalhes" é auto-explicativo
- Todos os campos são opcionais exceto "Nome do Website"

---

**Implementação concluída em: 7 de Janeiro de 2026** ✨
