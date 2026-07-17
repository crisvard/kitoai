#!/usr/bin/env bash
# Navega o navegador remoto (visível via noVNC) para uma URL.
# Clica na barra de endereços (janela maximizada 1280x800) e digita a URL.
set -euo pipefail
DISP="$1"
URL="$2"
export DISPLAY="$DISP"

WIN=$(wmctrl -l 2>/dev/null | grep -i "Google Chrome" | head -1 | awk '{print $1}')
if [ -n "$WIN" ]; then
  wmctrl -ia "$WIN" >/dev/null 2>&1 || true
fi
sleep 0.3
# Clica na barra de endereços (topo central da janela maximizada)
xdotool mousemove 640 28 click 1
sleep 0.5
xdotool type --clearmodifiers --delay 5 "$URL"
sleep 0.5
xdotool key Return
