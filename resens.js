








/* RES-ENS — ensemble de reservoirs equilateraux INDEPENDANTS, multicoeur, alloc-free.
   node resens.js [Nr] [reservoirs_par_coeur] [pas] [coeurs] */
"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const NR=Math.max(8,parseInt(process.argv[2],10)||300);
const K=Math.max(1,parseInt(process.argv[3],10)||8);
const STEPS=Math.max(1000,parseInt(process.argv[4],10)||200000);
const W=Math.max(1,parseInt(process.argv[5],10)||os.cpus().length);
const LEAK=0.95,WR=0.33,WIN=0.5,H=Math.floor(NR/2);
if(isMainThread){
 console.log("RES-ENS — "+(W*K)+" reservoirs ("+W+" coeurs x "+K+"), Nr="+NR+", pas="+STEPS.toLocaleString("fr-FR"));
 console.log("--------------------------------------------------");
 let done=0,tot=0,t0=Date.now();
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:{wid:w,NR,K,STEPS,W,LEAK,WR,WIN,H}});
  wk.on("message",m=>{tot+=m.ups;if(++done===W){const el=(Date.now()-t0)/1e3,res=W*K,rps=res*STEPS/el;
   console.log("etats/s (pas-reservoir) = "+Math.round(rps).toLocaleString("fr-FR"));
   console.log("maj-noeuds/s            = "+Math.round(res*STEPS*NR/el).toLocaleString("fr-FR"));
   console.log("temps="+el.toFixed(1)+"s  controle="+m.chk.toFixed(4));process.exit(0);}});
  wk.on("error",e=>{console.error(e);process.exit(1);});}
}else{
 const {wid,NR,K,STEPS,LEAK,WR,WIN,H}=workerData;
 const NB0=new Int32Array(NR),NB1=new Int32Array(NR),NB2=new Int32Array(NR);
 for(let i=0;i<NR;i++){NB0[i]=(i+1)%NR;NB1[i]=(i-1+NR)%NR;NB2[i]=(i+H)%NR;}
 const TH=1/3;let chk=0;const t0=process.hrtime.bigint();
 for(let r=0;r<K;r++){
  let a=(1234567+wid*100003+r*7919)>>>0;
  const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
  let x=new Float64Array(NR),nx=new Float64Array(NR);
  for(let i=0;i<NR;i++)x[i]=2*rnd()-1;
  for(let s=0;s<STEPS;s++){
   const u=Math.sin(s*0.017)+0.3*Math.sin(s*0.0031);
   for(let i=0;i<NR;i++){const m=TH*(x[NB0[i]]+x[NB1[i]]+x[NB2[i]]);
    nx[i]=(1-LEAK)*x[i]+LEAK*Math.tanh(WR*3*m+WIN*u);}
   const t=x;x=nx;nx=t;}
  chk+=x[0];
 }
 const el=Number(process.hrtime.bigint()-t0)/1e9;
 parentPort.postMessage({ups:K*STEPS*NR/el,chk});
}
