#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
node qne_v11_3/qne_v11_3.js selftest
node qne_v11_3/qne_v11_3.js audit
if [ -f qne_v10/qne_v10_matrix.js ]; then
  node qne_v11_3/qne_v11_3.js matrix
else
  echo 'QNE V10 absent : verification matricielle independante a lancer apres installation de V10.'
fi
printf '\nQNE V11.3 : audit dans %s/qne_v11_3/QNE_V11_3_INTEGRATION.json\n' "$PWD"
