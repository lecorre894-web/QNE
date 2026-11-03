#!/usr/bin/env bash
# Compilation et verification des deux binaires comparables, strict FP, 1 thread.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
command -v clang++ >/dev/null || { echo "clang++ manquant : pkg install clang"; exit 2; }
command -v node >/dev/null || { echo "node manquant : pkg install nodejs"; exit 2; }
FLAGS=(-O3 -std=c++17 -ffp-contract=off -fno-fast-math)
clang++ "${FLAGS[@]}" qne_v4_native.cpp -o qne_v4_ref
clang++ "${FLAGS[@]}" qne_v5_native.cpp -o qne_v5_native
node qne_v5.js "$@"
