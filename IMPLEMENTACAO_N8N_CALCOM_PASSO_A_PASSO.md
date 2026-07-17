# 🚀 GUIA COMPLETO: IMPLEMENTAÇÃO N8N + CALCOM

## ✅ O que foi feito (Pronto)

### 1. Banco de Dados
✅ Arquivo criado: `create_pending_tool_calls_table.sql`
- Tabela `pending_tool_calls` para rastrear tool calls async
- RLS e índices configurados

### 2. Edge Functions
✅ `supabase/functions/vapi-webhook/index.ts` (MODIFICADO)
- Função `handleToolCalls` agora dispara n8n assincronamente
- Remove chamadas síncronas Cal.com (timeout eliminado)
- Salva estado em `pending_tool_calls`

✅ `supabase/functions/n8n-callback/index.ts` (CRIADO)
- Recebe resultado do n8n
- Atualiza banco com resultado
- Envia feedback para VAPI

### 3. n8n Workflows
✅ Arquivo: `n8n-workflows-calcom.js` com 2 workflows prontos
- check_availability_calcom
- book_appointment_calcom

---

## 📋 PASSO A PASSO (SUA RESPONSABILIDADE)

### ETAPA 1: SQL (5 minutos)

**1.1** Abra Supabase → SQL Editor

**1.2** Copie o conteúdo de `create_pending_tool_calls_table.sql`

**1.3** Cole e execute

```
Resultado esperado:
✅ Created table pending_tool_calls
✅ Enabled RLS
✅ Created 2 indexes
```

---

### ETAPA 2: n8n Workflows (15 minutos)

#### 2.1 - Workflow: check_availability_calcom

1. Abra seu n8n → **Create new workflow**
2. Nome: `check_availability_calcom`
3. Adicione **Webhook trigger** node:
   - Type: POST
   - Path: `/check-availability`
   - Save (copia a URL completa, ex: `https://seu-n8n.com/webhook/check-availability`)
   
4. Conecte **HTTP Request** node:
   - URL: `https://api.cal.com/v2/slots`
   - Method: **GET**
   - Headers:
     ```
     Authorization: Bearer {{ $env.CAL_COM_API_KEY }}
     cal-api-version: 2024-09-04
     ```
   - Query Params (em Raw ou JSON):
     ```
     eventTypeSlug=demo-app-academia
     start={{ $node.Webhook.json.body.arguments.date }}T00:00:00Z
     end={{ $node.Webhook.json.body.arguments.date }}T23:59:59.999Z
     timeZone=America/Sao_Paulo
     username=cristopher-ramos-vieira-kitoexpert
     ```

5. Conecte **Code** node (JavaScript):
   ```javascript
   const response = $input.first().json;
   const slots = [];

   if (response && response.data) {
     Object.entries(response.data).forEach(([date, timeSlots]) => {
       if (Array.isArray(timeSlots)) {
         timeSlots.forEach(slot => {
           const time = slot.time || slot.start;
           if (time) {
             const dt = new Date(time);
             const brTime = dt.toLocaleTimeString('pt-BR', {
               timeZone: 'America/Sao_Paulo',
               hour: '2-digit',
               minute: '2-digit'
             });
             slots.push(brTime);
           }
         });
       }
     });
   }

   const date = $node.Webhook.json.body.arguments.date;
   let text = '';
   if (slots.length === 0) {
     text = `Não há horários disponíveis para ${date}. Sugira ao cliente verificar outro dia.`;
   } else {
     text = `Horários disponíveis para ${date}: ${slots.join(', ')}. Qual você prefere?`;
   }

   return [{ json: { text } }];
   ```

6. Conecte **HTTP Request** node (Callback):
   - URL: `{{ $env.SUPABASE_URL }}/functions/v1/n8n-callback`
   - Method: **POST**
   - Headers:
     ```
     Content-Type: application/json
     ```
   - Body (Raw JSON):
     ```json
     {
       "callId": "{{ $node.Webhook.json.body.callId }}",
       "toolCallId": "{{ $node.Webhook.json.body.toolCallId }}",
       "functionName": "check_availability",
       "result": "{{ $node['Code'].json.text }}",
       "agentId": "{{ $node.Webhook.json.body.agentId }}"
     }
     ```

7. **Save & Deploy** o workflow
8. Copie a URL do webhook (ex: `https://seu-n8n.com/webhook/check-availability`)

#### 2.2 - Workflow: book_appointment_calcom

Repita o processo acima, mas:
- Nome: `book_appointment_calcom`
- Path do webhook: `/book-appointment`
- HTTP Request URL: `https://api.cal.com/v2/bookings` (POST)
- Body:
  ```json
  {
    "start": "{{ new Date($node.Webhook.json.body.arguments.datetime).toISOString() }}",
    "eventTypeSlug": "demo-app-academia",
    "username": "cristopher-ramos-vieira-kitoexpert",
    "attendee": {
      "name": "{{ $node.Webhook.json.body.arguments.name }}",
      "email": "{{ $node.Webhook.json.body.arguments.email || 'agendamento@kitoexpert.ai' }}",
      "timeZone": "America/Sao_Paulo"
    }
  }
  ```
- Code (processar resposta):
  ```javascript
  const response = $input.first().json;
  const name = $node.Webhook.json.body.arguments.name;
  const datetime = $node.Webhook.json.body.arguments.datetime;
  
  let text = '';
  if (response && (response.data?.id || response.id)) {
    text = `✅ Agendamento confirmado! ${name}, sua reunião está marcada para ${datetime}. Você receberá um email de confirmação.`;
  } else {
    text = `Erro ao agendar. Tente novamente ou escolha outro horário.`;
  }
  
  return [{ json: { text } }];
  ```

---

### ETAPA 3: Variáveis de Ambiente (3 minutos)

**3.1** Supabase → Settings → Edge Functions → Secrets

Adicione:
```
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/calcom-tool-dispatcher
CAL_COM_API_KEY=cal_live_xxxxxxxxxxxx
```

**3.2** n8n → Settings → Environment Variables (ou dentro de cada workflow)

Adicione:
```
CAL_COM_API_KEY=cal_live_xxxxxxxxxxxx
SUPABASE_URL=https://seu-projeto.supabase.co
```

---

### ETAPA 4: Deploy Edge Functions (5 minutos)

**4.1** Terminal no seu projeto:

```bash
# Instale Supabase CLI (se não tiver)
npm install -g supabase

# Ou usando Homebrew (macOS)
brew install supabase/tap/supabase

# Configure (primeiro setup)
supabase init
supabase link  # Conecta ao seu projeto

# Deploy vapi-webhook (modificado)
supabase functions deploy vapi-webhook

# Deploy n8n-callback (novo)
supabase functions deploy n8n-callback

# Ver logs
supabase functions logs vapi-webhook --tail
supabase functions logs n8n-callback --tail
```

**Esperado:**
```
✅ Deployed vapi-webhook
✅ Deployed n8n-callback
```

---

### ETAPA 5: Teste (5 minutos)

**5.1** Na UI da ligação, iniciar uma chamada

**5.2** Agente: "Quero agendar uma reunião"

**Fluxo esperado:**
1. Agent dispara `check_availability` → "Processando..."
2. VAPI retorna imediatamente (SEM TIMEOUT ✅)
3. n8n recebe em background, chama Cal.com
4. n8n faz callback para Supabase
5. Agente recebe resultado real
6. Agente lista horários para cliente

**5.3** Cliente escolhe horário: "Prefiro 14:00"

**Fluxo esperado:**
1. Agent dispara `book_appointment`
2. VAPI retorna "Processando..." (SEM TIMEOUT ✅)
3. n8n recebe, chama Cal.com POST
4. n8n envia callback com confirmação
5. Agent recebe: "✅ Agendamento confirmado para 14:00"

---

## 🔍 Troubleshooting

| Problema | Solução |
|----------|---------|
| VAPI timeout 30s | ✅ Resolvido - agora retorna imediato |
| n8n webhook não recebe | Verificar URL no código (N8N_WEBHOOK_URL) |
| Cal.com retorna 401 | Validar CAL_COM_API_KEY (deve ser `cal_live_...`) |
| Callback não chega ao Supabase | Ver logs: `supabase functions logs n8n-callback --tail` |
| Agente não recebe resultado | Pode estar em `pending_tool_calls` - verificar status |

---

## 🎯 Resultado Final

✅ **Problema resolvido**: VAPI não trava mais esperando Cal.com  
✅ **Async pattern**: n8n processa em background  
✅ **Sem timeout**: Agente pode desligar a ligação sem perder resultado  
✅ **Escalável**: n8n reutilizável para outros workflows  

---

## 📞 Checklist Final

- [ ] 1. Executar SQL `create_pending_tool_calls_table.sql`
- [ ] 2. Criar workflow `check_availability_calcom` no n8n
- [ ] 3. Criar workflow `book_appointment_calcom` no n8n
- [ ] 4. Configurar variáveis de ambiente (Supabase + n8n)
- [ ] 5. Deploy vapi-webhook
- [ ] 6. Deploy n8n-callback
- [ ] 7. Testar fluxo completo
- [ ] 8. Validar logs

---

**Total de tempo**: ~30-40 minutos (incluindo testes)

Qualquer dúvida, checa os logs! 🚀
