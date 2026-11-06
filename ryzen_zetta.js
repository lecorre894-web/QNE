








'use strict';
// QNE RYZEN x ZETTA — W = 10^21 (vraie workforce zetta) par coffre, sur TOUT le CPU.
// On ne peut PAS enumerer 10^21 workers (des millions d'annees). Donc :
//   (a) les T threads calculent un ECHANTILLON massif de vrais zetta-workers -> debit mesure ;
//   (b) controle d'exactitude : sur un petit bloc, parallele == sequentiel ;
//   (c) l'AGREGAT des 10^21 = formule fermee instantanee (xorAll). Le silicium inspecte, il ne cree pas l'infini.
const {Worker,isMainThread,workerData,parentPort}=require('node:worker_threads');
const os=require('node:os');
const R=require('./qne_v15/lib/reconstruct.js');
const {mul,pow,geometrical,gf128,xorAll,hex}=R;
const g=2n;
const worker=(seed,L,W,k)=>{if(k>=L)return 0n;const c=(L-1n-k)/W+1n;return mul(mul(seed,pow(g,k)),geometrical(pow(g,W),c).s);};

if(!isMainThread){
 const {seedHex,Lstr,Wstr,lo,hi}=workerData;
 const seed=BigInt(seedHex),L=BigInt(Lstr),W=BigInt(Wstr);
 let acc=0n;for(let k=BigInt(lo);k<BigInt(hi);k++)acc^=worker(seed,L,W,k);
 parentPort.postMessage('0x'+acc.toString(16));
}else{
 (async()=>{
  const T=os.cpus().length,Wz=10n**21n;
  const N=BigInt(process.argv[2]||'200000');
  const Nsmall=500n,A=123456789n;

  const coffres=[
   ['coffre-zetta', '0x9e3779b97f4a7c15f39cc0605cedc835',10n**21n],
   ['coffre-yotta', '0xc2b2ae3d27d4eb4f1656667213edc835',10n**24n],
   ['coffre-audela','0x0123456789abcdeffedcba9876543210',10n**40n]];

  const blockPar=(seedHex,L,a,n)=>{
   const nn=Number(n),base=Number(a),chunk=Math.ceil(nn/T);
   return Promise.all(Array.from({length:T},(_,i)=>{
    const lo=base+i*chunk,hi=Math.min(base+nn,base+(i+1)*chunk);
    if(lo>=hi)return Promise.resolve('0x0');
    return new Promise((res,rej)=>{const w=new Worker(__filename,{workerData:{seedHex,Lstr:L.toString(),Wstr:Wz.toString(),lo,hi}});w.on('message',res);w.on('error',rej);});
   })).then(p=>{let x=0n;for(const h of p)x^=BigInt(h);return x;});
  };
  const blockSeq=(seedHex,L,a,n)=>{const seed=BigInt(seedHex);let acc=0n;for(let k=a;k<a+n;k++)acc^=worker(seed,L,Wz,k);return acc;};

  console.log('===== QNE RYZEN x ZETTA : le Ryzen sur la workforce 10^21 =====');
  console.log('CPU : '+T+' threads | W = 10^21 (zetta) par coffre | echantillon N='+N+'/coffre');
  console.log('');
  let aggregate=0n,rateSum=0;
  for(const [name,seedHex,nbytes] of coffres){
   const L=nbytes/16n;
   const exact=(await blockPar(seedHex,L,A,Nsmall))===blockSeq(seedHex,L,A,Nsmall);
   const t=process.hrtime.bigint();await blockPar(seedHex,L,A,N);const sec=Number(process.hrtime.bigint()-t)/1e9;
   const rate=Number(N)/sec;rateSum+=rate;
   const ta=process.hrtime.bigint();const agg=xorAll(gf128(seedHex,nbytes));const ams=Number(process.hrtime.bigint()-ta)/1e6;
   aggregate^=agg;
   console.log('  '+name.padEnd(13)+' par==seq '+(exact?'OK':'NON')+' | '+rate.toFixed(0).padStart(7)+' zetta-workers/s | agregat 10^21 en '+ams.toFixed(2)+' ms');
  }
  const avg=rateSum/coffres.length,yearsEnum=(1e21/avg)/(3600*24*365.25);
  console.log('');
  console.log('  Agregat global des 3 coffres (chacun = XOR de ses 10^21 workers) : '+hex(aggregate));
  console.log('  Debit reel : '+avg.toFixed(0)+' zetta-workers/s sur '+T+' threads.');
  console.log('  ENUMERER les 10^21 workers d UN coffre a ce rythme : ~'+yearsEnum.toExponential(2)+' ANNEES (univers ~1.4e10 ans).');
  console.log('  -> On ne les enumere pas : l AGREGAT des 10^21 est la formule fermee (ms ci-dessus).');
  console.log('     Les 32 threads INSPECTENT la workforce ; le silicium ne fabrique pas l infini, l algebre le replie.');
  console.log('==============================================================');
 })();
}
