#!/usr/bin/env node
'use strict';
/* QNE V4 -- benchmark and independent bitwise parity for native C++ RK4.
 * Purely additive; no writes to V2/V3/canonical source.
 * Compile the C++ source first using lancement_qne_v4.sh.
 */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {execFileSync}=require('node:child_process');
const {optimizedV3}=require('./qne_v3');
const {baseline}=require('./qne_v2');
const base=__dirname;
const native=path.join(base,'qne_v4_native');
function initialSeeded(x,seed){
  let s=seed>>>0;
  for(let i=0;i<x.length;i++){
    s^=s<<13;s^=s>>>17;s^=s<<5;
    x[i]=8+((s>>>0)/4294967296-0.5)*0.2;
  }
}
function buf(x){return Buffer.from(x.buffer,x.byteOffset,x.byteLength);}
function digest(buffer){return crypto.createHash('sha256').update(buffer).digest('hex');}
function runStateJS(N,steps,seed=0){
  const t=optimizedV3(N);
  if(seed)initialSeeded(t.x,seed);
  for(let j=0;j<steps;j++)t.step();
  return buf(t.x);
}
function runStateNative(N,steps,seed=0){
  return execFileSync(native,['--state',String(N),String(steps),String(seed)],{
    maxBuffer:N*8+4096,encoding:'buffer',timeout:120000,
  });
}
function validate(report){
  console.log('=== QNE V4 : validation native vs JS V3, octet pour octet ===');
  for(const N of [4,5,6,7,40,100,4096,65536]){
    const steps=N<=100?200:N<=4096?40:8;
    for(const seed of [0,1,0x12345678,0xcafe1234]){
      const a=runStateJS(N,steps,seed);
      const b=runStateNative(N,steps,seed);
      const ok=a.equals(b);
      report.validations.push({N,steps,seed,ok,sha256:ok?digest(a):null});
      console.log(`${ok?'OK':'ECHEC'} | N=${N}, graine=${seed}, ${steps} pas, identite binaire`);
      if(!ok){let i=0;for(;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])break;
        throw Error(`Divergence N=${N} seed=${seed} indice_variable=${Math.floor(i/8)}`);
      }
    }
  }
}
function median(xs){const v=xs.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)];}
function runJS(factory,N,steps){
  const t=factory(N);
  for(let i=0;i<5;i++)t.step();
  const a=performance.now();
  for(let i=0;i<steps;i++)t.step();
  const ms=performance.now()-a;
  return {ms, sha256:digest(buf(t.x))};
}
function runNative(N,steps){
  // Le binaire realise son propre chronometrage interne, SANS le cout du processus.
  const output=execFileSync(native,['--bench',String(N),String(steps),'1'],{
    encoding:'utf8',timeout:120000
  }).trim();
  const ms=Number(output);
  if(!Number.isFinite(ms)||ms<=0)throw Error('Chrono natif invalide '+output);
  return ms;
}
function benchmark(report,reps=7){
  console.log(`\n=== QNE V4 : comparaison originale / V3 / natif (${reps} repetitions) ===`);
  const sizes=[40,4096,65536,262144];
  for(const N of sizes){
    const steps=N===40?4000:N<=4096?400:N<=65536?80:30;
    const times={original:[],v3:[],native:[]};
    // Amorce V8 pour eviter d inclure les premieres compilations JIT dans N=40.
    for(let j=0;j<3;j++){runJS(baseline,N,Math.min(steps,100));runJS(optimizedV3,N,Math.min(steps,100));}
    const hash={original:null,v3:null};
    for(let i=0;i<reps;i++){
      const order=(i%2===0)?['original','v3','native']:['native','v3','original'];
      for(const variant of order){
        if(variant==='native')times.native.push(runNative(N,steps));
        else{
          const result=runJS(variant==='original'?baseline:optimizedV3,N,steps);
          if(hash[variant]&&hash[variant]!==result.sha256)throw Error('Hash variable pour '+variant);
          hash[variant]=result.sha256;
          times[variant].push(result.ms);
        }
      }
    }
    if(hash.original!==hash.v3)throw Error(`Divergence JS original/V3 pour N=${N}`);
    const expected=digest(runStateNative(N,steps+5,0));
    if(expected!==hash.v3)throw Error(`Divergence native/JS pour N=${N} dans benchmark`);
    const med={original:median(times.original),v3:median(times.v3),native:median(times.native)};
    const ms={};for(const name of Object.keys(med))ms[name]=N*steps/med[name]/1000;
    const row={N,steps,repetitions:reps,median_ms:med,mvariables_s:ms,
      gain_v3_sur_original:med.original/med.v3,
      gain_natif_sur_v3:med.v3/med.native,
      gain_natif_sur_original:med.original/med.native,
      sha256_identique:expected,timings_ms:times};
    report.benchmarks.push(row);
    console.log(`N=${N} | Original ${ms.original.toFixed(2)} M/s | V3 ${ms.v3.toFixed(2)} M/s | natif ${ms.native.toFixed(2)} M/s | natif/V3 x${row.gain_natif_sur_v3.toFixed(2)} | SHA256 OK`);
  }
}
function main(){
  const args=new Set(process.argv.slice(2));
  if(args.has('--help')||args.has('-h')){console.log('Usage: node qne_v4.js [--verify-only | --bench-only] [--quick] [--no-save]');return;}
  if(!fs.existsSync(native))throw Error('Binaire absent : lancer bash lancement_qne_v4.sh');
  if(args.has('--verify-only')&&args.has('--bench-only'))throw Error('Options contradictoires');
  const report={schema:'QNE-V4/1',created:new Date().toISOString(),node:process.version,
    platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model||'inconnu',
    target_speedup_vs_v3:100,
    note:'Le backend C++ utilise double, RK4 et une association FP identiques a V3; -ffp-contract=off -fno-fast-math. Vitesse natif calculee exclusivement sur temps interne au processus, sans compilation/lancement. Temps JS sur performance.now().',
    scope:'Performance de calcul RK4 seulement, pas performance globale du systeme QNE.',
    validations:[],benchmarks:[],status:'PENDING',target_reached:null};
  let error;
  try {
    if(!args.has('--bench-only'))validate(report);
    if(!args.has('--verify-only'))benchmark(report,args.has('--quick')?3:7);
    report.status='PASSED';
    report.target_reached=report.benchmarks.length>0 && report.benchmarks.every(v=>v.gain_natif_sur_v3>=100);
  }catch(e){report.status='FAILED';report.error=e.stack||String(e);error=e;process.exitCode=1;console.error(e.stack||String(e));}
  if(!args.has('--no-save')){
    const target=path.join(base,'QNE_V4_RESULTATS.json');
    fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
    console.log('Rapport : '+target);
  }
  console.log(`VALIDATION : ${report.status}`);
  if(report.benchmarks.length)console.log(`OBJECTIF x100 : ${report.target_reached?'ATTEINT':'NON ATTEINT'}`);
  if(error)return;
}
if(require.main===module)main();
