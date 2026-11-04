#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
command -v node >/dev/null || { echo "Installer Node.js : pkg install nodejs"; exit 2; }
node qne_v11/qne_v11.js selftest
if node qne_v11/qne_v11.js audit; then
  echo "CATALOGUE : OK"
else
  echo "CATALOGUE : anomalies detectees ; consulter QNE_V11_AUDIT.json"
fi
if [[ -f qne_v10/qne_v10_matrix.js ]]; then
  node qne_v11/qne_v11.js matrix 1000000
else
  echo "QNE V10 absent : test matriciel non execute (aucune modification)"
fi
printf '\nQNE V11 : fichiers de rapport dans ~/QNE/qne_v11/\n'
