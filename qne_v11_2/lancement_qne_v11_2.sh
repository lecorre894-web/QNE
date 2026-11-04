#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
node qne_v11_2/tests/selftest.js
node qne_v11_2/qne_v11_2.js audit
