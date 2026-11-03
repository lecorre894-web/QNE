








"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const NR=Math.max(8,parseInt(process.argv[2],10)||300);
const K=Math.max(1,parseInt(process.argv[3],10)||8);
const STEPS=Math.max(2000,parseInt(process.argv[4],10)||60000);
const W=Math.max(1,parseInt(process.argv[5],10)||os.cpus().length);
const SEUIL=parseFloat(process.argv[6])||50;
const LEAK=0.95,WIN=0.5,H=Math.floor(NR/2),WARM=1500,ETA=0.3;
if(isMainThread){
 console.log("RES-ENS-DIE — "+(W*K)+" reservoirs gains varies, Nr="+NR+", seuil="+SEUIL+"%");
 console.log("--------------------------------------------------");
 let done=0,rows=[],t0=Date.now();
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:{wid:w,NR,K,STEPS,LEAK,WIN,H,WARM,ETA}});
  wk.on("message",m=>{for(const r of m.rows)rows.push(r);if(++done===W){const el=(Date.now()-t0)/1e3;
   const viv=rows.filter(r=>r.fit>=SEUIL),morts=rows.length-viv.length;
   const moy=rows.reduce((a,b)=>a+b.fit,0)/rows.length;
   const best=rows.reduce((a,b)=>b.fit>a.fit?b:a);
   const gv=viv.length?viv.reduce((a,b)=>a+b.gain,0)/viv.length:0;
   console.log("coeff moyen = "+moy.toFixed(1)+"%   meilleur = "+best.fit.toFixed(1)+"% (gain "+best.gain.toFixed(3)+")");
   console.log("VIVANTS = "+viv.length+"/"+rows.length+"   MORTS = "+morts+"   gain moyen des survivants = "+gv.toFixed(3));
   console.log("temps="+el.toFixed(1)+"s");process.exit(0);}});
  wk.on("error",e=>{console.error(e);process.exit(1);});}
}else{
 const {wid,NR,K,STEPS,LEAK,WIN,H,WARM,ETA}=workerData;
 const NB0=new Int32Array(NR),NB1=new Int32Array(NR),NB2=new Int32Array(NR);
 for(let i=0;i<NR;i++){NB0[i]=(i+1)%NR;NB1[i]=(i-1+NR)%NR;NB2[i]=(i+H)%NR;}
 const TH=1/3,rows=[],EV=Math.floor(STEPS*0.6);
 for(let r=0;r<K;r++){
  let a=(1234567+wid*100003+r*7919)>>>0;
  const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
  const gain=0.10+0.70*rnd();
  let x=new Float64Array(NR),nx=new Float64Array(NR),w=new Float64Array(NR);
  for(let i=0;i<NR;i++)x[i]=2*rnd()-1;
  let se=0,sy=0;
  for(let s=0;s<WARM+STEPS;s++){
   const u=Math.sin(s*0.017)+0.3*Math.sin(s*0.0031);
   const unext=Math.sin((s+1)*0.017)+0.3*Math.sin((s+1)*0.0031);
   for(let i=0;i<NR;i++){const m=TH*(x[NB0[i]]+x[NB1[i]]+x[NB2[i]]);
    nx[i]=(1-LEAK)*x[i]+LEAK*Math.tanh(gain*3*m+WIN*u);}
   const t=x;x=nx;nx=t;
   if(s>=WARM){let yh=0,nrm=1;for(let i=0;i<NR;i++){yh+=w[i]*x[i];nrm+=x[i]*x[i];}
    const e=unext-yh,g=ETA*e/nrm;for(let i=0;i<NR;i++)w[i]+=g*x[i];
    if(s>=WARM+EV){se+=e*e;sy+=unext*unext;}}
  }
  const nrmse=Math.sqrt(se/Math.max(sy,1e-12));
  rows.push({gain,fit:Math.max(0,100*(1-nrmse))});
 }
 parentPort.postMessage({rows});
}
