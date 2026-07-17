#!/bin/bash

# Script para iniciar o servidor proxy da Betano
# Uso: ./start-betano-proxy.sh

echo "🎰 Iniciando servidor proxy da Betano..."
echo ""

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o arquivo do servidor existe
if [ ! -f "server/betano-proxy.js" ]; then
    echo "❌ Arquivo server/betano-proxy.js não encontrado."
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules/express" ]; then
    echo "📦 Instalando dependências..."
    npm install express cors
fi

# Iniciar o servidor
echo "🚀 Iniciando servidor na porta 3001..."
echo ""
node server/betano-proxy.js
