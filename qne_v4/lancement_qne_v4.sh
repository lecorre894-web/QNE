#!/data/data/com.termux/files/usr/bin/bash
# Compatible Termux; n'ecrit que dans qne_v4/.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
if ! command -v clang++ >/dev/null 2>&1; then
  echo "Compilateur clang++ absent. Dans Termux : pkg install clang"
  exit 2
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js absent. Dans Termux : pkg install nodejs"
  exit 2
fi
echo "Compilation stricte RK4 (double, FMA desactive)..."
clang++ -O3 -std=c++17 -ffp-contract=off -fno-fast-math qne_v4_native.cpp -o qne_v4_native
node qne_v4.js "$@"
