#!/usr/bin/env node
'use strict';
// V5: validation octet-pour-octet et benchmark natif V4/V5, sans changer les versions anterieures.
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const base = __dirname;
const files = {v4:path.join(base,'qne_v4_ref'),v5:path.join(base,'qne_v5_native')};
function call(bin,argv,raw=false){
  return execFileSync(files[bin], argv.map(String), {
    encoding:raw ? 'buffer' : 'utf8', maxBuffer: raw ? Math.max(8192,Number(argv[1])*8+8192) : 8192, timeout:180000
  });
}
function hash(b){return createHash('sha256').update(b).digest('hex');}
function median(a){const s=a.slice().sort((x,y)=>x-y);return s[Math.floor(s.length/2)];}
function verify(report){
  console.log('=== QNE V5 : V4 versus V5, egalite binaire ===');
  for(const N of [4,5,6,7,40,100,255,256,511,512,513,1024,4096,8191,8192,8193,65536,65537,262144]){
    const steps = N<=100 ? 200 : N<=4096 ? 40 : 8;
    for(const seed of [0,1,305419896,3405648436]){
      const args=['--state',N,steps,seed];
      const old=call('v4',args,true),cur=call('v5',args,true);
      const ok=old.equals(cur);
      report.validations.push({N,steps,seed,ok,sha256:ok?hash(cur):null});
      console.log(`${ok?'OK':'ECHEC'} | N=${N}, graine=${seed}, ${steps} pas, SHA256 ${ok?'OK':'DIFFERENT'}`);
      if(!ok){let j=0;while(j<old.length && old[j]===cur[j])j++;
        throw Error(`Divergence N=${N} graine=${seed} variable=${Math.floor(j/8)}`);
      }
    }
  }
}
function singleTime(mode,N,steps){
  const s=call(mode,['--bench',N,steps,1]).trim();const value=Number(s);
  if(!(value>0 && Number.isFinite(value)))throw Error('Chronometre incorrect : '+s);
  return value;
}
function bench(report,reps){
  console.log(`\n=== QNE V5 : benchmark natif V4 / V5 (${reps} repetitions) ===`);
  for(const [N,steps] of [[40,4000],[4096,400],[65536,80],[262144,30],[1048576,10]]){
    const ts={v4:[],v5:[]};
    const a=call('v4',['--state',N,steps+5,0],true);
    const b=call('v5',['--state',N,steps+5,0],true);
    if(!a.equals(b))throw Error(`SHA256 benchmark divergent N=${N}`);
    for(let r=0;r<reps;r++){
      const order=r%2===0?['v4','v5']:['v5','v4'];
      for(const variant of order)ts[variant].push(singleTime(variant,N,steps));
    }
    const med={v4:median(ts.v4),v5:median(ts.v5)};
    const speed={v4:N*steps/med.v4/1000,v5:N*steps/med.v5/1000};
    const gain=med.v4/med.v5;
    report.benchmarks.push({N,steps,repetitions:reps,median_ms:med,million_updates_per_second:speed,
      gain_v5_over_v4:gain,sha256_common:hash(a),times_ms:ts});
    console.log(`N=${N} | V4 ${speed.v4.toFixed(2)} M/s | V5 ${speed.v5.toFixed(2)} M/s | V5/V4 x${gain.toFixed(2)} | SHA256 OK`);
  }
}
function main(){
  const flags=new Set(process.argv.slice(2));
  if(flags.has('--help')){console.log('Usage: node qne_v5.js [--verify-only | --bench-only] [--quick] [--no-save]');return;}
  if(flags.has('--verify-only')&&flags.has('--bench-only'))throw Error('Options incompatibles');
  for(const file of Object.values(files))if(!fs.existsSync(file))throw Error(`Executable absent: ${file} ; lancer bash qne_v5/lancement_qne_v5.sh`);
  const report={version:'QNE-V5/1',date:new Date().toISOString(),platform:process.platform,arch:process.arch,
    node:process.version,cpu:os.cpus()[0]?.model||'inconnu',
    algorithm:'RK4 Lorenz-96 strict FP; V5 blocs avec halos; direct pour N<8192',
    test:'V4 copie non modifiee; comparaison de chaque octet de la sortie double; medians de repetitions alternees, 5 pas d amorcage',
    note:'Performance native mesuree dans le processus; aucun debut de programme ou compilation chronometre. Un seul thread. Ces benchmarks ne prouvent pas l exactitude de l ODE continue.',
    target_x100_over_v4:false,status:'PENDING',validations:[],benchmarks:[]};
  let failed;
  try{
    if(!flags.has('--bench-only'))verify(report);
    if(!flags.has('--verify-only'))bench(report,flags.has('--quick')?3:7);
    report.status='PASSED';
    report.target_x100_over_v4=report.benchmarks.length>0 && report.benchmarks.every(b=>b.gain_v5_over_v4>=100);
  }catch(e){failed=e;report.status='FAILED';report.error=String(e.stack||e);process.exitCode=1;console.error(e.stack||e);}
  if(!flags.has('--no-save')){
    const outfile=path.join(base,'QNE_V5_RESULTATS.json');
    fs.writeFileSync(outfile,JSON.stringify(report,null,2)+'\n');console.log('Rapport : '+outfile);
  }
  console.log('VALIDATION : '+report.status);
  if(report.benchmarks.length)console.log('OBJECTIF x100 SUR LE NON-LINEAIRE : '+(report.target_x100_over_v4?'ATTEINT':'NON ATTEINT'));
  if(failed)return;
}
if(require.main===module)main();
