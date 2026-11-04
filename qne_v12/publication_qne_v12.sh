#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f qne_v12/QNE_V12_TESTS_LOCAL.json ]]; then
  echo 'Exécuter d abord: bash qne_v12/lancement_qne_v12.sh --test' >&2; exit 2
fi
node -e "const r=require('./qne_v12/QNE_V12_TESTS_LOCAL.json');if(r.status!=='PASSED')process.exit(2);console.log('TEST LOCAL QNE V12:',r.status,'|',r.checks,'controles');"
if [[ -f qne_v12/QNE_V12_BENCH_LOCAL.json ]]; then
  node -e "const r=require('./qne_v12/QNE_V12_BENCH_LOCAL.json');if(r.status!=='PASSED')process.exit(2);console.log('BENCH LOCAL:',r.status);"
fi
git add -- qne_v12
other="$(git diff --cached --name-only | grep -v '^qne_v12/' || true)"
if [[ -n "$other" ]]; then
  echo 'Fichiers deja prepares hors V12, publication arretee :' >&2
  printf '%s\n' "$other" >&2;exit 2
fi
git diff --cached --check
if git diff --cached --quiet; then
  echo 'Aucune modification V12 a enregistrer'; exit 0
fi
git commit -m 'QNE V12 : coordination multi-noeuds, travailleurs, reprise et bench comparatif'
git push origin master
git log -1 --oneline
git status -sb
