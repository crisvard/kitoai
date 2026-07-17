#!/usr/bin/env bash
#
# SEÇÃO 1 — IAM (Service Account do orquestrador) + Secret da API key.
# O orquestrador usa esta SA para clonar VMs e SSH via IAP nas VMs browser (sem IP externo).
#
# Uso: PROJECT_ID=... bash infra/deploy-iam-secret.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-60095631-56d2-433d-99d}"
SA_NAME="kito-orchestrator"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SECRET_NAME="kito-browser-apikey"

gcloud config set project "$PROJECT_ID"

echo ">> Criando service account $SA_NAME..."
gcloud iam service-accounts create "$SA_NAME" \
  --display-name="Kito Browser Orchestrator" 2>/dev/null \
  || echo "   (SA já existe — seguindo)"

echo ">> Concedendo roles compute.admin + iap.tunnelResourceAccessor..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role=roles/compute.admin >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role=roles/iap.tunnelResourceAccessor >/dev/null

echo ">> Criando Secret da API key ($SECRET_NAME)..."
# Defina a chave aqui (use a mesma KITO_API_KEY do orquestrador e VITE_BROWSER_API_KEY do SPA).
API_KEY="${KITO_API_KEY:-CHANGE_ME}"
printf '%s' "$API_KEY" | gcloud secrets create "$SECRET_NAME" \
  --replication-policy=automatic \
  --data-file=- 2>/dev/null \
  || echo "   (Secret já existe — atualize com: gcloud secrets versions add $SECRET_NAME --data-file=-)"

echo ">> Permitindo que a SA leia o secret..."
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --member="serviceAccount:$SA_EMAIL" \
  --role=roles/secretmanager.secretAccessor >/dev/null

echo "==================================================="
echo " SA orquestrador: $SA_EMAIL"
echo " Secret:          $SECRET_NAME"
echo "==================================================="
echo "Use a SA na VM orquestradora e/ou nas VMs browser clonadas (--service-account)."
echo "Leia a chave na VM com: gcloud secrets versions access latest --secret=$SECRET_NAME"
