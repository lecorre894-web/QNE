#!/usr/bin/env node
"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const N=Math.max(8,parseInt(process.argv[2],10)||200000);
const STEPS=Math.max(1,parseInt(process.argv[3],10)||1000);
const W=Math.max(1,Math.min(parseInt(process.argv[4],10)||os.cpus().length,N));
const SEED=20261124,H=Math.floor(N/2),TWO3=2*Math.PI/3,THIRD=1/3;
const CNT=0,GEN=1,PAR=2;
if(isMainThread){
 const F=8;
 const mkF=()=>new Float64Array(new SharedArrayBuffer(N*F));
 const mkI=()=>new Int8Array(new SharedArrayBuffer(N));
 const re=[mkF(),mkF()],im=[mkF(),mkF()],act=[mkF(),mkF()],sym=[mkI(),mkI()];
 const partial=new Float64Array(new SharedArrayBuffer(W*F));
 const invArr=new Float64Array(new SharedArrayBuffer(F));
 const ctrl=new Int32Array(new SharedArrayBuffer(12));
 let a=SEED>>>0;const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 for(let i=0;i<N;i++){const ph=rnd()*2*Math.PI,amp=0.5+0.5*rnd();re[0][i]=amp*Math.cos(ph);im[0][i]=amp*Math.sin(ph);act[0][i]=2*rnd()-1;sym[0][i]=(rnd()*3)|0;}
 Atomics.store(ctrl,PAR,0);
 function eq(p){let mr=0,mi=0,s0=0,s1=0,s2=0,en=0;for(let i=0;i<N;i++){mr+=re[p][i];mi+=im[p][i];en+=re[p][i]*re[p][i]+im[p][i]*im[p][i];const s=sym[p][i];if(s===0)s0++;else if(s===1)s1++;else s2++;}return{c:Math.hypot(mr/N,mi/N),e:en/N,q:1-(Math.abs(s0-N/3)+Math.abs(s1-N/3)+Math.abs(s2-N/3))/N,r:[s0,s1,s2]};}
 console.log("QNE-8 — Quantique-Neuronal Équilatéral (parallèle)");
 console.log("nœuds="+N+" pas="+STEPS+" cœurs="+W+" graine="+SEED);
 const e0=eq(0);console.log("init: cohérence="+e0.c.toFixed(4)+" équilibre="+e0.q.toFixed(4));
 const sh={re,im,act,sym,partial,invArr,ctrl,N,STEPS,W,H};
 let done=0;const t0=process.hrtime.bigint();
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:Object.assign({wid:w},sh)});
  wk.on("message",()=>{if(++done===W){const t1=process.hrtime.bigint(),ms=Number(t1-t0)/1e6,up=N*STEPS,ups=up/(ms/1000),fin=Atomics.load(ctrl,PAR),e1=eq(fin);
   console.log("--------------------------------------------------");
   console.log("temps        : "+ms.toFixed(1)+" ms");
   console.log("mises à jour : "+up.toLocaleString("fr-FR"));
   console.log("SCORE COPROC.: "+Math.round(ups).toLocaleString("fr-FR")+" maj/s");
   console.log("débit/cœur   : "+Math.round(ups/W).toLocaleString("fr-FR")+" maj/s");
   console.log("cohérence    : "+e1.c.toFixed(4));
   console.log("équilibre    : "+e1.q.toFixed(4)+" (1=triangle parfait)");
   console.log("énergie moy. : "+e1.e.toFixed(4));
   console.log("répart.0/1/2 : "+e1.r.join(" / "));process.exit(0);}});
  wk.on("error",e=>{console.error("Erreur worker:",e);process.exit(1);});}
}else{
 const d=workerData,wid=d.wid,{re,im,act,sym,partial,invArr,ctrl}=d;
 const N=d.N,STEPS=d.STEPS,W=d.W,H=d.H,T=2*Math.PI/3,TH=1/3;
 const lo=Math.floor(wid*N/W),hi=Math.floor((wid+1)*N/W);
 function nb(i,k){if(k===0)return(i+1)%N;if(k===1)return(i-1+N)%N;return(i+H)%N;}
 function bar(){const g=Atomics.load(ctrl,GEN);if(Atomics.add(ctrl,CNT,1)===W-1){Atomics.store(ctrl,CNT,0);Atomics.store(ctrl,GEN,g+1);Atomics.notify(ctrl,GEN);}else{while(Atomics.load(ctrl,GEN)===g)Atomics.wait(ctrl,GEN,g);}}
 for(let s=0;s<STEPS;s++){
  const par=Atomics.load(ctrl,PAR),np=par^1;
  const oR=re[par],oI=im[par],oA=act[par],oS=sym[par],nR=re[np],nI=im[np],nA=act[np],nS=sym[np];
  let ss=0;
  for(let i=lo;i<hi;i++){const a=nb(i,0),b=nb(i,1),c=nb(i,2);
   const sv=(oS[a]+oS[b]+oS[c])%3;
   const na=Math.tanh(TH*(oA[a]+oA[b]+oA[c])+0.15);
   let mr=TH*(oR[a]+oR[b]+oR[c]),mi=TH*(oI[a]+oI[b]+oI[c]);mr=0.5*oR[i]+0.5*mr;mi=0.5*oI[i]+0.5*mi;
   const phi=sv*T*0.5,cs=Math.cos(phi),sn=Math.sin(phi),g=0.5*(1+na);
   const vr=g*(mr*cs-mi*sn),vi=g*(mr*sn+mi*cs);
   nR[i]=vr;nI[i]=vi;nA[i]=na;nS[i]=sv;ss+=vr*vr+vi*vi;}
  partial[wid]=ss;bar();
  if(wid===0){let sum=0;for(let k=0;k<W;k++)sum+=partial[k];invArr[0]=1/((Math.sqrt(sum/N))||1);}
  bar();const iv=invArr[0];for(let i=lo;i<hi;i++){nR[i]*=iv;nI[i]*=iv;}
  bar();if(wid===0)Atomics.store(ctrl,PAR,np);bar();}
 parentPort.postMessage("done");
}
