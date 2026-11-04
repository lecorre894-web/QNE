#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
export QNE_ROOT="$(pwd)"
MODE="${1:---test}"
case "$MODE" in
  --test) node qne_v13/tests/e2e.js ;;
  --bench) node qne_v13/tests/bench_cooperation.js ;;
  --local)
    N="${2:-2}"
    if [[ "$N" == "auto" ]]; then N="$(node qne_v13/selection.js "${3:-repeated}")"; echo "QNE V13 : selection automatique => $N travailleurs"; fi
    if ! [[ "$N" =~ ^[1-9][0-9]*$ ]] || (( N>16 ));then echo 'Usage : --local 1..16 ou --local auto repeated|unique' >&2;exit 2;fi
    export QNE_V12_DATA="${QNE_V12_DATA:-$HOME/.qne_v13_data}"
    export QNE_V12_HOST=127.0.0.1 QNE_V12_PORT="${QNE_V12_PORT:-17849}"
    export QNE_V12_URL="http://127.0.0.1:${QNE_V12_PORT}"
    node qne_v12/client.js init
    node qne_v13/coordinator.js & C=$!
    PIDS=("$C")
    cleanup(){ for pid in "${PIDS[@]}";do kill "$pid" 2>/dev/null || true;done;wait 2>/dev/null || true; }
    trap cleanup EXIT INT TERM
    sleep 1
    for (( i=1;i<=N;i++ )); do QNE_V12_WORKER_ID="qne13-$i" node qne_v13/worker.js & PIDS+=("$!");done
    echo "QNE V13 : $N travailleurs et cache cooperatif. Dans un second Termux : QNE_V12_PORT=$QNE_V12_PORT QNE_V12_URL=$QNE_V12_URL node qne_v12/client.js batch 30"
    wait "$C" ;;
  *) echo 'Usage : --test | --bench | --local N' >&2;exit 2;;
esac
