#!/usr/bin/env node
'use strict';
// Additive QNE V7: exact-state validation, alternating medians, on-device tuning.
// No use of fast-math; no canonical files are modified.
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const dir=__dirname;
const variants={
 v4:['qne_v4_ref',null,null],
 v6t2:['qne_v6_ref',2,null],
 v6t4:['qne_v6_ref',4,null],
 v7b512t2T2:['qne_v7_512',2,2],
 v7b512t2T4:['qne_v7_512',2,4],
 v7b1024t2T2:['qne_v7_1024',2,2],
 v7b1024t2T4:['qne_v7_1024',2,4],
 v7b1024t4T4:['qne_v7_1024',4,4]
};
const names=Object.keys(variants);
function call(name,mode,N,steps,arg){
 const [exe,threads,T]=variants[name], params=[mode,N,steps,arg];
 if(threads!==null)params.push(threads);
 if(T!==null)params.push(T);
 return cp.execFileSync(path.join(dir,exe),params.map(String),{
  encoding:mode==='--bench'?'utf8':'buffer',
  maxBuffer:mode==='--bench'?65536:Math.max(1048576,N*8+65536),
  timeout:120000
 });
}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function median(a){return [...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];}
function validate(report){
 console.log('=== QNE V7 : comparaison binaire V4 / V6 / V7 ===');
 const specs=[[4,200],[5,200],[7,200],[40,200],[4096,40],[131071,8],[131072,8],[131073,8],[131583,8],[131584,8],[131585,8],[132095,8],[132096,8],[132097,8],[262144,8],[1048576,8]];
 for(const [N,steps] of specs){
  const seeds=(N>=262144 || (N>=131583&&N<=132097))?[0,305419896]:[0,1,305419896,3405648436];
  for(const seed of seeds){
   const ref=call('v4','--state',N,steps,seed);
   const h=sha(ref);
   for(const name of names.slice(1)){
    const v=call(name,'--state',N,steps,seed);
    if(!ref.equals(v)){
     const byte=ref.findIndex((x,i)=>x!==v[i]);
     throw new Error(`DIVERGENCE ${name} : N=${N}, seed=${seed}, pas=${steps}, octet=${byte}`);
    }
    report.verifications++;
   }
   report.cases.push({N,steps,seed,sha256:h});
  }
  console.log(`OK | N=${N} | ${seeds.length} graines | ${steps} pas | ${names.length-1} alternatives`);
 }
}
function time(name,N,steps){
 const ms=Number(call(name,'--bench',N,steps,1).trim());
 if(!Number.isFinite(ms)||ms<=0)throw new Error(`Chronometrage invalide : ${name} N=${N}`);
 return ms;
}
function benchmark(report,reps){
 console.log(`\n=== QNE V7 : calibration locale, ${reps} repetitions alternees ===`);
 const points=[[40,4000],[4096,400],[65536,80],[131072,50],[262144,30],[1048576,12]];
 for(const [N,steps] of points){
  const subset=N<131072?['v4','v6t2','v7b512t2T4']:names;
  const ref=call('v4','--state',N,steps+5,0),h=sha(ref);
  for(const name of subset.slice(1)){
   if(!ref.equals(call(name,'--state',N,steps+5,0)))throw Error(`Ecart pendant benchmark ${name} N=${N}`);
  }
  const times=Object.fromEntries(subset.map(n=>[n,[]]));
  for(let r=0;r<reps;r++){
   const order=(r&1)?[...subset].reverse():subset;
   for(const name of order) times[name].push(time(name,N,steps));
  }
  const med=Object.fromEntries(subset.map(name=>[name,median(times[name])]));
  const best=subset.reduce((a,b)=>med[a]<=med[b]?a:b);
  const rate=Object.fromEntries(subset.map(name=>[name,N*steps/med[name]/1000]));
  const v6Best=med.v6t2!==undefined?Math.min(med.v6t2,med.v6t4??Infinity):null;
  report.benchmarks.push({N,steps,repetitions:reps,median_ms:med,rates_M_s:rate,
   winner:best,gain_over_v4:med.v4/med[best],gain_over_v6:v6Best? v6Best/med[best]:null,
   sha256_common:h,all_times_ms:times});
  console.log(`N=${N} | ${subset.map(name=>`${name}: ${rate[name].toFixed(2)} M/s`).join(' | ')} | gagnant=${best} | SHA256 OK`);
 }
}
function main(){
 const args=new Set(process.argv.slice(2));
 if(args.has('--help')){
  console.log('Usage: node qne_v7.js [--quick] [--verify-only|--bench-only] [--no-save]');return;
 }
 if(args.has('--verify-only')&&args.has('--bench-only'))throw Error('Modes incompatibles');
 for(const [exe] of Object.values(variants))if(!fs.existsSync(path.join(dir,exe)))throw Error(`Binaire ${exe} absent : lancer bash qne_v7/lancement_qne_v7.sh`);
 const report={version:'QNE V7',created:new Date().toISOString(),node:process.version,
  cpu:os.cpus()?.[0]?.model||'?',platform:process.platform,arch:process.arch,
  method:'Lorenz-96 float64, F=8, dt=0.01; RK4 bitwise exact vs V4 on checked cases; V7 temporal tile, T=2/4',
  disclaimer:'Bitwise equivalent for tested cases only; no claim of mathematical solution exactness or universal speedup.',
  verifications:0,cases:[],benchmarks:[],status:'PENDING'};
 try{
  if(!args.has('--bench-only'))validate(report);
  if(!args.has('--verify-only'))benchmark(report,args.has('--quick')?3:7);
  report.status='PASSED';
 }catch(e){report.status='FAILED';report.error=String(e.stack||e);process.exitCode=1;console.error(report.error);}
 if(!args.has('--no-save')){
  const target=path.join(dir,'QNE_V7_RESULTATS.json');
  fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
  console.log('Rapport : '+target);
  if(report.status==='PASSED'&&report.benchmarks.length){
   const profile={version:7,created:report.created,system:'local',method:'nearest log2 N (measured choices)',
    rows:report.benchmarks.map(x=>({N:x.N,winner:x.winner,median_ms:x.median_ms}))};
   const filename=path.join(dir,'QNE_V7_PROFIL.json');
   fs.writeFileSync(filename,JSON.stringify(profile,null,2)+'\n');
   console.log('Profil : '+filename);
  }
 }
 console.log('VALIDATION : '+report.status);
 if(report.benchmarks.length){
  const max=Math.max(...report.benchmarks.map(x=>x.gain_over_v4));
  console.log('Meilleur gain observe vs V4 : x'+max.toFixed(2));
  console.log('OBJECTIF x100 : '+(max>=100?'ATTEINT DANS UN CAS TESTE':'NON ATTEINT'));
 }
}
if(require.main===module) main();
