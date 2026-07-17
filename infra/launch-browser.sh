#!/usr/bin/env bash
# /opt/kito-browser/launch-browser.sh <NAV_ID> <DISPLAY> <VNC_PORT> <WS_PORT> <TOKEN>
# Sobe o stack de UM navegador remoto (por NAV) numa VM browser:
#   Xvfb :D  ->  google-chrome-stable (--display :D)  ->  x11vnc (:D)  ->  websockify (--web-token)
# Sobrevive ao logout do SSH (nohup + disown + pidfile).
set -uo pipefail
NAV_ID="$1"; DISPLAY_NUM="$2"; VNC_PORT="$3"; WS_PORT="$4"; TOKEN="$5"
APP_DIR="/opt/kito-browser"
DISP=":$DISPLAY_NUM"
HOME_DIR="$APP_DIR/sessions/$NAV_ID"
PIDFILE="$HOME_DIR/pids"
mkdir -p "$HOME_DIR"

# Se já existir, encerra o stack anterior desse NAV (reinício seguro).
"$APP_DIR/stop-browser.sh" "$NAV_ID" >/dev/null 2>&1 || true

# Display virtual
nohup Xvfb "$DISP" -screen 0 1280x800x24 -nolisten tcp >/dev/null 2>&1 &
XVFB_PID=$!
# Chrome (Google Chrome, não Chromium) isolado por NAV
nohup google-chrome-stable --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --user-data-dir="$HOME_DIR/profile" --display "$DISP" --start-maximized about:blank \
  >/dev/null 2>&1 &
CHROME_PID=$!
# VNC server (só localhost; websockify faz o túnel externo)
nohup x11vnc -display "$DISP" -rfbport "$VNC_PORT" -localhost -nopw -forever -shared \
  >/dev/null 2>&1 &
VNC_PID=$!
# noVNC/websockify com token único (modo --web-token)
# Prefer websockify from a virtualenv inside APP_DIR (bundled, supports --web-token)
WEBSOCKIFY_BIN="$APP_DIR/wsenv/bin/websockify"
if [ ! -x "$WEBSOCKIFY_BIN" ]; then
  if [ -x "/usr/bin/websockify" ]; then
    WEBSOCKIFY_BIN="/usr/bin/websockify"
  else
    WEBSOCKIFY_BIN="$(command -v websockify || true)"
  fi
fi

# Tokens directory (used by token-plugin mode)
TOKENS_DIR="$APP_DIR/tokens"
mkdir -p "$TOKENS_DIR"
# Create token file (name=token, contents=host:port)
printf '%s' "127.0.0.1:$VNC_PORT" > "$TOKENS_DIR/$TOKEN"

# Start websockify: prefer --web-token when supported, otherwise use token-plugin
if "$WEBSOCKIFY_BIN" --help 2>&1 | grep -q -- '--web-token'; then
  nohup "$WEBSOCKIFY_BIN" --web "$APP_DIR/novnc" --web-token "$TOKEN" \
    "$WS_PORT" "127.0.0.1:$VNC_PORT" >/dev/null 2>&1 &
else
  nohup "$WEBSOCKIFY_BIN" --web "$APP_DIR/novnc" --token-plugin TokenFile --token-source "$TOKENS_DIR" \
    "$WS_PORT" >/dev/null 2>&1 &
fi
WS_PID=$!

disown $XVFB_PID $CHROME_PID $VNC_PID $WS_PID 2>/dev/null || true
printf '%s\n' "$XVFB_PID" "$CHROME_PID" "$VNC_PID" "$WS_PID" > "$PIDFILE"
echo "started NAV=$NAV_ID display=$DISP vnc=$VNC_PORT ws=$WS_PORT token=$TOKEN"
