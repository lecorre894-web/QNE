#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
for f in qne_v13/QNE_V13_TESTS_LOCAL.json qne_v13/QNE_V13_BENCH_LOCAL.json; do
  if [[ ! -f "$f" ]];then echo "Rapport manquant : $f ; lancer --test puis --bench" >&2;exit 2;fi
done
node - <<'NODE'
const test=require('./qne_v13/QNE_V13_TESTS_LOCAL.json');
const bench=require('./qne_v13/QNE_V13_BENCH_LOCAL.json');
if(test.status!=='PASSED'||test.checks<15||bench.status!=='PASSED'||!bench.all_outputs_verified||!bench.summary?.unique?.gain_cumulatif_direct||!bench.summary?.repeated?.gain_cumulatif_direct){console.error('Tests/bench non valides');process.exit(2)}
console.log('QNE V13 : validation locale PASS | tests='+test.checks+' | repeated x'+bench.summary.repeated.gain_cumulatif_direct+' | unique x'+bench.summary.unique.gain_cumulatif_direct);
NODE
# No add -A; never include sparse vr_*.bin or unrelated work.
git add -- qne_v13
others="$(git diff --cached --name-only | grep -v '^qne_v13/' || true)"
if [[ -n "$others" ]];then echo 'Autres fichiers prepares, publication interrompue :' >&2;printf '%s\n' "$others";exit 2;fi
git diff --cached --check
if git diff --cached --quiet;then echo 'QNE V13 est deja enregistre localement';exit 0;fi
git commit -m 'QNE V13 : amplificateurs cooperatifs, cache partage et gains cumules mesures'
git push origin master
git log -1 --oneline
git status -sb
