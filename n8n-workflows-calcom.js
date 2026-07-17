/**
 * N8N WORKFLOWS - CALCOM INTEGRATION
 * 
 * Dois workflows para Cal.com:
 * 1. check_availability_calcom - Consultar horários disponíveis
 * 2. book_appointment_calcom - Agendar reunião
 * 
 * INSTRUÇÕES:
 * 1. No n8n, criar novo workflow
 * 2. Copiar o JSON correspondente
 * 3. Ctrl+Shift+V para colar como workflow JSON
 * 4. Configurar a URL de webhook (sua instância do n8n)
 * 5. Configurar variables de ambiente: CAL_COM_API_KEY, SUPABASE_URL
 * 6. Deploy/ativar workflow
 */

// ============================================================
// WORKFLOW 1: check_availability_calcom
// ============================================================

{
  "name": "check_availability_calcom",
  "description": "Consulta Cal.com por horários disponíveis para uma data específica",
  "nodes": [
    {
      "parameters": {},
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "check-availability",
      "id": "webhook_node"
    },
    {
      "parameters": {
        "url": "https://api.cal.com/v2/slots",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer {{ $env.CAL_COM_API_KEY }}",
          "cal-api-version": "2024-09-04"
        },
        "queryParameters": "eventTypeSlug=demo-app-academia&start={{ $node.Webhook.json.body.arguments.date }}T00:00:00Z&end={{ $node.Webhook.json.body.arguments.date }}T23:59:59.999Z&timeZone=America/Sao_Paulo&username=cristopher-ramos-vieira-kitoexpert"
      },
      "name": "Fetch Cal.com Slots",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [500, 300]
    },
    {
      "parameters": {
        "jsCode": "// Extrair slots disponíveis de Cal.com\nconst response = $input.first().json;\nconst slots = [];\n\nif (response && response.data) {\n  Object.entries(response.data).forEach(([date, timeSlots]) => {\n    if (Array.isArray(timeSlots)) {\n      timeSlots.forEach(slot => {\n        const time = slot.time || slot.start;\n        if (time) {\n          const dt = new Date(time);\n          const brTime = dt.toLocaleTimeString('pt-BR', {\n            timeZone: 'America/Sao_Paulo',\n            hour: '2-digit',\n            minute: '2-digit'\n          });\n          slots.push(brTime);\n        }\n      });\n    }\n  });\n}\n\nconst date = $node.Webhook.json.body.arguments.date;\nlet text = '';\nif (slots.length === 0) {\n  text = `Não há horários disponíveis para ${date}. Sugira ao cliente verificar outro dia.`;\n} else {\n  text = `Horários disponíveis para ${date}: ${slots.join(', ')}. Qual você prefere?`;\n}\n\nreturn [{ json: { text, slots } }];"
      },
      "name": "Process Slots",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [750, 300]
    },
    {
      "parameters": {
        "url": "{{ $env.SUPABASE_URL }}/functions/v1/n8n-callback",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": "{{ JSON.stringify({ callId: $node.Webhook.json.body.callId, toolCallId: $node.Webhook.json.body.toolCallId, functionName: 'check_availability', result: $node['Process Slots'].json.text, agentId: $node.Webhook.json.body.agentId }) }}"
      },
      "name": "Callback Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1000, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Fetch Cal.com Slots", "branch": 0, "index": 0 }]]
    },
    "Fetch Cal.com Slots": {
      "main": [[{ "node": "Process Slots", "branch": 0, "index": 0 }]]
    },
    "Process Slots": {
      "main": [[{ "node": "Callback Supabase", "branch": 0, "index": 0 }]]
    }
  },
  "pinData": {}
}

// ============================================================
// WORKFLOW 2: book_appointment_calcom
// ============================================================

{
  "name": "book_appointment_calcom",
  "description": "Agenda uma reunião no Cal.com",
  "nodes": [
    {
      "parameters": {},
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "book-appointment",
      "id": "webhook_node"
    },
    {
      "parameters": {
        "url": "https://api.cal.com/v2/bookings",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ $env.CAL_COM_API_KEY }}",
          "cal-api-version": "2024-09-04",
          "Content-Type": "application/json"
        },
        "body": "{{ JSON.stringify({ start: new Date($node.Webhook.json.body.arguments.datetime).toISOString(), eventTypeSlug: 'demo-app-academia', username: 'cristopher-ramos-vieira-kitoexpert', attendee: { name: $node.Webhook.json.body.arguments.name, email: $node.Webhook.json.body.arguments.email || 'agendamento@kitoexpert.ai', timeZone: 'America/Sao_Paulo' } }) }}"
      },
      "name": "Create Cal.com Booking",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [500, 300]
    },
    {
      "parameters": {
        "jsCode": "const response = $input.first().json;\nconst name = $node.Webhook.json.body.arguments.name;\nconst datetime = $node.Webhook.json.body.arguments.datetime;\n\nlet text = '';\nif (response && (response.data?.id || response.id)) {\n  text = `✅ Agendamento confirmado! ${name}, sua reunião está marcada para ${datetime}. Você receberá um email de confirmação.`;\n} else {\n  text = `Erro ao agendar. Tente novamente ou escolha outro horário.`;\n}\n\nreturn [{ json: { text } }];"
      },
      "name": "Process Booking Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [750, 300]
    },
    {
      "parameters": {
        "url": "{{ $env.SUPABASE_URL }}/functions/v1/n8n-callback",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": "{{ JSON.stringify({ callId: $node.Webhook.json.body.callId, toolCallId: $node.Webhook.json.body.toolCallId, functionName: 'book_appointment', result: $node['Process Booking Response'].json.text, agentId: $node.Webhook.json.body.agentId }) }}"
      },
      "name": "Callback Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1000, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Create Cal.com Booking", "branch": 0, "index": 0 }]]
    },
    "Create Cal.com Booking": {
      "main": [[{ "node": "Process Booking Response", "branch": 0, "index": 0 }]]
    },
    "Process Booking Response": {
      "main": [[{ "node": "Callback Supabase", "branch": 0, "index": 0 }]]
    }
  },
  "pinData": {}
}
