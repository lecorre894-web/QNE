#!/usr/bin/env node
'use strict';
/*
 * QNE V3: optimisation additive du jumeau non lineaire Lorenz-96 RK4.
 * Ne modifie pas QNE V2. Baseline et V2 importes depuis ./qne_v2.js.
 * Node.js >=18; uniquement bibliotheques standards.
 */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {baseline,optimized}=require('./qne_v2');
const F=8,DT=0.01,HALF=DT/2,SIXTH=DT/6;
function initial(N){const v=new Float64Array(N);for(let i=0;i<N;i++)v[i]=F+(i%7-3)*0.001;return v;}
function optimizedV3(N){
  if(!Number.isSafeInteger(N)||N<4)throw RangeError('Lorenz-96: N entier >= 4');
  const x=initial(N),acc=new Float64Array(N),tmp=new Float64Array(N),k=new Float64Array(N);
  // Deux passes RK4 centrales. La lecture de tmp est terminee avant son reecriture.
  function derivative(a,out){
    out[0]=(a[1]-a[N-2])*a[N-1]-a[0]+F;
    out[1]=(a[2]-a[N-1])*a[0]-a[1]+F;
    for(let i=2;i<N-1;i++)out[i]=(a[i+1]-a[i-2])*a[i-1]-a[i]+F;
    out[N-1]=(a[0]-a[N-3])*a[N-2]-a[N-1]+F;
  }
  function step(){
    // RK4 k1 : fusion derivee + accumulation + construction de l'etat intermediaire.
    let d=(x[1]-x[N-2])*x[N-1]-x[0]+F;
    acc[0]=d;tmp[0]=x[0]+HALF*d;
    d=(x[2]-x[N-1])*x[0]-x[1]+F;
    acc[1]=d;tmp[1]=x[1]+HALF*d;
    for(let i=2;i<N-1;i++){
      d=(x[i+1]-x[i-2])*x[i-1]-x[i]+F;
      acc[i]=d;tmp[i]=x[i]+HALF*d;
    }
    d=(x[0]-x[N-3])*x[N-2]-x[N-1]+F;
    acc[N-1]=d;tmp[N-1]=x[N-1]+HALF*d;
    // RK4 k2, k3 : pas de fusion avec une ecriture de tmp (dependances du voisinage).
    derivative(tmp,k);
    for(let i=0;i<N;i++){acc[i]+=2*k[i];tmp[i]=x[i]+HALF*k[i];}
    derivative(tmp,k);
    for(let i=0;i<N;i++){acc[i]+=2*k[i];tmp[i]=x[i]+DT*k[i];}
    // RK4 k4 : fusion derivee + mise a jour de x, tmp reste entierement en lecture.
    d=(tmp[1]-tmp[N-2])*tmp[N-1]-tmp[0]+F;
    x[0]+=SIXTH*(acc[0]+d);
    d=(tmp[2]-tmp[N-1])*tmp[0]-tmp[1]+F;
    x[1]+=SIXTH*(acc[1]+d);
    for(let i=2;i<N-1;i++){
      d=(tmp[i+1]-tmp[i-2])*tmp[i-1]-tmp[i]+F;
      x[i]+=SIXTH*(acc[i]+d);
    }
    d=(tmp[0]-tmp[N-3])*tmp[N-2]-tmp[N-1]+F;
    x[N-1]+=SIXTH*(acc[N-1]+d);
  }
  return {x,step};
}
function sameState(a,b){
  if(a.length!==b.length)return {ok:false,index:-1};
  for(let i=0;i<a.length;i++){
    if(!Number.isFinite(a[i])||!Number.isFinite(b[i])||!Object.is(a[i],b[i])){
      return {ok:false,index:i,a:a[i],b:b[i]};
    }
  }
  return {ok:true};
}
function seededFill(x,seed){
  let s=seed>>>0;
  for(let i=0;i<x.length;i++){
    s^=s<<13;s^=s>>>17;s^=s<<5;
    x[i]=F+((s>>>0)/4294967296-0.5)*0.2;
  }
}
function verify(report){
  console.log('\n=== VALIDATION DIFFERENTIELLE RK4 (V2 vs V3) ===');
  // Topologies et bords, plusieurs conditions initiales, chaque valeur comparee.
  for(const N of [4,5,6,7,40,100,4096,65536]){
    const seeds=N<=4096?[0,1,0x12345678,0xcafe1234]:[0,1];
    const rounds=N<=100?200:(N<=4096?40:8);
    for(const seed of seeds){
      const a=optimized(N),b=optimizedV3(N);
      if(seed!==0){seededFill(a.x,seed);b.x.set(a.x);}
      let failure;
      for(let j=0;j<rounds;j++){
        a.step();b.step();
        const test=sameState(a.x,b.x);
        if(!test.ok){failure={step:j+1,...test};break;}
      }
      const passed=!failure;
      report.tests.push({N,seed,rounds,passed,details:failure||null});
      console.log(`${passed?'OK':'ECHEC'} | N=${N}, graine=${seed}, pas=${rounds}, comparaison bit a bit${failure?' : '+JSON.stringify(failure):''}`);
      if(!passed)throw Error('Divergence RK4 N='+N+' seed='+seed);
    }
  }
}
function median(nums){const arr=nums.slice().sort((a,b)=>a-b);return arr[Math.floor(arr.length/2)];}
function runOne(factory,N,steps){
  const t=factory(N);
  for(let i=0;i<5;i++)t.step();
  const before=performance.now();
  for(let i=0;i<steps;i++)t.step();
  const ms=performance.now()-before;
  if(!(ms>0))throw Error('chrono invalide');
  const buffer=Buffer.from(t.x.buffer,t.x.byteOffset,t.x.byteLength);
  return {ms,sha256:crypto.createHash('sha256').update(buffer).digest('hex')};
}
function benchmark(report,large=false){
  console.log('\n=== BENCHMARK 3 MOTEURS, 7 REPETITIONS ===');
  const variants=[['original',baseline],['v2',optimized],['v3',optimizedV3]];
  const sizes=large?[40,4096,65536,262144,1048576]:[40,4096,65536,262144];
  for(const N of sizes){
    const steps=N<=4096?400:N<=65536?80:N<=262144?30:10;
    const timings={original:[],v2:[],v3:[]};
    const hashes={};
    for(let r=0;r<7;r++){
      // Alternance circulaire des trois moteurs, pour limiter le biais d'ordre.
      const order=[...variants.slice(r%3),...variants.slice(0,r%3)];
      if(r%2)order.reverse();
      for(const [name,ctor] of order){
        const result=runOne(ctor,N,steps);
        timings[name].push(result.ms);
        if(hashes[name] && hashes[name]!==result.sha256)throw Error(`hachage instable ${name} N=${N}`);
        hashes[name]=result.sha256;
      }
    }
    if(!(hashes.original===hashes.v2 && hashes.v2===hashes.v3))throw Error(`divergence apres benchmark N=${N}`);
    const med={};for(const [name] of variants)med[name]=median(timings[name]);
    const row={N,steps,repetitions:7,median_ms:med,
      mvariables_s:Object.fromEntries(variants.map(([name])=>[name,N*steps/med[name]/1000])),
      gain_v2_sur_original:med.original/med.v2,
      gain_v3_sur_v2:med.v2/med.v3,
      gain_v3_sur_original:med.original/med.v3,
      all_variants_sha256:hashes.v3,bytes_four_buffers:4*N*8};
    report.benchmarks.push(row);
    console.log(`N=${N} | original ${row.mvariables_s.original.toFixed(2)} M/s | V2 ${row.mvariables_s.v2.toFixed(2)} M/s | V3 ${row.mvariables_s.v3.toFixed(2)} M/s | V3/V2 x${row.gain_v3_sur_v2.toFixed(2)} | SHA256 OK`);
  }
}
function main(){
  const args=new Set(process.argv.slice(2));
  if(args.has('--help')||args.has('-h')){
    console.log('Usage : node qne_v3.js [--verify-only | --bench-only] [--large] [--no-save]');return;
  }
  if(args.has('--verify-only')&&args.has('--bench-only'))throw Error('options contradictoires');
  const report={schema:'QNE-V3/1',created:new Date().toISOString(),node:process.version,
    platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model||'inconnu',
    method:'Medians de 7 repetitions, ordre alterne; 5 pas de warmup hors chronometre',
    test_reference:'Valeurs de V2 comparees element par element par Object.is; hash SHA-256 des 3 moteurs a chaque N.',
    numerical_claim:'Identite bit a bit pour les tests executes; cela ne prouve pas l exactitude analytique de Lorenz-96.',
    tests:[],benchmarks:[],status:'PENDING'};
  let outputError;
  try{
    if(!args.has('--bench-only'))verify(report);
    if(!args.has('--verify-only'))benchmark(report,args.has('--large'));
    report.status='PASSED';
  }catch(e){report.status='FAILED';report.error=e.stack||String(e);outputError=e;process.exitCode=1;console.error('ECHEC : '+e.message);}
  if(!args.has('--no-save')){
    const target=path.join(process.cwd(),'QNE_V3_RESULTATS.json');
    fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
    console.log('Rapport : '+target);
  }
  console.log('STATUT : '+report.status);
  if(outputError)return;
}
if(require.main===module)main();
module.exports={optimizedV3,verify,benchmark};
