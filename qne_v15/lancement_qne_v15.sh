#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo 'Node.js manquant : pkg install nodejs'; exit 2; }
if [[ "${1:-}" == '--local-only' ]]; then
  node qne_v15/checkup.js --local-only
else
  for f in qne_v12/lib/common.js qne_v13/worker.js qne_v14/coordinator.js; do
    [[ -f "$f" ]] || { echo "Prerequis manquant: $f ; installer QNE V12-V14"; exit 2; }
  done
  node qne_v15/checkup.js
fi
