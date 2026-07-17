#!/usr/bin/env bash
#
# SEÇÃO 0 — Imagem dourada a partir da VM browser de referência.
# Pré-requisito: a VM de referência já rodou vm-setup.sh (Google Chrome + x11vnc + websockify + noVNC + scripts).
#
# Uso: PROJECT_ID=... bash infra/deploy-golden-image.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-60095631-56d2-433d-99d}"
SRC_VM="${SRC_VM:-kito-browser-fast}"
SRC_ZONE="${SRC_ZONE:-southamerica-east1-a}"
IMAGE_NAME="${IMAGE_NAME:-kito-browser-image}"
IMAGE_FAMILY="${IMAGE_FAMILY:-kito-browser}"

gcloud config set project "$PROJECT_ID"

echo ">> Criando imagem dourada $IMAGE_NAME (family=$IMAGE_FAMILY) a partir de $SRC_VM..."
gcloud compute images create "$IMAGE_NAME" \
  --source-disk "$SRC_VM" \
  --source-disk-zone "$SRC_ZONE" \
  --family "$IMAGE_FAMILY" \
  --force

echo ">> Imagem criada. Valide antes de usar:"
echo "   gcloud compute images describe $IMAGE_NAME --format='get(status)'"
