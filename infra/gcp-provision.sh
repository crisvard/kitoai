#!/usr/bin/env bash
#
# FASE 1 - Provisionamento da VM ORQUESTRADORA no Google Cloud (reaproveita kito-browser-fast).
# Aba "Outros" — navegadores remotos multi-tenant (GCP, caminho estável).
#
# Como usar:
#   1. gcloud auth login   (conta armempires@gmail.com)
#   2. Exporte: export PROJECT_ID=project-60095631-56d2-433d-99d
#   3. ./gcp-provision.sh
#
# A VM orquestradora (e2-standard-4) roda o Node (PM2) + nginx e clona as VMs browser
# a partir da IMAGEM DOURADA (deploy-golden-image.sh). As VMs browser NÃO têm IP externo
# (acesso via IAP). Veja warm-pool.sh para o pool pré-quente.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-SEU-PROJETO-AQUI}"
REGION="us-central1"
ZONE="us-central1-a"
ORCH_VM="${ORCH_VM:-kito-browser-fast}"        # vira a VM orquestradora (e2-standard-4)
MACHINE_TYPE="e2-standard-4"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
DISK_SIZE_GB="50"
STATIC_IP_NAME="kito-browser-ip"
FW_NAME="kito-browser-fw"

if [ "$PROJECT_ID" = "SEU-PROJETO-AQUI" ]; then
  echo "ERRO: defina PROJECT_ID no topo do script ou exporte a variável."
  exit 1
fi

echo ">> Usando projeto: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo ">> Ativando Compute Engine API..."
gcloud services enable compute.googleapis.com

echo ">> Criando IP externo estático ($STATIC_IP_NAME)..."
gcloud compute addresses create "$STATIC_IP_NAME" --region "$REGION" --project "$PROJECT_ID" 2>/dev/null || echo "   (IP já existe — seguindo)"
ADDRESS=$(gcloud compute addresses describe "$STATIC_IP_NAME" --region "$REGION" --format="get(address)")
echo "   IP reservado: $ADDRESS"

echo ">> Criando regras de firewall ($FW_NAME)..."
# 443 (LB HTTPS), 3000 (health check do LB: 130.211.0.0/22, 35.191.0.0/16), 22 (IAP: 35.235.240.0/20)
gcloud compute firewall-rules create "$FW_NAME" \
  --direction=INGRESS --priority=1000 --network=default --action=ALLOW \
  --rules=tcp:443,tcp:3000,tcp:22 \
  --source-ranges=0.0.0.0/0,130.211.0.0/22,35.191.0.0/16,35.235.240.0/20 \
  --project "$PROJECT_ID" 2>/dev/null || echo "   (Firewall já existe — ajuste manualmente se preciso)"

echo ">> Criando/confirmando VM orquestradora $ORCH_VM ($MACHINE_TYPE)..."
if gcloud compute instances describe "$ORCH_VM" --zone "$ZONE" >/dev/null 2>&1; then
  echo "   (VM $ORCH_VM já existe — seguindo)"
else
  gcloud compute instances create "$ORCH_VM" \
    --project "$PROJECT_ID" --zone "$ZONE" --machine-type "$MACHINE_TYPE" \
    --image-family "$IMAGE_FAMILY" --image-project "$IMAGE_PROJECT" \
    --boot-disk-size "${DISK_SIZE_GB}"GB --boot-disk-type pd-ssd \
    --address "$ADDRESS" --tags=http-server,https-server \
    --metadata=enable-oslogin=TRUE,enable-oslogin=TRUE
fi

echo ""
echo "==================================================="
echo " FASE 1 CONCLUÍDA"
echo " IP externo: $ADDRESS"
echo " VM: $ORCH_VM (zona $ZONE)"
echo "==================================================="
echo ""
echo "Próximos passos:"
echo "  1. bash infra/vm-setup-orchestrator.sh   (dentro da VM: gcloud, node, pm2, nginx)"
echo "  2. bash infra/deploy-iam-secret.sh        (SA + secret da API key)"
echo "  3. Na VM browser de referência: bash infra/vm-setup.sh  ->  bash infra/deploy-golden-image.sh"
echo "  4. bash infra/deploy-network.sh           (DNS + LB + cert + SPA backend)"
echo "  5. bash infra/deploy-spa.sh               (build + upload SPA)"
echo "  6. bash infra/deploy-orchestrator.sh      (sobe o orquestrador no PM2)"
echo "  7. bash infra/warm-pool.sh                (2 VMs pré-quentes)"
