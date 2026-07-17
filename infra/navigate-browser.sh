#!/usr/bin/env bash
# /opt/kito-browser/navigate-browser.sh <DISPLAY> <URL>
# Digita a URL na barra de endereço do Chrome (janela maximizada 1280x800).
set -uo pipefail
DISP=":$1"
URL="$2"
export DISPLAY="$DISP"

WIN=$(wmctrl -l 2>/dev/null | grep -i "Google Chrome" | head -1 | awk '{print $1}')
if [ -n "$WIN" ]; then wmctrl -ia "$WIN" >/dev/null 2>&1 || true; fi
sleep 0.2
xdotool mousemove 640 28 click 1
sleep 0.4
xdotool type --clearmodifiers --delay 5 "$URL"
sleep 0.3
xdotool key Return
echo "navigated display=$DISP -> $URL"
