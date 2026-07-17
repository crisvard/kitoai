#!/usr/bin/env bash
# /opt/kito-browser/stop-browser.sh <NAV_ID>
# Mata SÓ o stack daquele NAV (Xvfb + Chrome + x11vnc + websockify).
# NÃO destrói a VM e não afeta outros NAVs/usuários nela.
set -uo pipefail
NAV_ID="$1"
APP_DIR="/opt/kito-browser"
HOME_DIR="$APP_DIR/sessions/$NAV_ID"
PIDFILE="$HOME_DIR/pids"

# Mata pelo pidfile (processos diretos)
if [ -f "$PIDFILE" ]; then
  while read -r pid; do
    [ -n "$pid" ] && kill -9 "$pid" 2>/dev/null || true
  done < "$PIDFILE"
  rm -f "$PIDFILE"
fi

# Fallback: mata qualquer processo com o profile desse NAV (cobres filhos do Chrome)
pkill -9 -f "user-data-dir=$HOME_DIR/profile" 2>/dev/null || true

echo "stopped NAV=$NAV_ID"
