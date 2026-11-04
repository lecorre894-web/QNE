#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
for f in qne_v14/QNE_V14_TESTS_LOCAL.json qne_v14/QNE_V14_BENCH_LOCAL.json;do
 [[ -s "$f" ]] || { echo "Rapport manquant : $f. Lancer --test et --bench" >&2;exit 2;}
done
node - <<'NODE'
const t=require('./qne_v14/QNE_V14_TESTS_LOCAL.json');
const b=require('./qne_v14/QNE_V14_BENCH_LOCAL.json');
if(t.status!=='PASSED'||t.checks<18||b.status!=='PASSED'||!b.all_results_verified||b.repetitions<2||!b.summary?.repeated?.verified_telescopic||!b.summary?.unique?.verified_telescopic)throw Error('Validation manquante');
console.log('QNE V14 : controles '+t.checks+' | gain mesure repeated x'+b.summary.repeated.direct_gain_P0_P5+' | unique x'+b.summary.unique.direct_gain_P0_P5);
NODE
# Only the new folder is staged. No sparse vr_*.bin or unrelated sources.
git add -- qne_v14
foreign="$(git diff --cached --name-only | grep -v '^qne_v14/' || true)"
if [[ -n "$foreign" ]];then echo "Fichiers autres que V14 deja prepares :" >&2;printf '%s\n' "$foreign" >&2;exit 2;fi
git diff --cached --check
if git diff --cached --quiet;then echo 'QNE V14 est deja dans Git';git status -sb;exit 0;fi
git commit -m 'QNE V14 : gains incrementaux par paliers, lots et fastpath borne'
git push origin master
git log -1 --oneline
git status -sb
