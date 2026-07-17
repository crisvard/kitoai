#!/usr/bin/env bash
#
# SEÇÃO 4 — SPA no Cloud Storage (+ CDN).
# Faz o build da aba "Outros" (npm run build:negociacoes) e sobe para o bucket.
#
# Uso: BUCKET=kito-spa bash infra/deploy-spa.sh
set -euo pipefail

BUCKET="${BUCKET:-kito-spa}"
PROJECT_ID="${PROJECT_ID:-project-60095631-56d2-433d-99d}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

gcloud config set project "$PROJECT_ID"

echo ">> Build do SPA (negociacoes)..."
( cd "$ROOT" && npm install --no-audit --no-fund && npm run build:negociacoes )

DIST="$ROOT/dist-negociacoes"
if [ ! -d "$DIST" ]; then echo "ERRO: dist-negociacoes/ não foi gerado."; exit 1; fi

echo ">> Criando bucket gs://$BUCKET (se necessário)..."
gsutil mb -l US -p "$PROJECT_ID" "gs://$BUCKET" 2>/dev/null || echo "   (bucket já existe — seguindo)"

echo ">> Configurando website (fallback SPA)..."
gsutil web set -m index.html -e index.html "gs://$BUCKET"

echo ">> Subindo build..."
gsutil -m -h "Cache-Control:public,max-age=300" cp -r "$DIST"/* "gs://$BUCKET/"

echo "==================================================="
echo " SPA publicada em gs://$BUCKET"
echo "==================================================="
echo "Aponte o backend-bucket kito-spa-bucket para este bucket (deploy-network.sh)."
