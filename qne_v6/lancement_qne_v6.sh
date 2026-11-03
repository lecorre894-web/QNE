#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
command -v clang++ >/dev/null || { echo 'Compiler absent : pkg install clang'; exit 2; }
command -v node >/dev/null || { echo 'Node absent : pkg install nodejs'; exit 2; }
FLAGS=(-O3 -std=c++17 -ffp-contract=off -fno-fast-math -pthread)
clang++ "${FLAGS[@]}" qne_v4_native.cpp -o qne_v4_ref
clang++ "${FLAGS[@]}" qne_v5_native.cpp -o qne_v5_ref
clang++ "${FLAGS[@]}" qne_v6_native.cpp -o qne_v6_native
node qne_v6.js "$@"
