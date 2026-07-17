#!/bin/bash
# TESTE RÁPIDO DOS WORKFLOWS N8N

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TESTE N8N 1.68.1 - check_availability + book_appointment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Perguntar URLs
read -p "URL do n8n (ex: https://seu-n8n.com): " N8N_URL

# URLs dos webhooks
WEBHOOK_CHECK="${N8N_URL}/webhook/check-availability"
WEBHOOK_BOOK="${N8N_URL}/webhook/book-appointment"

echo -e "\n${YELLOW}Webhooks encontrados:${NC}"
echo "Check: $WEBHOOK_CHECK"
echo "Book: $WEBHOOK_BOOK"

# Teste 1: check_availability
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}TESTE 1: check_availability_calcom${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Enviando requisição...${NC}"
curl -X POST "$WEBHOOK_CHECK" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test_call_'$(date +%s)'",
    "toolCallId": "test_tool_'$(date +%s)'",
    "functionName": "check_availability",
    "arguments": {
      "date": "2026-05-01"
    },
    "agentId": "test_agent_'$(date +%s)'"
  }' | jq '.'

echo -e "\n${GREEN}✅ Resposta esperada: Horários disponíveis para 2026-05-01${NC}\n"

# Teste 2: book_appointment
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}TESTE 2: book_appointment_calcom${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Enviando requisição...${NC}"
curl -X POST "$WEBHOOK_BOOK" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test_call_'$(date +%s)'",
    "toolCallId": "test_tool_'$(date +%s)'",
    "functionName": "book_appointment",
    "arguments": {
      "datetime": "2026-05-01T14:00:00-03:00",
      "name": "Teste Bot",
      "email": "teste@kitoexpert.ai"
    },
    "agentId": "test_agent_'$(date +%s)'"
  }' | jq '.'

echo -e "\n${GREEN}✅ Resposta esperada: Agendamento confirmado${NC}\n"

# Teste 3: Verificar n8n-callback
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}TESTE 3: Verificar banco (pending_tool_calls)${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

read -p "Supabase URL (ex: https://seu-projeto.supabase.co): " SUPABASE_URL
read -p "Service Role Key (anon key): " SERVICE_ROLE_KEY

echo -e "\n${YELLOW}Consultando pending_tool_calls...${NC}"
curl -X GET "${SUPABASE_URL}/rest/v1/pending_tool_calls?limit=5" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | jq '.[] | {tool_name, status, result}'

echo -e "\n${GREEN}✅ Teste completo!${NC}\n"
