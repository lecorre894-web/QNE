#!/usr/bin/env bash
set -euo pipefail
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
mkdir -p "$T/QNE/imports_20261104"
cat > "$T/QNE/imports_20261104/noyau.js" <<'JS'
module.exports={double:x=>x*2};
JS
cat > "$T/QNE/imports_20261104/micronoyau.js" <<'JS'
module.exports={plus:(x,y)=>x+y};
JS
cat > "$T/QNE/imports_20261104/mathlib.js" <<'JS'
module.exports={square:x=>x*x};
JS
cat > "$T/QNE/imports_20261104/bibliio.js" <<'JS'
module.exports={label:x=>String(x)};
JS
cat > "$T/QNE/imports_20261104/dqiv_master.js" <<'JS'
console.log('DQIV OK');
JS
cp -r "$(cd "$(dirname "$0")/.." && pwd)" "$T/QNE/qne_v11"
QNE_ROOT="$T/QNE" node "$T/QNE/qne_v11/qne_v11.js" audit
QNE_ROOT="$T/QNE" node "$T/QNE/qne_v11/qne_v11.js" call math.mathlib square '[9]'
QNE_ROOT="$T/QNE" node "$T/QNE/qne_v11/qne_v11.js" run dqiv.dqiv_master --timeout 5000
cat > "$T/QNE/pipe.json" <<'JSON'
{"input":3,"stages":[{"alias":"core.noyau","method":"double"},{"alias":"core.micronoyau","method":"plus","args":[4]}]}
JSON
QNE_ROOT="$T/QNE" node "$T/QNE/qne_v11/qne_v11.js" pipeline "$T/QNE/pipe.json"
