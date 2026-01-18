#!/bin/bash

# Script simples para executar a correção final
echo "🔧 Executando correção final de permissões de delete..."

# Comando SQL direto
psql "postgresql://postgres.hedxxbsieoazrmbayzab:[YOUR_PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" -c "
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE packages DISABLE ROW LEVEL SECURITY;
"

echo "✅ Correção executada!"
echo "🧪 Agora teste a exclusão de agendamentos no dashboard"