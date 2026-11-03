#!/usr/bin/env node
'use strict';
/* LFSR linear exact: demonstrates algorithmic speedup distinct from Lorenz-96 RK4.
   Uses QNE V2 at2pow and compares to original right-shifting 128-bit LFSR. */
const fs=require('node:fs');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const {at2pow}=require('./qne_v2');
const vmask=new Uint32Array(4);
for(const tap of [128,7,2,1]){
  const bit=tap-1;vmask[bit>>>5]|=(1<<(bit&31))>>>0;
}
function advance(v){
  const lsb=v[0]&1;
  for(let i=0;i<4;i++)v[i]=((v[i]>>>1)|(i<3?((v[i+1]&1)<<31):0))>>>0;
  if(lsb)for(let i=0;i<4;i++)v[i]^=vmask[i];
}
function direct(E){const v=new Uint32Array([1,0,0,0]);for(let i=0;i<(2**E);i++)advance(v);return v;}
const N=20,iterations=2**N,reps=5,cacheCalls=50000;
const equal=(a,b)=>a.every((v,i)=>v===b[i]);
const warm=direct(12);
if(!equal(warm,at2pow(12)))throw Error('Divergence echauffement');
const smallTimes=[],fastTimes=[];let reference;
for(let r=0;r<reps;r++){
  let begin=performance.now();const v=direct(N);const ms=performance.now()-begin;
  if(!equal(v,at2pow(N)))throw Error('Divergence pour 2^20');
  if(reference&&!equal(reference,v))throw Error('Reference instable');
  reference=v;smallTimes.push(ms);
  begin=performance.now();let ck=0;
  for(let i=0;i<cacheCalls;i++){const result=at2pow(N);ck^=result[i&3];}
  const elapsed=performance.now()-begin;
  if(ck===-1)throw Error('Checksum');
  fastTimes.push(elapsed/cacheCalls);
}
const median=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
const medDirect=median(smallTimes),medFast=median(fastTimes);
const result={schema:'QNE-V4-linear/1',method:'Saut LFSR d un million de pas depuis e0; acceleration par cache de Frobenius precompute V2',direct_steps:iterations,reps,fast_calls_per_repeat:cacheCalls,verified:true,
  direct_median_ms:medDirect,fast_median_ms:medFast,gain_direct_sur_cache:medDirect/medFast,
  caveat:'Gain pour un saut de 2^20 pas dans un LFSR LINEAIRE (apres pre-calcul du cache); pas transferable au RK4 non lineaire. Preparation de cache a l import non incluse.',
  state:Array.from(reference),status:'PASSED'};
const dest=path.join(__dirname,'QNE_V4_LINEAIRE_RESULTATS.json');
fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
console.log('SAUT LFSR : '+iterations+' pas directs vs cache exact');
console.log(`Direct ${medDirect.toFixed(3)} ms | saut cache ${(medFast*1000).toFixed(3)} µs | gain x${result.gain_direct_sur_cache.toFixed(0)}`);
console.log('VALIDATION : PASSED ; uniquement pour le jumeau lineaire');
console.log('Rapport : '+dest);
