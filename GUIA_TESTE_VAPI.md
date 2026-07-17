# Guia Completo: Como Fazer Testes de Chamada com VAPI

## 1. RESUMO EXECUTIVO

Este workspace contém um **Sistema Completo de Agentes de Ligação** que integra a VAPI para chamadas de voz automatizadas. Para fazer testes de chamada, você precisa:

1. ✅ Configurar a `VAPI_API_KEY` no Supabase
2. ✅ Adicionar um número de telefone (Twilio, Telnyx ou VAPI)
3. ✅ Criar um agente com configurações de prompts
4. ✅ Adicionar contatos para chamar
5. ✅ Invocar a edge function `start-agent-calls`

---

## 2. ARQUIVOS DE CONFIGURAÇÃO IMPORTANTES

### 2.1 Variáveis de Ambiente
- **Arquivo**: [.env.example](.env.example)
- **Localização**: Raiz do projeto
- **Chaves VAPI necessárias**:
  ```
  VAPI_API_KEY=sk_live_...              # VAPI authentication
  SUPABASE_URL=https://seu_projeto.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
  ```

### 2.2 Configuração das Edge Functions
- **Arquivo**: [EDGE_FUNCTIONS_CONFIG.md](EDGE_FUNCTIONS_CONFIG.md)
- **Contém**: Instruções de deploy, endpoints, e fluxos de funcionamento

### 2.3 Análise Detalhada do Sistema
- **Arquivo**: [CALLING_AGENT_ANALYSIS.md](CALLING_AGENT_ANALYSIS.md)
- **Contém**: Arquitetura completa, fluxos, testes e checklist

---

## 3. EDGE FUNCTIONS PARA TESTES DE CHAMADA

### 3.1 Criar um Agente VAPI
**Edge Function**: `create-vapi-agent`  
**Arquivo**: [supabase/functions/create-vapi-agent/index.ts](supabase/functions/create-vapi-agent/index.ts)

```typescript
// Exemplo de invocação
const { data, error } = await supabase.functions.invoke('create-vapi-agent', {
  body: {
    agentId: 'uuid-do-agente',
    name: 'Meu Agente de Teste',
    systemPrompt: 'Você é um assistente amigável para testes...',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (ElevenLabs)
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    firstMessage: 'Olá! Isso é um teste de ligação.'
  }
});
```

**Configurações Padrão**:
- **Modelo**: Claude 3.5 Sonnet (Anthropic)
- **Voice Provider**: ElevenLabs (eleven_turbo_v2_5)
- **Transcriber**: Deepgram (nova-2)
- **Idioma**: Português Brasil (pt-BR)
- **Recording**: Ativado

---

### 3.2 Iniciar Chamadas de Teste
**Edge Function**: `start-agent-calls`  
**Arquivo**: [supabase/functions/start-agent-calls/index.ts](supabase/functions/start-agent-calls/index.ts)

```typescript
// Exemplo de invocação
const { data, error } = await supabase.functions.invoke('start-agent-calls', {
  body: {
    agentId: 'uuid-do-seu-agente',
    vapiAssistantId: 'vapi-assistant-id-aqui',
    maxConcurrent: 1,  // Número máximo de chamadas simultâneas
    contactIds: ['contact-1', 'contact-2']  // Opcional: contatos específicos
  }
});
```

**Requisitos**:
- ✅ Agente deve ter `phone_number_provider_id` configurado
- ✅ Agente deve ter `allocated_credits > 0`
- ✅ Deve haver contatos com `status = 'pending'`
- ✅ Limite diário não deve estar excedido

---

### 3.3 Parar Chamadas
**Edge Function**: `stop-agent-calls`  
**Arquivo**: [supabase/functions/stop-agent-calls/index.ts](supabase/functions/stop-agent-calls/index.ts)

```typescript
const { data, error } = await supabase.functions.invoke('stop-agent-calls', {
  body: {
    agentId: 'uuid-do-seu-agente'
  }
});
```

---

### 3.4 Gerenciar Números de Telefone
**Edge Function**: `manage-vapi-phone-numbers`  
**Arquivo**: [supabase/functions/manage-vapi-phone-numbers/index.ts](supabase/functions/manage-vapi-phone-numbers/index.ts)

```typescript
// Listar números cadastrados
const { data: numbers } = await supabase.functions.invoke('manage-vapi-phone-numbers', {
  body: { action: 'list' }
});

// Adicionar número Twilio
const { data: added } = await supabase.functions.invoke('manage-vapi-phone-numbers', {
  body: {
    action: 'add_twilio',
    phone_number: '+5511999999999',
    twilio_account_sid: 'ACxxxxxx',
    twilio_auth_token: 'token_aqui'
  }
});
```

---

### 3.5 Webhook de Eventos
**Edge Function**: `vapi-webhook`  
**Arquivo**: [supabase/functions/vapi-webhook/index.ts](supabase/functions/vapi-webhook/index.ts)

**Recebe eventos**:
- `call-started` - Chamada iniciada
- `call-ended` - Chamada finalizada
- `status-update` - Atualização de status
- `transcript` - Transcrição da chamada
- `tool-call` - Chamadas de ferramentas customizadas

**Processa automaticamente**:
- ✅ Debita créditos do agente
- ✅ Atualiza histórico de chamadas
- ✅ Registra transcrição e gravação
- ✅ Verifica limite diário

---

## 4. SCRIPT DE TESTE: Telnyx

Um script de teste já existe para Telnyx:

**Arquivo**: [test-telnyx-call.mjs](test-telnyx-call.mjs)

**O que faz**:
1. Lista aplicações de Voice API configuradas
2. Lista números de telefone ativos
3. Faz uma chamada de teste

**Para usar**:
```bash
node test-telnyx-call.mjs
```

**Chave necessária**:
```javascript
const TELNYX_API_KEY = "8dd62c5680295717f9d69ecc516a1df9fbedeccb50190d3bc814c48a30680941";
const TEST_NUMBER = "+5519995125321";  // Número para testar
```

---

## 5. INSTRUÇÕES PASSO A PASSO PARA TESTE

### 5.1 Pré-requisitos
- [ ] Conta VAPI criada em https://dashboard.vapi.ai
- [ ] VAPI_API_KEY configurada no Supabase
- [ ] Número de telefone adicionado (Twilio ou VAPI)
- [ ] Agente criado no banco de dados
- [ ] Edge functions deployadas

### 5.2 Setup Inicial

```bash
# 1. Login no Supabase
supabase login

# 2. Link ao projeto
supabase link --project-ref SEU_PROJECT_REF

# 3. Deploy de todas as functions
supabase functions deploy

# 4. Configurar secret VAPI_API_KEY
supabase secrets set VAPI_API_KEY=sk_live_sua_chave_aqui
```

### 5.3 Criar Agente de Teste (via Node.js)

```javascript
// Script: criar-agente-teste.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://seu-projeto.supabase.co',
  'sua-anon-key'
);

// Criar agente
const { data: agent } = await supabase
  .from('user_agents')
  .insert([{
    user_id: 'seu-user-id',
    name: 'Agente Teste VAPI',
    status: 'idle',
    system_prompt: 'Olá! Você é um assistente de teste.',
    allocated_credits: 100,
    daily_minutes_limit: 500
  }])
  .select()
  .single();

console.log('Agente criado:', agent.id);
```

### 5.4 Adicionar Contato de Teste

```javascript
// Inserir contato
const { data: contact } = await supabase
  .from('agent_contacts')
  .insert([{
    agent_id: agent_id_aqui,
    name: 'João Silva',
    phone: '+5519999999999',
    status: 'pending',
    attempt_count: 0
  }])
  .select()
  .single();

console.log('Contato adicionado:', contact.id);
```

### 5.5 Configurar Número de Telefone

```javascript
// Adicionar número Twilio ao usuário
const { data: phone } = await supabase
  .from('user_phone_numbers')
  .insert([{
    user_id: 'seu-user-id',
    number: '+5511988776655',
    provider: 'twilio',
    twilio_account_sid: 'ACxxxxxx',
    twilio_auth_token: 'token_aqui'
  }])
  .select()
  .single();

// Atualizar agente para usar este número
await supabase
  .from('user_agents')
  .update({ phone_number_provider_id: phone.id })
  .eq('id', agent_id);
```

### 5.6 Iniciar Chamada de Teste

```javascript
// Via Edge Function
const { data, error } = await supabase.functions.invoke('start-agent-calls', {
  body: {
    agentId: 'seu-agente-id',
    vapiAssistantId: 'seu-vapi-assistant-id',
    maxConcurrent: 1,
    contactIds: ['seu-contato-id']
  }
});

if (error) {
  console.error('Erro ao iniciar chamada:', error);
} else {
  console.log('Chamada iniciada:', data);
}
```

---

## 6. MONITORAMENTO DE TESTES

### 6.1 Verificar Status da Chamada

```sql
-- SQL para ver histórico de chamadas
SELECT 
  acr.id,
  acr.agent_id,
  acr.contact_id,
  acr.status,
  acr.duration_seconds,
  acr.started_at,
  acr.ended_at,
  acr.transcript
FROM agent_call_history acr
ORDER BY acr.started_at DESC
LIMIT 10;
```

### 6.2 Verificar Débito de Créditos

```sql
-- Ver alocação de créditos do agente
SELECT 
  id,
  name,
  allocated_credits,
  status
FROM user_agents
WHERE user_id = 'seu-user-id';
```

### 6.3 Ver Logs do Webhook

```sql
-- Ver eventos VAPI recebidos
SELECT 
  id,
  agent_id,
  event_type,
  payload,
  received_at
FROM vapi_webhook_logs
ORDER BY received_at DESC
LIMIT 20;
```

---

## 7. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

| Variável | Descrição | Obtenção |
|----------|-----------|----------|
| `VAPI_API_KEY` | Chave API VAPI | https://dashboard.vapi.ai → Settings → API Keys |
| `SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço | Supabase Dashboard → Settings → API (service_role) |
| `STRIPE_SECRET_KEY` | Chave Stripe (opcional) | https://dashboard.stripe.com |
| `ASAAS_API_KEY` | Chave Asaas (opcional) | https://dashboard.asaas.com |
| `CAL_COM_API_KEY` | Chave Cal.com (opcional) | https://app.cal.com |

---

## 8. CUSTO PER MINUTO

Conforme [vapi-webhook/index.ts](supabase/functions/vapi-webhook/index.ts):

```
COST_PER_MINUTE = 0.50 créditos
```

**Exemplos**:
- Chamada de 1 min = 0.50 créditos
- Chamada de 5 min = 2.50 créditos
- Chamada de 10 min = 5.00 créditos

---

## 9. TESTES RECOMENDADOS

### 9.1 Teste Básico
- [ ] Criar agente VAPI
- [ ] Adicionar número Twilio
- [ ] Criar contato de teste
- [ ] Iniciar chamada
- [ ] Verificar webhook recebeu evento
- [ ] Verificar créditos foram debitados
- [ ] Verificar transcrição foi salva

### 9.2 Teste de Multi-Agente
- [ ] Criar 2+ agentes
- [ ] Atribuir números diferentes
- [ ] Iniciar chamadas em paralelo
- [ ] Verificar pools de créditos separados

### 9.3 Teste de Limit Diário
- [ ] Configurar agent.daily_minutes_limit = 5
- [ ] Fazer chamada de 3 min
- [ ] Fazer chamada de 2 min → deve funcionar
- [ ] Fazer outra chamada → deve falhar (atingiu limite)

### 9.4 Teste de Trial
- [ ] Novo usuário com trial_ligacoes_active = true
- [ ] Deve poder fazer chamadas
- [ ] Após trial expirar → deve falhar

---

## 10. TROUBLESHOOTING

### Erro: "VAPI_API_KEY não configurada"
```bash
supabase secrets set VAPI_API_KEY=sk_live_sua_chave
```

### Erro: "Agent without phone number"
```javascript
// Garanta que o agente tem:
await supabase
  .from('user_agents')
  .update({ phone_number_provider_id: 'seu-phone-id' })
  .eq('id', 'seu-agent-id');
```

### Erro: "No pending contacts"
```javascript
// Crie contatos com status = 'pending'
await supabase
  .from('agent_contacts')
  .insert([{
    agent_id: 'seu-agent-id',
    phone: '+5519999999999',
    status: 'pending',
    attempt_count: 0
  }]);
```

### Erro: "Insufficient credits"
```javascript
// Aumente os créditos alocados
await supabase
  .from('user_agents')
  .update({ allocated_credits: 1000 })
  .eq('id', 'seu-agent-id');
```

---

## 11. REFERÊNCIAS DE DOCUMENTAÇÃO

- 📚 [CALLING_AGENT_ANALYSIS.md](CALLING_AGENT_ANALYSIS.md) - Análise técnica completa
- 📚 [EDGE_FUNCTIONS_CONFIG.md](EDGE_FUNCTIONS_CONFIG.md) - Configuração das functions
- 📚 [VAPI Docs](https://docs.vapi.ai) - Documentação oficial VAPI
- 📚 [Supabase Edge Functions](https://supabase.com/docs/guides/functions) - Docs Supabase

---

## 12. CHECKLIST DE IMPLEMENTAÇÃO

Confira também: [CHECKLIST_IMPLEMENTACAO.md](CHECKLIST_IMPLEMENTACAO.md)

```
□ VAPI_API_KEY configurada
□ Números de telefone cadastrados
□ Agentes criados
□ Contatos adicionados
□ Edge functions deployadas
□ Webhook VAPI configurado
□ Primeira chamada de teste realizada
□ Créditos debitados corretamente
□ Transcrição salva
□ Sistema pronto para produção
```

---

## 13. PRÓXIMOS PASSOS

1. **Validar Setup**: Execute [validate-multi-agent.sh](validate-multi-agent.sh)
2. **Fazer Primeira Chamada**: Siga os passos 5.1-5.6 acima
3. **Monitorar Webhook**: Verifique logs em [vapi-webhook/index.ts](supabase/functions/vapi-webhook/index.ts)
4. **Implementar Features**: CSV upload, análise de chamadas, A/B testing
5. **Produção**: Deploy em ambiente prod com alertas e backups

---

**Última atualização**: 2026-04-30  
**Versão**: 1.0
