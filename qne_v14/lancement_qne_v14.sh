#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
export QNE_ROOT="$(pwd)"
mode="${1:---test}"
case "$mode" in
 --test) node qne_v14/tests/e2e.js ;;
 --bench) node qne_v14/tests/bench_stairs.js ;;
 --local)
  n="${2:-4}"; profile="${3:-repeated}"
  if [[ "$n" == "auto" ]];then
   read -r n fast stage < <(node - "$profile" <<'NODE'
const fs=require('fs');const file='qne_v14/QNE_V14_BENCH_LOCAL.json';const name=process.argv[2];
if(!['unique','repeated'].includes(name))throw Error('profil unique|repeated');
if(!fs.existsSync(file))throw Error('Executer --bench pour la selection');
const r=JSON.parse(fs.readFileSync(file));if(r.status!=='PASSED')throw Error('Benchmark non valide');
const stage=r.summary[name].recommended_amplifier;
console.log('4 '+(stage==='P5'?'1':'0')+' '+stage);
NODE
)
   echo "QNE V14 : profil=$profile palier=$stage workers=$n fastpath=$fast"
  else fast="${QNE_V14_FASTPATH:-0}";fi
  if ! [[ "$n" =~ ^[1-9][0-9]*$ ]] || (( n>16 ));then echo 'Nombre workers 1..16 attendu' >&2;exit 2;fi
  if [[ "$fast" != "0" && "$fast" != "1" ]];then echo 'Fastpath 0|1 attendu' >&2;exit 2;fi
  export QNE_V12_DATA="${QNE_V12_DATA:-$HOME/.qne_v14_data}"
  export QNE_V12_HOST='127.0.0.1' QNE_V12_PORT="${QNE_V12_PORT:-17859}" QNE_V14_FASTPATH="$fast"
  export QNE_V12_URL="http://127.0.0.1:${QNE_V12_PORT}"
  node qne_v12/client.js init
  node qne_v14/coordinator.js & C=$!; PIDS=("$C")
  cleanup(){ for p in "${PIDS[@]}";do kill "$p" 2>/dev/null || true;done;wait 2>/dev/null || true; }
  trap cleanup EXIT INT TERM
  sleep 1
  for ((i=1;i<=n;i++));do QNE_V12_WORKER_ID="qne14-$i" node qne_v13/worker.js & PIDS+=("$!");done
  echo "QNE V14 : $n workers; client dans 2e Termux : cd ~/QNE; node qne_v14/client.js batch 30 repeated"
  wait "$C" ;;
 *) echo 'Usage : --test | --bench | --local auto repeated|unique | --local 4' >&2;exit 2 ;;
esac
