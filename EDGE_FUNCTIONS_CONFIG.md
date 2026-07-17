# Configuração das Edge Functions - Sistema Multi-Agente

## Visão Geral

Este documento detalha a configuração das Edge Functions para o sistema de multi-agentes com integração VAPI.

## Estrutura das Edge Functions

```
supabase/functions/
├── create-vapi-agent/     # Cria assistente no VAPI
├── update-vapi-agent/     # Atualiza configuração do assistente
├── delete-vapi-agent/     # Deleta assistente do VAPI
├── start-agent-calls/     # Inicia ligações do agente
├── stop-agent-calls/      # Para ligações ativas
└── vapi-webhook/          # Recebe webhooks do VAPI
```

## Variáveis de Ambiente Necessárias

Configure estas variáveis no Supabase Dashboard (Project Settings > Edge Functions):

```env
VAPI_API_KEY=seu_vapi_api_key_aqui
SUPABASE_URL=https://seu_projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### Como obter as chaves:

1. **VAPI_API_KEY**: 
   - Acesse https://dashboard.vapi.ai
   - Vá em Settings > API Keys
   - Crie uma nova API key

2. **SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY**:
   - Disponíveis no Supabase Dashboard
   - Project Settings > API
   - Use a "service_role" key (não a "anon" key)

## Deploy das Edge Functions

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Link ao Projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

### 4. Deploy de Todas as Functions

```bash
supabase functions deploy create-vapi-agent
supabase functions deploy update-vapi-agent
supabase functions deploy delete-vapi-agent
supabase functions deploy start-agent-calls
supabase functions deploy stop-agent-calls
supabase functions deploy vapi-webhook
```

### 5. Configurar Secrets

```bash
supabase secrets set VAPI_API_KEY=sua_chave_aqui
```

## Fluxo de Funcionamento

### 1. Criação de Agente
```
Frontend → create-vapi-agent → VAPI API → Supabase DB
                                  ↓
                          Retorna assistantId
```

### 2. Iniciar Ligações
```
Frontend → start-agent-calls → VAPI API (Phone Call) → Supabase DB
                                         ↓
                                Chamadas iniciadas
```

### 3. Webhook de Fim de Chamada
```
VAPI → vapi-webhook → Supabase DB
         ↓
    - Atualiza histórico
    - Debita créditos
    - Atualiza estatísticas
    - Verifica limite diário
```

## Endpoints das Edge Functions

Todas as functions são acessíveis via:

```
https://SEU_PROJECT.supabase.co/functions/v1/{function-name}
```

### Exemplos de Uso

#### Criar Agente
```javascript
const { data, error } = await supabase.functions.invoke('create-vapi-agent', {
  body: {
    agentId: 'uuid-do-agente',
    name: 'Agente Vendas',
    systemPrompt: 'Você é um vendedor profissional...',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (ElevenLabs)
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
  }
});
```

#### Iniciar Ligações
```javascript
const { data, error } = await supabase.functions.invoke('start-agent-calls', {
  body: {
    agentId: 'uuid-do-agente',
    vapiAssistantId: 'vapi-assistant-id',
    maxConcurrent: 1,
  }
});
```

#### Parar Ligações
```javascript
const { data, error } = await supabase.functions.invoke('stop-agent-calls', {
  body: {
    agentId: 'uuid-do-agente',
  }
});
```

## Configuração do Webhook no VAPI

1. Acesse VAPI Dashboard > Settings > Webhooks
2. Configure a URL do webhook:
   ```
   https://SEU_PROJECT.supabase.co/functions/v1/vapi-webhook
   ```
3. Selecione os eventos:
   - `status-update`
   - `transcript`
   - `end-of-call-report`

## Custos por Minuto

O sistema calcula automaticamente os custos:

- **VAPI Infrastructure**: R$ 0,25/min
- **Claude 3.5 Sonnet**: R$ 0,009/min
- **ElevenLabs TTS**: R$ 0,15/min
- **Deepgram STT**: R$ 0,022/min
- **Twilio (via VAPI)**: R$ 0,065/min

**Total**: R$ 0,50/min (arredondado)

O sistema debita automaticamente os créditos do usuário ao final de cada chamada.

## Monitoramento e Logs

### Ver logs em tempo real:
```bash
supabase functions logs vapi-webhook --tail
```

### Ver logs específicos de uma function:
```bash
supabase functions logs create-vapi-agent --limit 100
```

## Troubleshooting

### Erro: "Missing authorization header"
- Certifique-se de passar o token JWT no header:
  ```javascript
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
  ```

### Erro: "VAPI API error"
- Verifique se a VAPI_API_KEY está configurada corretamente
- Confirme que a key tem permissões adequadas

### Erro: "Agent not found"
- Verifique se o agentId existe no banco
- Confirme que o agente pertence ao usuário autenticado

### Webhook não está sendo recebido
- Verifique a URL configurada no VAPI Dashboard
- Confirme que a função vapi-webhook está deployada
- Verifique os logs da function

## Segurança

- ✅ Todas as functions validam autenticação via JWT
- ✅ RLS (Row Level Security) ativo nas tabelas
- ✅ Service Role Key nunca exposta ao frontend
- ✅ Validação de ownership (user_id) em todas operações
- ✅ CORS configurado para permitir apenas seu domínio (ajustar em produção)

## Próximos Passos

1. Aplicar o schema SQL: `add_multi_agent_system.sql`
2. Deploy das Edge Functions
3. Configurar variáveis de ambiente
4. Configurar webhook no VAPI Dashboard
5. Testar criação de agente via frontend
6. Testar fluxo completo de ligação

## Suporte

Para dúvidas ou problemas:
- Documentação VAPI: https://docs.vapi.ai
- Documentação Supabase: https://supabase.com/docs
- Logs das functions: `supabase functions logs`
