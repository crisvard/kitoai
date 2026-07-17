#!/usr/bin/env bash
#
# SEÇÃO 3 — Rede estável (HTTPS + SPA) via Google-managed SSL.
# LB HTTPS global -> /api,/ws -> Backend Service (orquestrador) | demais -> Cloud Storage (SPA + CDN)
#
# Pré-requisitos:
#   - DOMAIN apontando para este projeto (obrigatório p/ certificado gerenciado).
#   - Bucket da SPA já criado (ver deploy-spa.sh) OU defina BUCKET.
#   - VM orquestradora já existe (ORCH_VM) e responde em :3000.
#
# Uso: PROJECT_ID=... DOMAIN=navegador.seudominio.com BUCKET=seu-bucket ORCH_VM=kito-browser-fast bash infra/deploy-network.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-60095631-56d2-433d-99d}"
DOMAIN="${DOMAIN:-}"
BUCKET="${BUCKET:-}"
ORCH_VM="${ORCH_VM:-kito-browser-fast}"
ORCH_ZONE="${ORCH_ZONE:-us-central1-a}"

if [ -z "$DOMAIN" ] || [ -z "$BUCKET" ]; then
  echo "ERRO: defina DOMAIN e BUCKET (ex.: DOMAIN=navegador.seudominio.com BUCKET=kito-spa)."
  exit 1
fi

gcloud config set project "$PROJECT_ID"

# 1) Cloud DNS (opcional — só cria a zona; o A record você aponta para o IP do LB depois)
ZONE_NAME="kito-zone"
if gcloud dns managed-zones describe "$ZONE_NAME" >/dev/null 2>&1; then
  echo ">> Zona DNS $ZONE_NAME já existe."
else
  echo ">> Criando zona DNS $ZONE_NAME para $DOMAIN..."
  gcloud dns managed-zones create "$ZONE_NAME" --dns-name="${DOMAIN}." --visibility=public --description="Kito Browser"
fi

# 2) Certificado SSL gerenciado
CERT_NAME="kito-browser-cert"
if gcloud compute ssl-certificates describe "$CERT_NAME" >/dev/null 2>&1; then
  echo ">> Certificado $CERT_NAME já existe."
else
  echo ">> Criando certificado gerenciado para $DOMAIN (pode levar alguns minutos)..."
  gcloud compute ssl-certificates create "$CERT_NAME" --domains="$DOMAIN" --global
fi

# 3) Health check
HC_NAME="kito-hc"
gcloud compute health-checks create http "$HC_NAME" --request-path=/api/health --global >/dev/null 2>&1 \
  || echo "   (health-check já existe — seguindo)"

# 4) Backend service (orquestrador)
BS_NAME="kito-orchestrator-bs"
if ! gcloud compute backend-services describe "$BS_NAME" --global >/dev/null 2>&1; then
  echo ">> Criando backend service $BS_NAME..."
  gcloud compute backend-services create "$BS_NAME" --global --protocol=HTTP --health-checks="$HC_NAME" --timeout=3600s
  # Instância do orquestrador via instance group não-gerenciado
  IG_NAME="kito-orchestrator-ig"
  gcloud compute instance-groups unmanaged create "$IG_NAME" --zone="$ORCH_ZONE" >/dev/null 2>&1 || true
  gcloud compute instance-groups unmanaged add-instances "$IG_NAME" --zone="$ORCH_ZONE" --instances="$ORCH_VM" >/dev/null 2>&1 || true
  gcloud compute backend-services add-backend "$BS_NAME" --global --instance-group="$IG_NAME" --instance-group-zone="$ORCH_ZONE"
else
  echo ">> Backend service $BS_NAME já existe."
fi

# 5) Backend bucket (SPA + CDN)
BB_NAME="kito-spa-bucket"
if ! gcloud compute backend-buckets describe "$BB_NAME" >/dev/null 2>&1; then
  echo ">> Criando backend bucket $BB_NAME (CDN)..."
  gcloud compute backend-buckets create "$BB_NAME" --bucket="$BUCKET" --enable-cdn
else
  echo ">> Backend bucket $BB_NAME já existe."
fi

# 6) URL map: default -> SPA; /api/* e /ws/* -> orquestrador
UM_NAME="kito-lb"
if ! gcloud compute url-maps describe "$UM_NAME" --global >/dev/null 2>&1; then
  echo ">> Criando URL map $UM_NAME..."
  gcloud compute url-maps create "$UM_NAME" --default-service="$BB_NAME" --global
  gcloud compute url-maps add-path-matcher "$UM_NAME" \
    --path-matcher-name=backend-matcher \
    --default-service="$BB_NAME" \
    --backend-service-rules="/api/*=$BS_NAME,/ws/*=$BS_NAME" \
    --global
  gcloud compute url-maps add-host-rule "$UM_NAME" --hosts="*" --path-matcher=backend-matcher --global
else
  echo ">> URL map $UM_NAME já existe."
fi

# 7) Target HTTPS proxy
TP_NAME="kito-tls"
gcloud compute target-https-proxies create "$TP_NAME" --url-map="$UM_NAME" --ssl-certificates="$CERT_NAME" --global >/dev/null 2>&1 \
  || gcloud compute target-https-proxies update "$TP_NAME" --url-map="$UM_NAME" --ssl-certificates="$CERT_NAME" --global

# 8) Forwarding rule (443 global)
FR_NAME="kito-https"
if ! gcloud compute forwarding-rules describe "$FR_NAME" --global >/dev/null 2>&1; then
  echo ">> Criando forwarding rule $FR_NAME (443)..."
  gcloud compute forwarding-rules create "$FR_NAME" --global --target-https-proxy="$TP_NAME" --ports=443
else
  echo ">> Forwarding rule $FR_NAME já existe."
fi

LB_IP=$(gcloud compute forwarding-rules describe "$FR_NAME" --global --format="get(IPAddress)")
echo "==================================================="
echo " LB pronto. IP: $LB_IP"
echo " Aponte o DNS:  $DOMAIN  ->  A  ->  $LB_IP"
echo "==================================================="
