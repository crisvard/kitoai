#!/usr/bin/env bash
#
# DEPLOY COMPLETO — Opção A (IP + cert auto-assinado), tudo numa VM.
# Uma só VM (kito-browser-fast) faz TUDO:
#   - stack de browser (Xvfb + Chrome + x11vnc + websockify + noVNC)
#   - orquestrador (Node/PM2) + nginx HTTPS auto-assinado
#   - serve a SPA (aba Outros) em https://IP
#
# Pré-requisitos na máquina que roda este script: gcloud auth + repo clonado.
#
# Uso:
#   KITO_API_KEY=umaChaveForte ORCH_IP=34.39.188.115 \
#   bash infra/deploy-ip.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-60095631-56d2-433d-99d}"
ORCH_VM="${ORCH_VM:-kito-browser-fast}"
ORCH_ZONE="${ORCH_ZONE:-southamerica-east1-a}"
ORCH_IP="${ORCH_IP:-34.39.188.115}"
ORCH_DOMAIN="${ORCH_DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
KITO_API_KEY="${KITO_API_KEY:-hsgfdfsd65432hgfd36}"
GCP_PROJECT="${GCP_PROJECT:-$PROJECT_ID}"
GCP_ZONE="${GCP_ZONE:-$ORCH_ZONE}"
LOCAL_MODE="${LOCAL_MODE:-true}"          # orquestrador e browser stack na mesma VM
WARM_POOL="${WARM_POOL:-$ORCH_VM}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_INFRA="/tmp/kito-infra"

gcloud config set project "$PROJECT_ID"

echo "==================================================="
echo " 1/4  Stack de browser na VM $ORCH_VM"
echo "==================================================="
gcloud compute scp --recurse "$ROOT/infra/." "$ORCH_VM:/tmp/kito-infra/" --zone="$ORCH_ZONE" --tunnel-through-iap
gcloud compute ssh "$ORCH_VM" --zone="$ORCH_ZONE" --tunnel-through-iap --command="bash $REMOTE_INFRA/vm-setup.sh"

echo "==================================================="
echo " 2/4  Runtime do orquestrador (Node + nginx)"
echo "==================================================="
gcloud compute ssh "$ORCH_VM" --zone="$ORCH_ZONE" --tunnel-through-iap --command="ORCH_IP=$ORCH_IP ORCH_DOMAIN=$ORCH_DOMAIN LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL bash $REMOTE_INFRA/vm-setup-orchestrator.sh"

if [ -n "$ORCH_DOMAIN" ]; then
  BROWSER_API_BASE="https://$ORCH_DOMAIN"
else
  BROWSER_API_BASE="https://$ORCH_IP"
fi

echo "==================================================="
echo " 3/4  Build + upload da SPA para $BROWSER_API_BASE"
echo "==================================================="
VITE_BROWSER_API_BASE="$BROWSER_API_BASE" VITE_BROWSER_API_KEY="$KITO_API_KEY" \
ORCH_VM="$ORCH_VM" ORCH_ZONE="$ORCH_ZONE" bash "$ROOT/infra/deploy-spa-local.sh"

echo "==================================================="
echo " 4/4  Orquestrador no PM2 (LOCAL_MODE=$LOCAL_MODE)"
echo "==================================================="
LOCAL_MODE="$LOCAL_MODE" KITO_API_KEY="$KITO_API_KEY" \
GCP_PROJECT="$GCP_PROJECT" GCP_ZONE="$GCP_ZONE" WARM_POOL="$WARM_POOL" \
ORCH_VM="$ORCH_VM" ORCH_ZONE="$ORCH_ZONE" bash "$ROOT/infra/deploy-orchestrator.sh"

echo "==================================================="
if [ -n "$ORCH_DOMAIN" ]; then
  echo " PRONTO: https://$ORCH_DOMAIN"
  echo " Use o domínio apontado para a VM e acesse sem aviso de certificado."
else
  echo " PRONTO: https://$ORCH_IP"
  echo " Aceite o aviso de certificado auto-assinado e use a aba Outros."
fi
 echo "==================================================="
