#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
MODE="${1:---test}"
export QNE_ROOT="$(pwd)"
case "$MODE" in
  --test) node qne_v12/tests/e2e.js ;;
  --bench) node qne_v12/tests/bench_scale.js ;;
  --local)
    N="${2:-2}"
    if ! [[ "$N" =~ ^[1-9][0-9]*$ ]] || ((N>8)); then echo 'Utilisation : --local 1..8' >&2;exit 2;fi
    node qne_v12/client.js init
    export QNE_V12_HOST=127.0.0.1
    export QNE_V12_URL=http://127.0.0.1:"${QNE_V12_PORT:-17839}"
    node qne_v12/coordinator.js & CPID=$!
    PIDS=("$CPID")
    cleanup(){ for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done; wait 2>/dev/null || true; }
    trap cleanup EXIT INT TERM
    sleep 1
    for ((i=1;i<=N;i++)); do QNE_V12_WORKER_ID="motorola-$i" node qne_v12/worker.js & PIDS+=("$!");done
    echo "QNE V12 : $N travailleurs locaux; utiliser un autre Termux pour soumettre les taches; CTRL+C pour arreter"
    wait "$CPID" ;;
  *) echo 'Usage : bash qne_v12/lancement_qne_v12.sh --test | --bench | --local [1..8]' >&2;exit 2;;
esac
