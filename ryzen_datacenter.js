








'use strict';
// QNE RYZEN x DATACENTER — tout le centre, tous les coeurs. Chaque coffre gf128 est reparti
// sur les T threads du CPU ; les regions non repliables rendent leur agregat par formule directe ;
// on recombine et on verifie le XOR global du centre. Combinaison zetta-workforce + Ryzen complet.
const {Worker,isMainThread,workerData,parentPort}=require('node:worker_threads');
const os=require('node:os');
const R=require('./qne_v15/lib/reconstruct.js');
const {mul,pow,geometrical,gf128,periodic,fill,patches,lorenz96,literal,size,xorAll,hex,QNE,sha}=R;
const g=2n;
const worker=(seed,L,W,k)=>{if(k>=L)return 0n;const c=(L-1n-k)/W+1n;return mul(mul(seed,pow(g,k)),geometrical(pow(g,W),c).s);};

if(!isMainThread){
 const {seedHex,Lstr,Wstr,lo,hi}=workerData;
 const seed=BigInt(seedHex),L=BigInt(Lstr),W=BigInt(Wstr);
 let acc=0n;for(let k=BigInt(lo);k<BigInt(hi);k++)acc^=worker(seed,L,W,k);
 parentPort.postMessage('0x'+acc.toString(16));
}else{
 (async()=>{
  const T=os.cpus().length;
  const W=BigInt(process.argv[2]||'15000');

  const regions=[];const add=(n,d)=>regions.push({name:n,desc:d,kind:d.kind,size:size(d)});
  add('coffre-zetta', gf128(0x9e3779b97f4a7c15f39cc0605cedc835n,10n**21n));
  add('coffre-yotta', gf128(0xc2b2ae3d27d4eb4f1656667213edc835n,10n**24n));
  add('coffre-audela',gf128(0x0123456789abcdeffedcba9876543210n,10n**40n));
  add('periodique',   periodic(Buffer.from('QNE-RENE-'),10n**15n));
  add('patches',      patches(fill(0x00,10n**9n),[{at:0,data:Buffer.from('ENTETE-QNE-V16!!').toString('base64')}]));
  (function(){const N=64,s=9;const e=QNE.optimized(N);for(let i=0;i<s;i++)e.step();const o=Buffer.alloc(N*8);for(let i=0;i<N;i++)o.writeDoubleLE(e.x[i],i*8);add('lorenz96',lorenz96(N,s,sha(o)));})();

  const runRegionParallel=(seedHex,L)=>{
   const Wn=Number(W),chunk=Math.ceil(Wn/T);
   return Promise.all(Array.from({length:T},(_,i)=>{
    const lo=i*chunk,hi=Math.min(Wn,(i+1)*chunk);
    if(lo>=hi)return Promise.resolve('0x0');
    return new Promise((res,rej)=>{const w=new Worker(__filename,{workerData:{seedHex,Lstr:L.toString(),Wstr:W.toString(),lo,hi}});w.on('message',res);w.on('error',rej);});
   })).then(parts=>{let a=0n;for(const p of parts)a^=BigInt(p);return a;});
  };

  console.log('===== QNE RYZEN x DATACENTER : tout le centre, tous les coeurs =====');
  console.log('CPU : '+T+' threads | '+W+' workers par coffre gf128 | '+regions.length+' regions');

  const s0=BigInt('0x0123456789abcdeffedcba9876543210'),L0=(10n**40n)/16n;
  const M0=300n,tb=process.hrtime.bigint();let bb=0n;for(let k=0n;k<M0;k++)bb^=worker(s0,L0,W,k);
  const perWorker=Number(process.hrtime.bigint()-tb)/1e9/Number(M0);

  let centerXor=0n,totalWorkers=0n,gfCount=0;
  const t=process.hrtime.bigint();
  for(const r of regions){
   if(r.kind==='gf128'){
    const agg=await runRegionParallel(r.desc.seed,r.size/16n);
    const ok=agg===xorAll(r.desc);centerXor^=agg;totalWorkers+=W;gfCount++;
    console.log('  '+r.name.padEnd(14)+'gf128    '+W+' workers // '+T+' threads  -> '+(ok?'OK':'### NON'));
   }else{
    centerXor^=xorAll(r.desc);
    console.log('  '+r.name.padEnd(14)+r.kind.padEnd(9)+'formule directe (agregat ferme)');
   }
  }
  const sec=Number(process.hrtime.bigint()-t)/1e9;
  let ref=0n;for(const r of regions)ref^=xorAll(r.desc);
  const estMono=perWorker*Number(totalWorkers);

  console.log('-------------------------------------------------------------------');
  console.log('  XOR global du centre : '+hex(centerXor)+'  '+(centerXor===ref?'== reference OK':'### DIVERGE'));
  console.log('  '+totalWorkers+' workers (sur '+gfCount+' coffres) en '+sec.toFixed(2)+' s sur '+T+' threads');
  console.log('  mono-thread estime : '+estMono.toFixed(1)+' s  -> acceleration ~'+(estMono/sec).toFixed(1)+'x');
  console.log('===================================================================');
 })();
}
