# 📥 IMPORTAR N8N 1.68.1 - MODO FÁCIL

## 2 Arquivos JSON Prontos Para Exportar

- `n8n_check_availability_1.68.1.json` ← Workflow 1
- `n8n_book_appointment_1.68.1.json` ← Workflow 2

---

## 🚀 PASSO 1: Importar check_availability_calcom

### Opção A: Via UI n8n (Recomendado)

1. **Abra seu n8n** → https://seu-n8n.com
2. **Menu → Import workflow**
3. **Cole o arquivo** `n8n_check_availability_1.68.1.json`
4. **Import**
5. **Webhook automático**: O n8n vai gerar a URL webhook
   - Copie: `https://seu-n8n.com/webhook/check-availability`

### Opção B: Via Terminal (Advanced)

```bash
# Se tiver CLI n8n
n8n import:workflow --input=n8n_check_availability_1.68.1.json
```

---

## 🚀 PASSO 2: Importar book_appointment_calcom

Mesmo processo:
1. **Menu → Import workflow**
2. **Cole** `n8n_book_appointment_1.68.1.json`
3. **Import**
4. **Webhook**: `https://seu-n8n.com/webhook/book-appointment`

---

## ⚙️ PASSO 3: Configurar Environment Variables no n8n

### No painel do n8n (Settings → Environment Variables):

```
CAL_COM_API_KEY=cal_live_xxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://seu-projeto.supabase.co
```

Ou **dentro de cada workflow**:
- Clique no node HTTP Request
- Variables → Adicione CAL_COM_API_KEY e SUPABASE_URL

---

## ✅ PASSO 4: Ativar e Testar

### check_availability_calcom

1. **Abra o workflow**
2. **Execute (Play button)** na interface
3. **Teste com curl**:

```bash
curl -X POST https://seu-n8n.com/webhook/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test_call_123",
    "toolCallId": "test_tool_456",
    "functionName": "check_availability",
    "arguments": {
      "date": "2026-05-01"
    },
    "agentId": "test_agent_789"
  }'
```

**Esperado:**
```json
{
  "text": "Horários disponíveis para 2026-05-01: 14:00, 15:00, 16:00. Qual você prefere?"
}
```

### book_appointment_calcom

```bash
curl -X POST https://seu-n8n.com/webhook/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test_call_123",
    "toolCallId": "test_tool_456",
    "functionName": "book_appointment",
    "arguments": {
      "datetime": "2026-05-01T14:00:00-03:00",
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "agentId": "test_agent_789"
  }'
```

**Esperado:**
```json
{
  "text": "✅ Agendamento confirmado! João Silva, sua reunião está marcada para 2026-05-01T14:00:00-03:00. Você receberá um email de confirmação."
}
```

---

## 🔗 URLS DO N8N

Após criar os workflows, o n8n gera automaticamente:

```
Webhook 1 (check_availability):
https://seu-n8n.com/webhook/check-availability

Webhook 2 (book_appointment):
https://seu-n8n.com/webhook/book-appointment
```

**Você vai precisar dessas URLs em:**
- `vapi-webhook` (arquivo TypeScript) → Variável `N8N_WEBHOOK_URL`
- `Supabase Secrets` → `N8N_WEBHOOK_URL`

---

## 🎯 Diagrama dos Workflows

### Workflow 1: check_availability_calcom
```
[Webhook] → [HTTP GET Cal.com] → [Code Process] → [HTTP POST Callback]
```

### Workflow 2: book_appointment_calcom
```
[Webhook] → [HTTP POST Cal.com] → [Code Process] → [HTTP POST Callback]
```

---

## 🔧 Nodes em Cada Workflow

### check_availability_calcom

| Node | Tipo | Função |
|------|------|--------|
| Webhook | Trigger | Recebe POST do Supabase vapi-webhook |
| Fetch Cal.com Slots | HTTP Request | GET /slots com data do cliente |
| Process Slots | Code | Extrai horários e formata resposta |
| Callback Supabase | HTTP Request | POST resultado para n8n-callback |

### book_appointment_calcom

| Node | Tipo | Função |
|------|------|--------|
| Webhook | Trigger | Recebe POST do Supabase vapi-webhook |
| Create Cal.com Booking | HTTP Request | POST /bookings com dados da reunião |
| Process Booking Response | Code | Valida resposta e formata confirmação |
| Callback Supabase | HTTP Request | POST resultado para n8n-callback |

---

## 🐛 Troubleshooting

### Webhook não recebe request

```bash
# Ver logs do n8n
docker logs n8n-container

# Ou via UI: Monitor → Workflow executions
```

### Cal.com retorna 401

```
❌ Erro: CAL_COM_API_KEY não configurada ou inválida
✅ Solução: 
  - Ir em Settings → Environment Variables
  - Adicionar: CAL_COM_API_KEY=cal_live_xxxxx
  - Redeploy workflow
```

### Callback não atualiza BD

```
❌ Erro: SUPABASE_URL não configurada
✅ Solução:
  - Adicionar em Environment Variables: SUPABASE_URL=https://seu-projeto.supabase.co
  - Verificar logs da função n8n-callback: supabase functions logs n8n-callback --tail
```

### Node "Process Slots" retorna erro

```
❌ Erro: response.data vazio
✅ Solução:
  - Verificar resposta do Cal.com (clique no node → Teste)
  - Pode ser formato diferente (response.slots em vez de response.data)
  - Ajuste o Code node conforme resposta do Cal.com
```

---

## ✅ Checklist

- [ ] Importou `n8n_check_availability_1.68.1.json`
- [ ] Importou `n8n_book_appointment_1.68.1.json`
- [ ] Configurou `CAL_COM_API_KEY` em Environment Variables
- [ ] Configurou `SUPABASE_URL` em Environment Variables
- [ ] Testou webhook com curl (check_availability)
- [ ] Testou webhook com curl (book_appointment)
- [ ] Copiar URLs dos webhooks para variável `N8N_WEBHOOK_URL` no Supabase
- [ ] Deploy das Edge Functions (vapi-webhook, n8n-callback)
- [ ] Testar fluxo completo (agente fazendo ligação)

---

## 📋 Arquivo Summary

```
✅ n8n_check_availability_1.68.1.json
   - 4 nodes (Webhook, HTTP GET, Code, HTTP POST)
   - Compatível com n8n 1.68.1+
   - Pronto para importar e usar

✅ n8n_book_appointment_1.68.1.json
   - 4 nodes (Webhook, HTTP POST, Code, HTTP POST)
   - Compatível com n8n 1.68.1+
   - Pronto para importar e usar
```

---

**Tempo total de setup**: 10-15 minutos

Bora lá! 🚀
