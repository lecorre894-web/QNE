#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
command -v clang++ >/dev/null || { echo 'clang++ manquant. Installer avec pkg install clang (Termux)'; exit 2; }
command -v node >/dev/null || { echo 'Node.js manquant. Installer avec pkg install nodejs (Termux)'; exit 2; }
FLAGS=(-O3 -std=c++17 -ffp-contract=off -fno-fast-math -pthread)
clang++ "${FLAGS[@]}" qne_v4_native.cpp -o qne_v4_ref
clang++ "${FLAGS[@]}" -DQNE_TILE=1024 -DQNE_SCHEDULE=1 qne_v7_native.cpp -o qne_v7_1024
clang++ "${FLAGS[@]}" -DQNE_TILE=1024 -DQNE_SCHEDULE=1 qne_v8_native.cpp -o qne_v8_1024
clang++ "${FLAGS[@]}" -DQNE_TILE=2048 -DQNE_SCHEDULE=1 qne_v8_native.cpp -o qne_v8_2048
node qne_v9.js "$@"
