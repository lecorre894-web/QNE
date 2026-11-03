#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$DIR")"
cd "$DIR"
command -v node >/dev/null || { echo 'Installer Node.js : pkg install nodejs'; exit 2; }
command -v clang++ >/dev/null || { echo 'Installer Clang : pkg install clang'; exit 2; }
NODE_BIN="$(command -v node)"
NODE_HEADER="$(dirname "$(dirname "$NODE_BIN")")/include/node"
if [[ -f "${PREFIX:-}/include/node/node_api.h" ]]; then NODE_HEADER="${PREFIX}/include/node"; fi
if [[ ! -f "$NODE_HEADER/node_api.h" ]]; then
  echo "Erreur: en-tetes Node-API absents. Chemin verifie: $NODE_HEADER"; exit 2
fi
clang++ -shared -fPIC -O3 -std=c++17 -I "$NODE_HEADER" qne_matrix_napi.cpp -o qne_matrix_napi.node
# Reprendre la V9 du meme appareil; le script ne modifie pas V2-V8.
if [[ "${1:-}" == "--refresh-v9" ]]; then
  bash "$ROOT/qne_v9/lancement_qne_v9.sh"
  shift
fi
node qne_v10.js "$@"
