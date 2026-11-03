#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
command -v clang++ >/dev/null || { echo 'Compilateur manquant : pkg install clang'; exit 2; }
command -v node >/dev/null || { echo 'Node.js manquant : pkg install nodejs'; exit 2; }
FLAGS=(-O3 -std=c++17 -ffp-contract=off -fno-fast-math -pthread)
clang++ "${FLAGS[@]}" qne_v4_native.cpp -o qne_v4_ref
clang++ "${FLAGS[@]}" qne_v6_native.cpp -o qne_v6_ref
clang++ "${FLAGS[@]}" -DQNE_TILE=512 -DQNE_SCHEDULE=0 qne_v7_native.cpp -o qne_v7_512
clang++ "${FLAGS[@]}" -DQNE_TILE=1024 -DQNE_SCHEDULE=1 qne_v7_native.cpp -o qne_v7_1024
node qne_v7.js "$@"
