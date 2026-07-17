#!/usr/bin/env bash
#
# SEÇÃO 6 — Sobe o orquestrador 24/7 na VM fixa (PM2).
# Copia server/browser-orchestrator.js para a VM e inicia com PM2.
#
# Uso:
#   PROJECT_ID=... ORCH_VM=kito-browser-fast ORCH_ZONE=us-central1-a \
#   KITO_API_KEY=xxx GCP_PROJECT=... GCP_ZONE=us-central1-a WARM_POOL=kito-browser-fast \
#   bash infra/deploy-orchestrator.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-60095631-56d2-433d-99d}"
ORCH_VM="${ORCH_VM:-kito-browser-fast}"
ORCH_ZONE="${ORCH_ZONE:-us-central1-a}"
ORCH_DIR="/opt/kito-orchestrator"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_SRC="$ROOT/server/browser-orchestrator.js"

KITO_API_KEY="${KITO_API_KEY:-CHANGE_ME}"
GCP_PROJECT="${GCP_PROJECT:-$PROJECT_ID}"
GCP_ZONE="${GCP_ZONE:-us-central1-a}"
BROWSERS_PER_VM="${BROWSERS_PER_VM:-12}"
MAX_BROWSERS_PER_USER="${MAX_BROWSERS_PER_USER:-8}"
WARM_POOL="${WARM_POOL:-kito-browser-fast}"
LOCAL_MODE="${LOCAL_MODE:-false}"
ORCH_SA="${ORCHESTRATOR_SERVICE_ACCOUNT:-}"
if [ "$LOCAL_MODE" = "true" ]; then
  APP_DIR="${APP_DIR:-/tmp/kito-infra}"
else
  APP_DIR="${APP_DIR:-/opt/kito-browser}"
fi

gcloud config set project "$PROJECT_ID"

echo ">> Copiando orquestrador para $ORCH_VM:$ORCH_DIR ..."
gcloud compute scp "$SERVER_SRC" "$ORCH_VM:$ORCH_DIR/browser-orchestrator.js" --zone="$ORCH_ZONE" --tunnel-through-iap

SA_FLAG=""
[ -n "$ORCH_SA" ] && SA_FLAG="--service-account=$ORCH_SA"

echo ">> Iniciando com PM2 (IAP + vars de ambiente)..."
gcloud compute ssh "$ORCH_VM" --zone="$ORCH_ZONE" --tunnel-through-iap --command="
  set -e
  cd $ORCH_DIR
  pm2 delete kito-orchestrator 2>/dev/null || true
  KITO_API_KEY=$KITO_API_KEY \\
  GCP_PROJECT=$GCP_PROJECT GCP_ZONE=$GCP_ZONE \\
  BROWSERS_PER_VM=$BROWSERS_PER_VM MAX_BROWSERS_PER_USER=$MAX_BROWSERS_PER_USER \\
  WARM_POOL=$WARM_POOL LOCAL_MODE=$LOCAL_MODE APP_DIR=$APP_DIR USE_IAP=true $SA_FLAG \\
  pm2 start browser-orchestrator.js --name kito-orchestrator --interpreter=node
  pm2 save
  pm2 startup | tail -1 || true
"

echo "==================================================="
echo " Orquestrador no PM2 da VM $ORCH_VM"
echo " Health:  curl -k https://<DOMINIO>/api/health"
echo "==================================================="
