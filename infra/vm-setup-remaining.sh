#!/usr/bin/env bash
# FASE 2 (restante) — DEPRECADO.
# O stack correto (Google Chrome + x11vnc + websockify /usr/bin/websockify)
# está consolidado em vm-setup.sh. Use apenas ele.
# Mantido por compatibilidade: apenas delega.
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$DIR/vm-setup.sh" "$@"
