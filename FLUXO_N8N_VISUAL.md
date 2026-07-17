# 🔄 FLUXO N8N + VAPI + CAL.COM (Async Pattern)

## Diagrama Completo

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CLIENTE LIGAÇÃO + AGENTE VAPI                               │
└──────────────────────────────────────────────────────┬──────────────────────────────┘
                                                       │
                                                       ▼
                    ┌──────────────────────────────────────────────┐
                    │  Cliente: "Quero agendar uma reunião"       │
                    │  VAPI Agent dispara: check_availability()   │
                    └──────────────────────────┬───────────────────┘
                                               │
                                               ▼ (tool-calls event)
                ┌──────────────────────────────────────────────────────────────┐
                │            SUPABASE EDGE FUNCTION: vapi-webhook              │
                │                    (RÁPIDO: <100ms)                          │
                │                                                              │
                │  1. Recebe tool-calls do VAPI                               │
                │  2. Salva em pending_tool_calls (status: pending)           │
                │  3. Dispara n8n ASSINCRONAMENTE (fire-and-forget)          │
                │  4. Retorna ao VAPI IMEDIATAMENTE:                         │
                │     "Verificando horários. Um momento..."                   │
                │  5. SEM ESPERAR RESPOSTA CAL.COM ✅                        │
                └──────────────────────────┬───────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼ (HTTP POST)                              ▼ (Resposta imediata)
     ┌──────────────────────────────────┐       ┌─────────────────────────────────┐
     │      N8N WEBHOOK DISPATCHER      │       │   VAPI RECEBE RESPOSTA RÁPIDA   │
     │                                  │       │  "Processando... Um momento"    │
     │  Payload:                        │       │                                 │
     │  {                               │       │  ✅ SEM TIMEOUT!                │
     │    callId,                       │       │  ✅ Agent continua falando      │
     │    toolCallId,                   │       │  ✅ Cliente ouve resposta       │
     │    functionName,                 │       │                                 │
     │    arguments,                    │       │  Enquanto isso, n8n trabalha... │
     │    agentId                       │       └──────────────────────────────────┘
     │  }                               │
     └──────────────────┬───────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
   ┌─────────────────┐          ┌──────────────────┐
   │  check_         │          │  book_           │
   │  availability   │          │  appointment     │
   │  _calcom        │          │  _calcom         │
   │  workflow       │          │  workflow        │
   └────────┬────────┘          └────────┬─────────┘
            │                            │
            ▼ (async, sem timeout)      ▼ (async, sem timeout)
   ┌─────────────────────────────┐    ┌──────────────────────┐
   │ N8N WORKFLOW 1              │    │ N8N WORKFLOW 2       │
   │ check_availability_calcom   │    │ book_appointment     │
   │                             │    │                      │
   │ 1. Recebe webhook POST      │    │ 1. Recebe webhook    │
   │ 2. Faz GET Cal.com /slots   │    │ 2. Faz POST Cal.com  │
   │    com data do cliente      │    │    /bookings         │
   │ 3. Processa resposta        │    │ 3. Processa resposta │
   │    (filtra horários)        │    │ (confirmação)        │
   │ 4. Envia callback POST      │    │ 4. Envia callback    │
   │    para n8n-callback        │    │    para n8n-callback │
   │                             │    │                      │
   │ Tempo: ~2-3 segundos        │    │ Tempo: ~2-3 segundos │
   └────────────┬────────────────┘    └──────────┬───────────┘
                │                                  │
                └──────────────┬───────────────────┘
                               │
                               ▼ (HTTP POST com resultado)
        ┌──────────────────────────────────────────────────────┐
        │    SUPABASE EDGE FUNCTION: n8n-callback              │
        │                                                      │
        │  1. Recebe resultado do n8n (slots ou confirmação)   │
        │  2. Atualiza pending_tool_calls:                    │
        │     - status: completed                             │
        │     - result: {"text": "Horários: 14:00, 15:00..."} │
        │  3. Tenta enviar feedback para VAPI (optional)      │
        │  4. Retorna sucesso ao n8n                          │
        └──────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
            ┌──────────────────────────────────────────┐
            │   BANCO: pending_tool_calls               │
            │   {                                      │
            │     call_id: "vapi_call_123",            │
            │     tool_call_id: "tool_456",            │
            │     status: "completed",                 │
            │     result: {                            │
            │       text: "Horários: 14:00, 15:00..." │
            │     }                                    │
            │   }                                      │
            └──────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼ (Próximo webhook VAPI)     ▼ (se VAPI suportar PUT /tool-result)
        ┌───────────────────────────────────┐   ┌───────────────────┐
        │  Agent consulta banco ou recebe    │   │ VAPI feedback     │
        │  callback de função                │   │ direto (tentado)  │
        │                                    │   │                   │
        │  "Horários: 14:00, 15:00 amanhã"  │   │ (pode falhar,     │
        │                                    │   │  sem problema)    │
        │  Cliente escolhe: "14:00"          │   │                   │
        │                                    │   │                   │
        │  → Agent dispara book_appointment  │   │                   │
        │  → Loop volta para step 2 (POST)   │   │                   │
        └───────────────────────────────────┘   └───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────┐
        │ "✅ Agendamento confirmado para    │
        │  14:00. Email de confirmação..."   │
        │                                    │
        │ Cliente: "Ótimo, obrigado!"        │
        │ Ligação encerra normalmente ✅     │
        └───────────────────────────────────┘
```

---

## 🔑 Fluxo Detalhado: check_availability

```
VAPI WEBHOOK (vapi-webhook)
│
├─ message.type = "tool-calls"
├─ toolCall.function.name = "check_availability"
├─ arguments.date = "2026-05-01"
├─ callId = "call_123"
├─ toolCallId = "tool_456"
├─ agentId = "agent_789"
│
├─ Salva em pending_tool_calls:
│  {
│    call_id: "call_123",
│    tool_call_id: "tool_456",
│    agent_id: "agent_789",
│    tool_name: "check_availability",
│    input_data: { date: "2026-05-01" },
│    status: "pending"
│  }
│
├─ Dispara N8N (async, não aguarda):
│  POST https://seu-n8n.com/webhook/check-availability
│  Body: {
│    callId: "call_123",
│    toolCallId: "tool_456",
│    functionName: "check_availability",
│    arguments: { date: "2026-05-01" },
│    agentId: "agent_789"
│  }
│
├─ Retorna ao VAPI IMEDIATAMENTE:
│  {
│    results: [{
│      toolCallId: "tool_456",
│      result: "Verificando horários. Um momento..."
│    }]
│  }
│
└─ [VAPI Webhook completo ✅]


N8N WORKFLOW (check_availability_calcom)
│
├─ Webhook recebe POST
├─ HTTP GET Cal.com /v2/slots
│  Headers:
│    Authorization: Bearer cal_live_xxxxx
│    cal-api-version: 2024-09-04
│  Query:
│    start=2026-05-01T00:00:00Z
│    end=2026-05-01T23:59:59Z
│    timeZone=America/Sao_Paulo
│    username=cristopher-ramos-vieira-kitoexpert
│    eventTypeSlug=demo-app-academia
│
├─ Response Cal.com:
│  {
│    data: {
│      "2026-05-01": [
│        { time: "2026-05-01T14:00:00Z" },
│        { time: "2026-05-01T15:00:00Z" },
│        { time: "2026-05-01T16:00:00Z" }
│      ]
│    }
│  }
│
├─ Code Node: Processa slots
│  Extrai horários → "14:00, 15:00, 16:00"
│  Text: "Horários disponíveis para 2026-05-01: 14:00, 15:00, 16:00. Qual você prefere?"
│
├─ HTTP POST Callback:
│  URL: https://seu-supabase.co/functions/v1/n8n-callback
│  Body: {
│    callId: "call_123",
│    toolCallId: "tool_456",
│    functionName: "check_availability",
│    result: "Horários disponíveis para 2026-05-01: 14:00, 15:00, 16:00. Qual você prefere?",
│    agentId: "agent_789"
│  }
│
└─ [N8N Workflow completo ✅]


N8N CALLBACK (n8n-callback)
│
├─ Recebe POST com resultado
├─ Atualiza pending_tool_calls:
│  UPDATE pending_tool_calls
│  SET result = { text: "Horários: 14:00..." },
│      status = "completed"
│  WHERE call_id = "call_123"
│        AND tool_call_id = "tool_456"
│
├─ Tenta feedback VAPI (PUT /call/call_123/tool-call-result):
│  result: "Horários: 14:00, 15:00, 16:00. Qual você prefere?"
│  (pode falhar, sem problema - resultado está no banco)
│
├─ Retorna sucesso:
│  {
│    success: true,
│    message: "Callback processado com sucesso",
│    callId: "call_123",
│    toolCallId: "tool_456"
│  }
│
└─ [Callback completo ✅]
```

---

## ⏱️ Timeline (Sem Timeout!)

```
T=0ms    : VAPI envia tool-calls para webhook
T=10ms   : Supabase salva em pending_tool_calls
T=20ms   : Supabase retorna resposta ao VAPI
           ✅ VAPI recebe "Processando..." rapidinho
T=25ms   : VAPI envia mensagem ao agente
T=100ms  : n8n webhook recebe dispatcher POST
T=200ms  : n8n faz GET Cal.com API
T=1200ms : Cal.com responde com slots
T=1300ms : n8n processa e faz callback POST
T=1350ms : Supabase n8n-callback recebe e atualiza
T=1400ms : Callback completo ✅

Total: ~1.4 segundos em background
VAPI: Retornou em 20ms (SEM TIMEOUT!) ✅
```

---

## 📊 Comparação: Antes vs Depois

### ❌ ANTES (Síncrono - TIMEOUT)
```
VAPI tool-calls → vapi-webhook
                   ├─ Chama Cal.com API (2s)
                   ├─ Processa slots (0.5s)
                   └─ Retorna resposta
Total: 2.5s
Problema: Se > 30s, VAPI timeout! ❌
```

### ✅ DEPOIS (Assíncrono - n8n)
```
VAPI tool-calls → vapi-webhook
                   ├─ Salva estado (10ms)
                   ├─ Dispara n8n (fire-and-forget)
                   └─ Retorna "Processando..."
Total: 20ms
Resultado: Em background via n8n (1-3s depois)
Timeout: ELIMINADO! ✅
Agente: Continua falando normalmente ✅
```

---

## 🔐 Fluxo de Segurança

```
VAPI Webhook
  ├─ ✅ Service Role Key (Supabase)
  ├─ ✅ Validação de autenticação
  └─ ✅ Isolamento por user_id (pending_tool_calls)

n8n Webhook
  ├─ ✅ Post público (aberto para dispatcher VAPI)
  ├─ ⚠️ Idealmente: Validar callId/toolCallId antes de processar
  └─ ⚠️ Rate limit: Configurar em n8n para evitar abuse

n8n Callback
  ├─ ✅ Valida callId + toolCallId
  ├─ ✅ Apenas atualiza own record (pending_tool_calls)
  └─ ✅ Service Role Key protege dados
```

---

## 🎯 Benefícios da Arquitetura n8n

1. **SEM TIMEOUT** - n8n trabalha independente de VAPI
2. **ESCALÁVEL** - Fácil adicionar novos workflows
3. **CONFIÁVEL** - n8n tem retry built-in
4. **OBSERVÁVEL** - Logs detalhados em n8n + Supabase
5. **FLEXÍVEL** - Mude Cal.com sem alterar VAPI
6. **ASSÍNCRONO** - Agente não trava esperando resposta

---

## 📝 Checklist de Funcionamento

- [ ] Agente inicia ligação
- [ ] Cliente: "Quero agendar"
- [ ] VAPI dispara check_availability
- [ ] **Supabase retorna <100ms** ✅
- [ ] Agente diz "Um momento..."
- [ ] **n8n processa em background**
- [ ] Cal.com responde com slots
- [ ] Resultado salvo em BD
- [ ] Agente recebe resultado (método: polling ou callback)
- [ ] Cliente escolhe horário
- [ ] VAPI dispara book_appointment
- [ ] **Supabase retorna <100ms** ✅
- [ ] n8n agenda reunião
- [ ] Agente confirma: "Agendado!"
- [ ] ✅ Fluxo completo sem timeout!
