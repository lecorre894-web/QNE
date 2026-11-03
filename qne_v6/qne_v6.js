#!/usr/bin/env node
'use strict';
// QNE V6: independent verification, benchmark, on-device profiling. No canonical-file edits.
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dir=__dirname;
const variants={v4:{exe:'qne_v4_ref',threads:null},v5:{exe:'qne_v5_ref',threads:null},v6t1:{exe:'qne_v6_native',threads:1},v6t2:{exe:'qne_v6_native',threads:2},v6t4:{exe:'qne_v6_native',threads:4}};
const names=Object.keys(variants);
const sha=x=>createHash('sha256').update(x).digest('hex');
function run(which,mode,N,steps,arg){
  const v=variants[which];
  const params=[mode,N,steps,arg];
  if(v.threads!==null)params.push(v.threads);
  const raw=mode==='--state';
  return execFileSync(path.join(dir,v.exe),params.map(String),{
    encoding:raw?'buffer':'utf8',
    maxBuffer:raw?N*8+65536:65536,timeout:180000
  });
}
function median(ar){const a=[...ar].sort((a,b)=>a-b);return a[Math.floor(a.length/2)];}
function verification(report){
  console.log('=== QNE V6 : controles binaires V4 / V5 / V6 (1,2,4 threads) ===');
  const sizes=[4,5,7,40,4096,8192,65536,131071,131072,131073,262144,1048576];
  for(const N of sizes){
    const steps=N<=40?200:N<=4096?40:8;
    for(const seed of [0,1,305419896,3405648436]){
      const reference=run('v4','--state',N,steps,seed), h=sha(reference);
      for(const name of names.slice(1)){
        const out=run(name,'--state',N,steps,seed);
        if(!reference.equals(out)){
          const i=reference.findIndex((byte,index)=>out[index]!==byte);
          throw Error(`DIVERGENCE ${name}, N=${N}, graine=${seed}, octet=${i}`);
        }
      }
      report.validations.push({N,steps,seed,sha256:h,identical:true});
    }
    console.log(`OK | N=${N} | 4 graines | ${steps} pas | 4 moteurs contre V4`);
  }
}
function time(name,N,steps){
  const s=run(name,'--bench',N,steps,1).trim();
  const n=Number(s);
  if(!Number.isFinite(n)||n<=0)throw Error(`Invalid time ${name} N=${N}: ${s}`);
  return n;
}
function benchmarks(report,repetitions){
  console.log(`\n=== QNE V6 : benchmark sur cette machine, ${repetitions} repetitions alternees ===`);
  for(const [N,steps] of [[40,4000],[4096,400],[65536,80],[262144,30],[1048576,10]]){
    const ref=run('v4','--state',N,steps+5,0);
    const H=sha(ref);
    for(const name of names.slice(1))if(!run(name,'--state',N,steps+5,0).equals(ref))throw Error(`ETAT DIVERGENT en benchmark : ${name} N=${N}`);
    const arrays=Object.fromEntries(names.map(n=>[n,[]]));
    for(let k=0;k<repetitions;k++){
      const order=k%2===0?names:[...names].reverse();
      for(const name of order)arrays[name].push(time(name,N,steps));
    }
    const ms=Object.fromEntries(names.map(name=>[name,median(arrays[name])]));
    const speed=Object.fromEntries(names.map(name=>[name,N*steps/ms[name]/1000]));
    const fastest=names.reduce((a,b)=>ms[a]<=ms[b]?a:b);
    const speedup=ms.v4/ms[fastest];
    report.benchmarks.push({N,steps,repetitions,median_ms:ms,millions_per_second:speed,
      speedup_over_v4:speedup,winner:fastest,sha256_common:H,times_ms:arrays});
    console.log(`N=${N} | ${names.map(name=>`${name}: ${speed[name].toFixed(2)} M/s`).join(' | ')} | meilleur=${fastest} | x${speedup.toFixed(2)} vs V4 | SHA256 OK`);
  }
}
function main(){
 const flags=new Set(process.argv.slice(2));
 if(flags.has('--help')){console.log('Usage: node qne_v6.js [--quick] [--verify-only|--bench-only] [--no-save]');return;}
 if(flags.has('--verify-only')&&flags.has('--bench-only'))throw Error('Options incompatibles');
 for(const variant of Object.values(variants))if(!fs.existsSync(path.join(dir,variant.exe)))throw Error('Binaires absents : bash qne_v6/lancement_qne_v6.sh');
 const report={version:'QNE-V6/1',date:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,
  cpu:os.cpus()[0]?.model||'unknown',method:'Lorenz-96 RK4, F=8, dt=0.01, float64; C++ strict FP; V6 hybride direct / blocs multithread',
  note:'Mesure locale. Des etats binaires identiques ne prouvent pas la fidelite a la solution continue. Le multithread peut etre plus lent selon la machine.',
  status:'PENDING',validations:[],benchmarks:[]};
 try{
  if(!flags.has('--bench-only'))verification(report);
  if(!flags.has('--verify-only'))benchmarks(report,flags.has('--quick')?3:7);
  report.status='PASSED';
 }catch(e){report.status='FAILED';report.error=String(e.stack||e);process.exitCode=1;console.error(report.error);}
 if(!flags.has('--no-save')){
  const target=path.join(dir,'QNE_V6_RESULTATS.json');
  fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
  console.log('Rapport : '+target);
  if(report.status==='PASSED'&&report.benchmarks.length){
   const profile={version:1,created:report.date,origin:'mesure locale QNE V6',algorithm:'nearest log2 N, no interpolation',
    candidates:names,rows:report.benchmarks.map(({N,winner,millions_per_second,median_ms})=>({N,winner,millions_per_second,median_ms}))};
   const p=path.join(dir,'QNE_V6_PROFIL.json');fs.writeFileSync(p,JSON.stringify(profile,null,2)+'\n');console.log('Profil : '+p);
  }
 }
 console.log('VALIDATION : '+report.status);
 if(report.benchmarks.length){
  const maxGain=Math.max(...report.benchmarks.map(b=>b.speedup_over_v4));
  console.log('Meilleur gain V6 / V4 observe : x'+maxGain.toFixed(2));
  console.log('OBJECTIF x100 : '+(maxGain>=100?'ATTEINT POUR UN CAS TESTE':'NON ATTEINT'));
 }
}
if(require.main===module)main();
