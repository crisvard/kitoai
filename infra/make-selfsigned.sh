#!/usr/bin/env bash
#
# Gera certificado auto-assinado para acesso POR IP (opção A do plano).
# O IP vai no SubjectAltName (SAN) para os browsers modernos não rejeitarem.
# O aviso "não seguro" continua aparecendo, mas a conexão é HTTPS de ponta a
# ponta -> sem bloqueio de mixed content (as páginas abrem normalmente).
#
# Uso: ORCH_IP=34.39.188.115 sudo -E bash infra/make-selfsigned.sh
set -euo pipefail

IP="${ORCH_IP:-}"
if [ -z "$IP" ]; then
  echo "ERRO: defina ORCH_IP (ex.: ORCH_IP=34.39.188.115 bash infra/make-selfsigned.sh)"
  exit 1
fi

CERT="/etc/ssl/certs/kito-selfsigned.crt"
KEY="/etc/ssl/private/kito-selfsigned.key"

sudo mkdir -p /etc/ssl/certs /etc/ssl/private

sudo openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout "$KEY" -out "$CERT" \
  -subj "/CN=${IP}/O=Kito/C=BR" \
  -addext "subjectAltName=IP:${IP}"

sudo chmod 600 "$KEY"
sudo chmod 644 "$CERT"

echo "Cert auto-assinado gerado:"
echo "  cert: $CERT"
echo "  key:  $KEY"
echo "  SAN:  IP:${IP}"
echo "Aponte VITE_BROWSER_API_BASE=https://${IP} no build do SPA."
