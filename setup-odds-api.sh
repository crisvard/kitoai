#!/bin/bash

# Configurar API Key da The Odds API no Supabase
# Execute: bash setup-odds-api.sh

echo "🔑 Configurando ODDS_API_KEY no Supabase..."

# Substitua pela sua API Key se diferente
export ODDS_API_KEY="b6106a8518bcac0b60493d71a9fa8830"

# Tentar configurar via Supabase CLI
if command -v supabase &> /dev/null; then
    supabase secrets set ODDS_API_KEY=$ODDS_API_KEY
    echo "✅ Secret configurado!"
else
    echo "⚠️ Supabase CLI não encontrado."
    echo ""
    echo "Para configurar manualmente:"
    echo "1. Acesse: https://supabase.com/dashboard"
    echo "2. Selecione seu projeto"
    echo "3. Vá em Settings → Edge Functions"
    echo "4. Adicione o secret: ODDS_API_KEY"
    echo "5. Valor: $ODDS_API_KEY"
    echo ""
    echo "Ou instale a CLI: https://github.com/supabase/cli"
fi
