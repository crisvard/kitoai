#!/usr/bin/env bash
#
# FASE 2 - Stack de Navegador Remoto na VM browser (Google Cloud)
# Executar DENTRO da VM browser (após a FASE 1 / provisionamento):
#   gcloud compute ssh <VM_BROWSER> --zone <ZONE> --command="bash -s" < vm-setup.sh
#
# Instala: Xvfb + Google Chrome (não Chromium) + x11vnc + websockify + noVNC
#          + xdotool/wmctrl (navegação) e cria launch/stop/navigate por NAV.
# Gera a IMAGEM DOURADA a partir desta VM (deploy-golden-image.sh).
#
# Decisões fechadas:
#   - google-chrome-stable (repo oficial), não chromium-browser.
#   - websockify via apt -> /usr/bin/websockify (sem venv), modo --web-token (token único).
#   - x11vnc expõe VNC em localhost; websockify faz o túnel externo.

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

APP_DIR="/opt/kito-browser"
SESSIONS_DIR="$APP_DIR/sessions"
NOVNC_DIR="$APP_DIR/novnc"
WS_PORT_START=6080
WS_PORT_END=6500

echo ">> Atualizando pacotes..."
sudo apt-get update -y

echo ">> Instalando Xvfb, x11vnc, websockify, xdotool, wmctrl, nginx, git, curl..."
sudo apt-get install -y \
  xvfb x11-utils x11vnc websockify xdotool wmctrl \
  git curl nginx

echo ">> Instalando Google Chrome (repo oficial)..."
if ! command -v google-chrome-stable >/dev/null 2>&1; then
  curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg
  echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
    | sudo tee /etc/apt/sources.list.d/google-chrome.list
  sudo apt-get update -y
  sudo apt-get install -y google-chrome-stable
fi
google-chrome-stable --version

echo ">> Preparando /opt/kito-browser (dono = usuário)..."
sudo mkdir -p "$APP_DIR"
sudo chown -R "$(whoami)":"$(id -gn)" "$APP_DIR"

echo ">> Baixando noVNC..."
sudo rm -rf "$NOVNC_DIR"
git clone --depth 1 https://github.com/novnc/noVNC.git "$NOVNC_DIR"

echo ">> Criando estrutura de sessões..."
sudo mkdir -p "$SESSIONS_DIR"
sudo chown -R "$(whoami)":"$(id -gn)" "$APP_DIR"

echo ">> Gravando scripts por NAV..."
sudo tee "$APP_DIR/launch-browser.sh" >/dev/null <<'EOF'
#!/usr/bin/env bash
set -uo pipefail
NAV_ID="$1"; DISPLAY_NUM="$2"; VNC_PORT="$3"; WS_PORT="$4"; TOKEN="$5"
APP_DIR="/opt/kito-browser"
DISP=":$DISPLAY_NUM"
HOME_DIR="$APP_DIR/sessions/$NAV_ID"
PIDFILE="$HOME_DIR/pids"
mkdir -p "$HOME_DIR"
"$APP_DIR/stop-browser.sh" "$NAV_ID" >/dev/null 2>&1 || true
nohup Xvfb "$DISP" -screen 0 1280x800x24 -nolisten tcp >/dev/null 2>&1 &
XVFB_PID=$!
nohup google-chrome-stable --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --user-data-dir="$HOME_DIR/profile" --display "$DISP" --start-maximized about:blank \
  >/dev/null 2>&1 &
CHROME_PID=$!
nohup x11vnc -display "$DISP" -rfbport "$VNC_PORT" -localhost -nopw -forever -shared \
  >/dev/null 2>&1 &
VNC_PID=$!
nohup /usr/bin/websockify --web "$APP_DIR/novnc" --web-token "$TOKEN" \
  "$WS_PORT" "127.0.0.1:$VNC_PORT" >/dev/null 2>&1 &
WS_PID=$!
disown $XVFB_PID $CHROME_PID $VNC_PID $WS_PID 2>/dev/null || true
printf '%s\n' "$XVFB_PID" "$CHROME_PID" "$VNC_PID" "$WS_PID" > "$PIDFILE"
echo "started NAV=$NAV_ID display=$DISP vnc=$VNC_PORT ws=$WS_PORT token=$TOKEN"
EOF

sudo tee "$APP_DIR/stop-browser.sh" >/dev/null <<'EOF'
#!/usr/bin/env bash
set -uo pipefail
NAV_ID="$1"
APP_DIR="/opt/kito-browser"
HOME_DIR="$APP_DIR/sessions/$NAV_ID"
PIDFILE="$HOME_DIR/pids"
if [ -f "$PIDFILE" ]; then
  while read -r pid; do [ -n "$pid" ] && kill -9 "$pid" 2>/dev/null || true; done < "$PIDFILE"
  rm -f "$PIDFILE"
fi
pkill -9 -f "user-data-dir=$HOME_DIR/profile" 2>/dev/null || true
echo "stopped NAV=$NAV_ID"
EOF

sudo tee "$APP_DIR/navigate-browser.sh" >/dev/null <<'EOF'
#!/usr/bin/env bash
set -uo pipefail
DISP=":$1"; URL="$2"; export DISPLAY="$DISP"
WIN=$(wmctrl -l 2>/dev/null | grep -i "Google Chrome" | head -1 | awk '{print $1}')
if [ -n "$WIN" ]; then wmctrl -ia "$WIN" >/dev/null 2>&1 || true; fi
sleep 0.2; xdotool mousemove 640 28 click 1; sleep 0.4
xdotool type --clearmodifiers --delay 5 "$URL"; sleep 0.3; xdotool key Return
echo "navigated display=$DISP -> $URL"
EOF

sudo chmod +x "$APP_DIR/launch-browser.sh" "$APP_DIR/stop-browser.sh" "$APP_DIR/navigate-browser.sh"

echo "==================================================="
echo " FASE 2 (BROWSER VM) CONCLUÍDA"
echo " noVNC:    $NOVNC_DIR"
echo " Sessões:  $SESSIONS_DIR"
echo " Scripts:  $APP_DIR/{launch,stop,navigate}-browser.sh"
echo " Chrome:   $(google-chrome-stable --version)"
echo "==================================================="
echo "Próximos passos:"
echo "  - Valide Chrome/x11vnc/websockify nesta VM."
echo "  - Crie a imagem dourada:  bash deploy-golden-image.sh"
