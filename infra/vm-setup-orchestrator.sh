#!/usr/bin/env bash
#
# Instala o runtime do ORQUESTRADOR na VM fixa (kito-browser-fast / e2-standard-4).
# Executar DENTRO da VM orquestradora:
#   gcloud compute ssh <ORCH_VM> --zone <ZONE> --command="bash -s" < vm-setup-orchestrator.sh
#
# Instala: gcloud SDK (para clonar VMs e SSH via IAP), Node 20, PM2, Nginx.
# O server/browser-orchestrator.js é copiado para /opt/kito-orchestrator pelo deploy-orchestrator.sh.

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

ORCH_DIR="/opt/kito-orchestrator"
APP_DIR="/opt/kito-browser"

echo ">> Instalando nginx, git, curl..."
sudo apt-get update -y
sudo apt-get install -y nginx git curl

echo ">> Instalando gcloud SDK (necessário p/ clonar VMs e SSH via IAP)..."
if ! command -v gcloud >/dev/null 2>&1; then
  curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
    | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list
  sudo apt-get update -y
  sudo apt-get install -y google-cloud-sdk
fi
gcloud --version | head -1

echo ">> Instalando Node.js 20 (LTS)..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

echo ">> Instalando PM2..."
sudo npm install -g pm2

echo ">> Preparando diretórios..."
sudo mkdir -p "$ORCH_DIR" "$APP_DIR" /var/www/kito-spa
sudo chown -R "$USER":"$USER" "$ORCH_DIR" "$APP_DIR" /var/www/kito-spa

echo ">> Instalando dependências do orquestrador (express, cors, @supabase/supabase-js)..."
cd "$ORCH_DIR"
npm init -y >/dev/null 2>&1 || true
npm pkg set type=module >/dev/null 2>&1 || true
npm install express@^4 cors@^2.8.5 @supabase/supabase-js@^2 >/dev/null 2>&1

if [ -z "${ORCH_IP:-}" ]; then
  ORCH_IP=$(curl -fsSL -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || true)
fi

if [ -n "${ORCH_DOMAIN:-}" ]; then
  echo ">> Configurando HTTPS válido para o domínio $ORCH_DOMAIN"
  LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-admin@$ORCH_DOMAIN}"
  if [ ! -d "/etc/letsencrypt/live/$ORCH_DOMAIN" ]; then
    echo ">> Parando nginx temporariamente para validar challenge ACME..."
    sudo systemctl stop nginx || true
    sudo certbot certonly --standalone --non-interactive --agree-tos --email "$LETSENCRYPT_EMAIL" -d "$ORCH_DOMAIN"
    sudo systemctl start nginx
  else
    echo ">> Certificado Let's Encrypt já existe para $ORCH_DOMAIN"
  fi

  cat > /tmp/kito-orchestrator-ssl.conf <<EOF
server {
    listen 80;
    server_name $ORCH_DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $ORCH_DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$ORCH_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$ORCH_DOMAIN/privkey.pem;

    client_max_body_size 10M;

    root /var/www/kito-spa;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location ~ ^/ws/(?<port>\d+)/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
EOF
  sudo cp /tmp/kito-orchestrator-ssl.conf /etc/nginx/sites-available/kito-orchestrator
else
  echo ">> Gerando certificado auto-assinado (opção A: acesso por IP)..."
  if [ -n "${ORCH_IP:-}" ]; then
    ORCH_IP="$ORCH_IP" sudo -E bash "$(dirname "${BASH_SOURCE[0]}")/make-selfsigned.sh"
  else
    echo "   (ORCH_IP não detectado — rode make-selfsigned.sh manualmente com o IP externo)"
  fi
  sudo cp "$(dirname "${BASH_SOURCE[0]}")/nginx-orchestrator-ssl.conf" /etc/nginx/sites-available/kito-orchestrator
fi

echo ">> Aplicando nginx HTTPS..."
sudo ln -sf /etc/nginx/sites-available/kito-orchestrator /etc/nginx/sites-enabled/kito-orchestrator
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "==================================================="
echo " ORCHESTRADOR PRONTO (runtime)"
echo " Dir:      $ORCH_DIR"
echo " HTTPS:    auto-assinado em https://${ORCH_IP:-SEU_IP}"
echo " Server:   server/browser-orchestrator.js (copiado pelo deploy-orchestrator.sh)"
echo "==================================================="
echo "Próximos passos:"
echo "  - bash deploy-orchestrator.sh   (copia o server + sobe com PM2 + IAP)"
echo "  - Build SPA: VITE_BROWSER_API_BASE=https://${ORCH_IP:-SEU_IP} npm run build:negociacoes"
echo "  - Defina KITO_API_KEY, GCP_PROJECT, GCP_ZONE, WARM_POOL no PM2/env."
