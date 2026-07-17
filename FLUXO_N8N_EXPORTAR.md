# 🎯 FLUXO N8N - PURO E SIMPLES

## Workflow 1: check_availability_calcom

```
┌─────────────────────────────────────────────────────┐
│ ENTRADA: POST /webhook/check-availability           │
│ {                                                   │
│   "callId": "call_123",                            │
│   "toolCallId": "tool_456",                        │
│   "arguments": { "date": "2026-05-01" },           │
│   "agentId": "agent_789"                           │
│ }                                                   │
└──────────────────────┬────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  [Webhook Trigger]          │
        │  Recebe POST                 │
        └──────────────┬───────────────┘
                       │
        ┌──────────────▼──────────────────────────────┐
        │  [HTTP GET Request]                         │
        │  URL: https://api.cal.com/v2/slots         │
        │  Auth: Bearer {{ $env.CAL_COM_API_KEY }}   │
        │  Query Params:                             │
        │  - start={{ date }}T00:00:00Z              │
        │  - end={{ date }}T23:59:59Z                │
        │  - timeZone=America/Sao_Paulo              │
        │  - username=cristopher-ramos...            │
        │  - eventTypeSlug=demo-app-academia         │
        └──────────────┬───────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │  Cal.com Response:               │
        │  {                               │
        │    data: {                       │
        │      "2026-05-01": [             │
        │        { time: "...14:00..." },  │
        │        { time: "...15:00..." }   │
        │      ]                           │
        │    }                             │
        │  }                               │
        └──────────────┬────────────────────┘
                       │
        ┌──────────────▼──────────────────────────────┐
        │  [Code Node: Process Slots]                 │
        │                                             │
        │  for each slot in response.data:            │
        │    extract time                            │
        │    format to Brazilian timezone (pt-BR)    │
        │    push to slots array                      │
        │                                             │
        │  Output: {                                  │
        │    text: "Horários: 14:00, 15:00..."       │
        │  }                                          │
        └──────────────┬──────────────────────────────┘
                       │
        ┌──────────────▼──────────────────────────────┐
        │  [HTTP POST: Callback]                      │
        │  URL: {{ $env.SUPABASE_URL }}/functions... │
        │       /v1/n8n-callback                      │
        │  Body: {                                    │
        │    callId: "call_123",                      │
        │    toolCallId: "tool_456",                  │
        │    functionName: "check_availability",     │
        │    result: "Horários: 14:00, 15:00...",    │
        │    agentId: "agent_789"                     │
        │  }                                          │
        └──────────────┬──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │  ✅ RESULTADO SALVO NO BANCO      │
        │  pending_tool_calls:             │
        │  - status: "completed"           │
        │  - result: { text: "..." }       │
        └──────────────────────────────────┘
```

---

## Workflow 2: book_appointment_calcom

```
┌──────────────────────────────────────────────────────┐
│ ENTRADA: POST /webhook/book-appointment              │
│ {                                                    │
│   "callId": "call_123",                             │
│   "toolCallId": "tool_456",                         │
│   "arguments": {                                     │
│     "datetime": "2026-05-01T14:00:00-03:00",       │
│     "name": "João Silva",                           │
│     "email": "joao@example.com"                     │
│   },                                                 │
│   "agentId": "agent_789"                            │
│ }                                                    │
└───────────────────┬────────────────────────────────┘
                    │
       ┌────────────▼────────────┐
       │  [Webhook Trigger]      │
       │  Recebe POST            │
       └────────────┬─────────────┘
                    │
       ┌────────────▼──────────────────────────────────┐
       │  [HTTP POST Request]                          │
       │  URL: https://api.cal.com/v2/bookings        │
       │  Auth: Bearer {{ $env.CAL_COM_API_KEY }}     │
       │  Body: {                                      │
       │    start: {{ datetime.toISOString() }},      │
       │    eventTypeSlug: "demo-app-academia",       │
       │    username: "cristopher-ramos...",          │
       │    attendee: {                                │
       │      name: "João Silva",                      │
       │      email: "joao@example.com",              │
       │      timeZone: "America/Sao_Paulo"           │
       │    }                                          │
       │  }                                            │
       └────────────┬───────────────────────────────────┘
                    │
                    ▼
       ┌────────────────────────────────┐
       │  Cal.com Response:             │
       │  {                             │
       │    data: {                     │
       │      id: "booking_123",        │
       │      status: "success"         │
       │    }                           │
       │  }                             │
       └────────────┬────────────────────┘
                    │
       ┌────────────▼──────────────────────────────────┐
       │  [Code Node: Process Response]                │
       │                                               │
       │  if response.data.id || response.id:          │
       │    Output: {                                  │
       │      text: "✅ Agendamento confirmado        │
       │            para 2026-05-01T14:00..."         │
       │    }                                          │
       │  else:                                        │
       │    Output: {                                  │
       │      text: "Erro ao agendar..."               │
       │    }                                          │
       └────────────┬───────────────────────────────────┘
                    │
       ┌────────────▼──────────────────────────────────┐
       │  [HTTP POST: Callback]                        │
       │  URL: {{ $env.SUPABASE_URL }}/functions...   │
       │       /v1/n8n-callback                        │
       │  Body: {                                      │
       │    callId: "call_123",                        │
       │    toolCallId: "tool_456",                    │
       │    functionName: "book_appointment",          │
       │    result: "✅ Agendamento confirmado...",   │
       │    agentId: "agent_789"                       │
       │  }                                            │
       └────────────┬───────────────────────────────────┘
                    │
                    ▼
       ┌────────────────────────────────┐
       │  ✅ RESULTADO SALVO NO BANCO    │
       │  pending_tool_calls:           │
       │  - status: "completed"         │
       │  - result: { text: "✅..." }   │
       └────────────────────────────────┘
```

---

## Timeline Completo

```
T=0ms       → VAPI dispara tool-calls
T=20ms      → Supabase retorna resposta rápida ✅ SEM TIMEOUT
T=100ms     → n8n webhook recebe POST
T=200ms     → Cal.com API inicia processamento
T=1200ms    → Cal.com responde com resultado
T=1300ms    → n8n envia callback
T=1350ms    → Resultado salvo no banco ✅

Cliente ouve: "Um momento..." e continua conversa normal!
```

---

## Estrutura dos JSONs

### n8n_check_availability_1.68.1.json
```json
{
  "name": "check_availability_calcom",
  "nodes": [
    {
      "id": "webhook_node",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "check-availability" }
    },
    {
      "id": "http_request_node",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.cal.com/v2/slots",
        "method": "GET",
        "headerParameters": { ... },
        "queryParameters": { ... }
      }
    },
    {
      "id": "code_node",
      "type": "n8n-nodes-base.code",
      "parameters": { "jsCode": "// Process slots..." }
    },
    {
      "id": "callback_node",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $env.SUPABASE_URL }}/functions/v1/n8n-callback",
        "method": "POST"
      }
    }
  ],
  "connections": {
    "Webhook": [["Fetch Cal.com Slots"]],
    "Fetch Cal.com Slots": [["Process Slots"]],
    "Process Slots": [["Callback Supabase"]]
  }
}
```

### n8n_book_appointment_1.68.1.json
```json
{
  "name": "book_appointment_calcom",
  "nodes": [
    {
      "id": "webhook_node",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "book-appointment" }
    },
    {
      "id": "http_request_node",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.cal.com/v2/bookings",
        "method": "POST",
        "bodyParameters": { ... }
      }
    },
    {
      "id": "code_node",
      "type": "n8n-nodes-base.code",
      "parameters": { "jsCode": "// Process booking..." }
    },
    {
      "id": "callback_node",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $env.SUPABASE_URL }}/functions/v1/n8n-callback",
        "method": "POST"
      }
    }
  ],
  "connections": {
    "Webhook": [["Create Cal.com Booking"]],
    "Create Cal.com Booking": [["Process Booking Response"]],
    "Process Booking Response": [["Callback Supabase"]]
  }
}
```

---

## Como Usar

1. **Abra n8n** → Menu → **Import workflow**
2. **Cole** `n8n_check_availability_1.68.1.json`
3. **Import**
4. **Repita** com `n8n_book_appointment_1.68.1.json`
5. **Configure** Environment Variables:
   - `CAL_COM_API_KEY=cal_live_xxxxx`
   - `SUPABASE_URL=https://seu-projeto.supabase.co`
6. **Deploy**
7. **Copiar URLs** dos webhooks gerados

```
✅ https://seu-n8n.com/webhook/check-availability
✅ https://seu-n8n.com/webhook/book-appointment
```

---

**Pronto para usar! Bora lá! 🚀**
