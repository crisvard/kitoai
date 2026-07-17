#!/bin/bash

# Script de Validação do Sistema Multi-Agente
# Execute este script para verificar se tudo está configurado corretamente

echo "🚀 Iniciando validação do Sistema Multi-Agente..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    fi
}

# 1. Check Supabase CLI
echo "📦 Verificando dependências..."
if command_exists supabase; then
    print_result 0 "Supabase CLI instalado"
else
    print_result 1 "Supabase CLI não encontrado"
    echo "   Instale com: npm install -g supabase"
fi

# 2. Check if project is linked
if [ -f ".supabase/config.toml" ]; then
    print_result 0 "Projeto Supabase linkado"
else
    print_result 1 "Projeto não está linkado"
    echo "   Execute: supabase link --project-ref SEU_PROJECT_REF"
fi

echo ""
echo "🗄️  Verificando banco de dados..."

# 3. Check if tables exist
TABLES=(
    "user_agents"
    "agent_contacts"
    "agent_call_history"
    "agent_daily_stats"
)

for table in "${TABLES[@]}"; do
    RESULT=$(supabase db execute "SELECT to_regclass('public.$table')::text" 2>/dev/null | grep -c "$table")
    if [ "$RESULT" -eq 1 ]; then
        print_result 0 "Tabela $table existe"
    else
        print_result 1 "Tabela $table não encontrada"
        echo "   Execute: add_multi_agent_system.sql"
    fi
done

echo ""
echo "🔧 Verificando Edge Functions..."

# 4. Check if functions are deployed
FUNCTIONS=(
    "create-vapi-agent"
    "update-vapi-agent"
    "delete-vapi-agent"
    "start-agent-calls"
    "stop-agent-calls"
    "vapi-webhook"
)

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        print_result 0 "Function $func definida"
    else
        print_result 1 "Function $func não encontrada"
    fi
done

echo ""
echo "🔐 Verificando secrets..."

# 5. Check secrets (this needs to be done via API)
SECRETS=$(supabase secrets list 2>/dev/null)
if echo "$SECRETS" | grep -q "VAPI_API_KEY"; then
    print_result 0 "VAPI_API_KEY configurada"
else
    print_result 1 "VAPI_API_KEY não configurada"
    echo "   Execute: supabase secrets set VAPI_API_KEY=sua_chave"
fi

echo ""
echo "📁 Verificando arquivos do frontend..."

# 6. Check frontend files
FRONTEND_FILES=(
    "src/components/dialer/TelemarketingDesk.tsx"
    "src/components/dialer/AgentCard.tsx"
    "src/components/dialer/CreateAgentModal.tsx"
    "src/components/dialer/ConfigureAgentModal.tsx"
    "src/hooks/useAgents.ts"
    "src/pages/DialerPage.tsx"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_result 0 "Arquivo $file existe"
    else
        print_result 1 "Arquivo $file não encontrado"
    fi
done

echo ""
echo "📖 Verificando documentação..."

# 7. Check documentation files
DOCS=(
    "add_multi_agent_system.sql"
    "MULTI_AGENT_ARCHITECTURE.md"
    "EDGE_FUNCTIONS_CONFIG.md"
    "CHECKLIST_IMPLEMENTACAO.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        print_result 0 "Documentação $doc existe"
    else
        print_result 1 "Documentação $doc não encontrada"
    fi
done

echo ""
echo "🧪 Testes de conectividade..."

# 8. Test Supabase connection (basic ping)
# Note: This requires SUPABASE_URL to be set
if [ -n "$SUPABASE_URL" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/")
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 401 ]; then
        print_result 0 "Conexão com Supabase OK"
    else
        print_result 1 "Erro de conexão com Supabase (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "SUPABASE_URL não definida"
    echo "   Configure no .env ou export SUPABASE_URL=https://seu-projeto.supabase.co"
fi

echo ""
echo "=================================="
echo "📊 Resumo da Validação"
echo "=================================="
echo -e "Aprovados: ${GREEN}$PASSED${NC}"
echo -e "Falhados:  ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
    echo "   O sistema está pronto para uso."
    echo ""
    echo "Próximos passos:"
    echo "   1. npm run dev"
    echo "   2. Fazer login na aplicação"
    echo "   3. Navegar para Dialer > Agentes"
    echo "   4. Criar seu primeiro agente"
    exit 0
else
    echo -e "${YELLOW}⚠️  Alguns testes falharam.${NC}"
    echo "   Revise os itens marcados com ✗ acima."
    echo "   Consulte CHECKLIST_IMPLEMENTACAO.md para instruções."
    exit 1
fi
