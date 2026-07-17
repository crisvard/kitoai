#!/usr/bin/env bash
#
# SEÇÃO 7 — Pool pré-quente (2 VMs e2-standard-4) + pedido de cota.
# VMs SEM IP externo (--no-address); acesso via IAP. Já registradas como warm no orquestrador (WARM_POOL).
#
# Uso: PROJECT_ID=... bash infra/warm-pool.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-60095631-56d2-433d-99d}"
GCP_ZONE="${GCP_ZONE:-us-central1-a}"
IMAGE_FAMILY="${IMAGE_FAMILY:-kito-browser}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-4}"
ORCH_SA="${ORCHESTRATOR_SERVICE_ACCOUNT:-}"
WARM_COUNT="${WARM_COUNT:-2}"

gcloud config set project "$PROJECT_ID"

SA_FLAG=""
[ -n "$ORCH_SA" ] && SA_FLAG="--service-account=$ORCH_SA"

NAMES=""
for i in $(seq 1 "$WARM_COUNT"); do
  NAME="kito-browser-warm-$i"
  NAMES="$NAMES$NAME,"
  if gcloud compute instances describe "$NAME" --zone="$GCP_ZONE" >/dev/null 2>&1; then
    echo ">> $NAME já existe — pulando."
  else
    echo ">> Criando VM quente $NAME (imagem $IMAGE_FAMILY)..."
    gcloud compute instances create "$NAME" \
      --zone="$GCP_ZONE" \
      --machine-type="$MACHINE_TYPE" \
      --image-family="$IMAGE_FAMILY" \
      --no-address $SA_FLAG
  fi
done

echo "==================================================="
echo " Pool pré-quente: ${NAMES%,}"
echo " Defina no orquestrador: WARM_POOL=${NAMES%,}"
echo "==================================================="

echo ">> (Opcional) Pedir aumento de cota E2_CPUS em $GCP_ZONE para 200 vCPU:"
echo "   gcloud compute quotas request-increase --service=compute.googleapis.com --metric=E2_CPUS --region=$GCP_ZONE --value=200 --project=$PROJECT_ID"
echo "   ou Console -> IAM & Admin -> Quotas."
