# Guia de Configuração — WhatsApp Business API

## 1. Executar migração SQL

Acesse o Supabase Dashboard → SQL Editor e execute o arquivo:

```
supabase/migrations/20260307_whatsapp_business_api.sql
```

Isso cria as tabelas: `whatsapp_business_credentials`, `whatsapp_business_conversations`, `whatsapp_business_messages`, `whatsapp_audit_logs`.

---

## 2. Configurar Supabase Secrets (Edge Functions → Secrets)

Acesse: Supabase Dashboard → Edge Functions → Manage secrets

| Nome da variável | Valor |
|---|---|
| `WHATSAPP_BUSINESS_ACCESS_TOKEN` | `EAAL2IV7bZAI4BQz9d7eG9L2wVrfrZAUtsvzZALDd4TAD8nZCiTjxeQZBZAgZCzcloXOJu4IW0KqU0UgIhSu9ZA9bBDn9O9odSATUDHATS2FKtN2tgFcEsS2BWR6BFLBZBbaDy3PkzvL54raufKrVBMNZCTpJZCGe8NISUfSI8rWTTvXZB8KZAmW6Fb19QbEL980gZAfvOqzGP8pRtqZBSWZAZATI8Q5LnEuVcnPtduhOZCVJtN` |
| `WHATSAPP_BUSINESS_PHONE_NUMBER_ID` | `1015721704950596` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `887308044057211` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | `kito_webhook_token_2026` |
| `WHATSAPP_ENCRYPTION_KEY` | `e7b98afe29340d695022dd18806e2eed0f6c8121f8eb5538163197fd29e9b193` |
| `WHATSAPP_ENCRYPTION_SALT` | `a9213cbfa040b7c08a6e33f0189d86e6293dd1530163cf013f4e85496028d290dd6989f73fa4286d140c869de96a60ec8757ed94d17cdc99fd8b41be464f66f1` |
| `N8N_WHATSAPP_WEBHOOK_URL` | `<URL do webhook N8N — a configurar>` |

> ⚠️ NUNCA compartilhe este arquivo publicamente. Contém credenciais sensíveis.

---

## 3. Deploy das Edge Functions

Via Supabase CLI:

```bash
supabase functions deploy setup-whatsapp-business
supabase functions deploy whatsapp-business-webhook
supabase functions deploy send-whatsapp-business-message
supabase functions deploy test-whatsapp-business-connection
```

Ou faça o deploy de todas de uma vez:

```bash
supabase functions deploy
```

---

## 4. Configurar Webhook no Meta Business Manager

1. Acesse: [Meta for Developers](https://developers.facebook.com/) → seu App **Api Whatsapp - Agencia de IA**
2. Vá em **WhatsApp → Configuration**
3. Em **Webhook**, clique em **Edit**
4. Preencha:
   - **Callback URL**: `https://<SUPABASE_PROJECT_URL>/functions/v1/whatsapp-business-webhook`
   - **Verify Token**: `kito_webhook_token_2026`
5. Clique em **Verify and Save**
6. Assine os campos: `messages`, `message_deliveries`, `message_reads`

> Substitua `<SUPABASE_PROJECT_URL>` pela URL do seu projeto Supabase (ex: `https://xyz.supabase.co`)

---

## 5. Fluxo de uso pelo usuário

1. O usuário acessa a aba **Conexão WhatsApp** no sistema
2. Insere o número do WhatsApp no formato `5511987654321`
3. Clica em **Configurar WhatsApp Business**
4. O sistema automaticamente:
   - Lê as credenciais da Meta dos Supabase Secrets
   - Registra o número na tabela `whatsapp_business_credentials`
   - Testa a conexão com a API da Meta
5. Ao concluir, aparece o card de confirmação com nome verificado e qualidade da linha
6. As abas **Configurar Agente** e **Testar Agente** são liberadas

---

## 6. Arquitetura das Edge Functions

| Função | Gatilho | Descrição |
|---|---|---|
| `setup-whatsapp-business` | Usuário clica "Configurar" | Registra número, valida contra API Meta |
| `whatsapp-business-webhook` | Meta envia mensagem recebida | Processa, salva no DB, repassa ao N8N |
| `send-whatsapp-business-message` | N8N envia resposta | Envia via API Meta, salva no DB |
| `test-whatsapp-business-connection` | Usuário/Frontend verifica | Testa status da conta no Meta |

---

## Datas de criação

- Migration: `20260307_whatsapp_business_api.sql`
- Credenciais registradas: App ID `833573139211406`, Phone ID `1015721704950596`, Business ID `887308044057211`
