#!/usr/bin/env bash
#
# Deploy da SPA (aba "Outros") DIRETAMENTE na VM orquestradora.
# Faz o build e copia dist-negociacoes/ para /var/www/kito-spa na VM.
# Não usa Cloud Storage nem Load Balancer.
#
# Uso:
#   VITE_BROWSER_API_BASE=https://34.39.188.115 VITE_BROWSER_API_KEY=xxx \
#   ORCH_VM=kito-browser-fast ORCH_ZONE=southamerica-east1-a \
#   bash infra/deploy-spa-local.sh
#
#   ou, com domínio válido:
#   VITE_BROWSER_API_BASE=https://navegador.seudominio.com VITE_BROWSER_API_KEY=xxx \
#   ORCH_VM=kito-browser-fast ORCH_ZONE=southamerica-east1-a \
#   bash infra/deploy-spa-local.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-60095631-56d2-433d-99d}"
ORCH_VM="${ORCH_VM:-kito-browser-fast}"
ORCH_ZONE="${ORCH_ZONE:-us-central1-a}"
VM_SPA_DIR="/var/www/kito-spa"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Config do SPA (IP + self-signed)
export VITE_BROWSER_API_BASE="${VITE_BROWSER_API_BASE:-https://34.39.188.115}"
export VITE_BROWSER_API_KEY="${VITE_BROWSER_API_KEY:-CHANGE_ME}"
export VITE_BROWSER_USER_ID="${VITE_BROWSER_USER_ID:-kito-app-user}"
export VITE_MAX_BROWSERS_PER_USER="${VITE_MAX_BROWSERS_PER_USER:-8}"

gcloud config set project "$PROJECT_ID"

echo ">> Build do SPA (negociacoes) apontando para $VITE_BROWSER_API_BASE ..."
( cd "$ROOT" && npm install --no-audit --no-fund && npm run build:negociacoes )

DIST="$ROOT/dist-negociacoes"
if [ ! -d "$DIST" ]; then echo "ERRO: dist-negociacoes/ não foi gerado."; exit 1; fi

echo ">> Enviando build para $ORCH_VM:$VM_SPA_DIR ..."
gcloud compute scp --recurse "$DIST/." "$ORCH_VM:$VM_SPA_DIR" --zone="$ORCH_ZONE" --tunnel-through-iap

echo "==================================================="
echo " SPA publicada em https://$(echo $VITE_BROWSER_API_BASE | sed 's#https://##')/"
echo "==================================================="
echo "Acesse pelo navegador (aceite o aviso de certificado auto-assinado)."
