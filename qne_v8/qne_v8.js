#!/usr/bin/env node
'use strict';
// QNE V8 additive: temporal tiling T=8, fallback to V7/V4, paired performance verification.
// RK4 float64 F=8 dt=0.01; compare *exact bytes* against V4 before benchmarking.
const cp=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const os=require('node:os');
const dir=__dirname;
const V={
  v4:['qne_v4_ref',null,null],
  v7b1024t2T4:['qne_v7_1024',2,4],
  v7b1024t4T4:['qne_v7_1024',4,4],
  v8b1024t2T8:['qne_v8_1024',2,8],
  v8b1024t4T8:['qne_v8_1024',4,8],
  v8b2048t2T8:['qne_v8_2048',2,8],
  v8b2048t4T8:['qne_v8_2048',4,8]
};
const names=Object.keys(V);
function call(name,mode,N,steps,extra){
 const [exe,threads,T]=V[name];
 const a=[mode,N,steps,extra];
 if(threads!==null)a.push(threads);
 if(T!==null)a.push(T);
 return cp.execFileSync(path.join(dir,exe),a.map(String),{
  encoding:mode==='--bench'?'utf8':'buffer',
  maxBuffer:mode==='--state'?Math.max(N*8+65536,1048576):65536,
  timeout:180000
 });
}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const med=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const fmt=x=>x.toFixed(2);
function validate(report){
 console.log('=== QNE V8 : validation binaire V4 / V7 / V8 ===');
 const specs=[[4,200],[5,200],[7,200],[40,200],[4096,40],
 [131071,8],[131072,8],[131073,8],[132095,8],[132096,8],[132097,8],
 [133119,8],[133120,8],[133121,8],[262144,8],[1048576,8]];
 for(const [N,steps] of specs){
  const seeds=N>=262144?[0,305419896]:[0,1,305419896,3405648436];
  for(const seed of seeds){
   const ref=call('v4','--state',N,steps,seed);
   for(const name of names.slice(1)){
    const actual=call(name,'--state',N,steps,seed);
    if(!ref.equals(actual)){
     const idx=ref.findIndex((v,i)=>actual[i]!==v);
     throw Error(`ERREUR ${name} N=${N} seed=${seed} pas=${steps} premier octet=${idx}`);
    }
    report.verifications++;
   }
   report.cases.push({N,steps,seed,sha256:hash(ref)});
  }
  console.log(`OK | N=${N} | graines=${seeds.length} | pas=${steps} | alternatives=${names.length-1}`);
 }
}
function measure(name,N,steps){
 const ms=Number(call(name,'--bench',N,steps,1).trim());
 if(!Number.isFinite(ms)||ms<=0)throw Error(`Chronometrage invalide ${name}, ${N}`);
 return ms;
}
function benchmark(report,reps){
 console.log(`\n=== QNE V8 : V4/V7/V8, ${reps} passages alternes ===`);
 const points=[[40,4000],[4096,400],[65536,80],[131072,50],[262144,30],[1048576,12]];
 for(const [N,steps] of points){
  // No temporal tiling below N=131072: it uses the V4-like scalar fast path.
  const variants=N<131072?['v4','v7b1024t2T4','v8b1024t2T8']:names;
  const ref=call('v4','--state',N,steps+5,0);
  for(const name of variants.slice(1)){
   if(!ref.equals(call(name,'--state',N,steps+5,0)))throw Error('Divergence en phase benchmark '+name+' N='+N);
  }
  const times=Object.fromEntries(variants.map(x=>[x,[]]));
  for(let k=0;k<reps;k++){
   for(const name of k%2?[...variants].reverse():variants){times[name].push(measure(name,N,steps));}
  }
  const median_ms=Object.fromEntries(variants.map(n=>[n,med(times[n])]));
  const winnerRaw=variants.reduce((a,b)=>median_ms[a]<median_ms[b]?a:b);
  const v7Best=variants.filter(x=>x.startsWith('v7')).reduce((a,b)=>median_ms[a]<median_ms[b]?a:b);
  const prior=median_ms.v4<=median_ms[v7Best]?'v4':v7Best;
  // Avoid switching to V8 for a <=5% performance difference (noise/thermals).
  const winner=N<131072?'v4':(winnerRaw.startsWith('v8') && median_ms[winnerRaw]>median_ms[prior]*0.95 ? prior : winnerRaw);
  const rates_M_s=Object.fromEntries(variants.map(name=>[name,N*steps/(median_ms[name]*1000)]));
  report.benchmarks.push({N,steps,repetitions:reps,median_ms,all_times_ms:times,rates_M_s,
   winner_raw:winnerRaw,winner_selected:winner,comparison_v7_best:v7Best,
   gain_selected_over_v4:median_ms.v4/median_ms[winner],
   gain_selected_over_v7:median_ms[v7Best]/median_ms[winner],
   sha256_common:hash(ref)});
  console.log(`N=${N} | V4 ${fmt(rates_M_s.v4)} M/s | meilleur V7 ${fmt(rates_M_s[v7Best])} M/s | `+
   `meilleur brut ${winnerRaw} ${fmt(rates_M_s[winnerRaw])} M/s | retenu=${winner} | SHA256 OK`);
 }
}
function main(){
 const flags=new Set(process.argv.slice(2));
 if(flags.has('--help')){console.log('node qne_v8.js [--quick|--verify-only|--bench-only|--no-save]');return;}
 if(flags.has('--verify-only')&&flags.has('--bench-only'))throw Error('Modes exclusifs');
 for(const [exe] of Object.values(V))if(!fs.existsSync(path.join(dir,exe)))throw Error(`Executable manquant: ${exe}. Lancer bash qne_v8/lancement_qne_v8.sh`);
 const report={version:'QNE V8',date:new Date().toISOString(),platform:process.platform,arch:process.arch,
  node:process.version,cpu:os.cpus()?.[0]?.model||'inconnu',
  scope:'Lorenz-96 RK4 float64, F=8, dt=0.01, operations sans fast-math ni fusion FMA.',
  caveat:'Identite binaire pour cas testes; pas de preuve de precision continue ni de gain universel.',
  verifications:0,cases:[],benchmarks:[],status:'PENDING'};
 try{
  if(!flags.has('--bench-only'))validate(report);
  if(!flags.has('--verify-only'))benchmark(report,flags.has('--quick')?3:7);
  report.status='PASSED';
 }catch(e){report.status='FAILED';report.error=String(e.stack||e);console.error(report.error);process.exitCode=1;}
 if(!flags.has('--no-save')){
  const file=path.join(dir,'QNE_V8_RESULTATS.json');fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
  console.log('Rapport : '+file);
  if(report.status==='PASSED'&&report.benchmarks.length){
   const profile={version:8,created:report.date,method:'nearest log2(N); minimum +5% vs best historical engine before V8 selected',
    rows:report.benchmarks.map(b=>({N:b.N,winner:b.winner_selected,medians:b.median_ms}))};
   const dest=path.join(dir,'QNE_V8_PROFIL.json');fs.writeFileSync(dest,JSON.stringify(profile,null,2)+'\n');
   console.log('Profil : '+dest);
  }
 }
 console.log('VALIDATION : '+report.status);
 if(report.benchmarks.length){
  const g=Math.max(...report.benchmarks.map(b=>b.gain_selected_over_v4));
  console.log('Meilleur gain sur V4 dans ce test : x'+g.toFixed(2));
  console.log('OBJECTIF x100 sur non-lineaire : '+(g>=100?'OBSERVE SUR UN CAS':'NON ATTEINT'));
 }
}
main();
