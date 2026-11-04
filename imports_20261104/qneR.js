#!/usr/bin/env node
"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const N=Math.max(8,parseInt(process.argv[2],10)||200000);
const STEPS=Math.max(1,parseInt(process.argv[3],10)||1000);
const W=Math.max(1,Math.min(parseInt(process.argv[4],10)||os.cpus().length,N));
const G=parseFloat(process.argv[5])||1.5;
const ALPHA=0.30,OMEGA2=0.008,DAMP=0.002,RING=2.0,PHMOD=0.15;
const SEED=20261124,H=Math.floor(N/2),CNT=0,GEN=1,PAR=2,SMP=24;
if(isMainThread){
 const mkF=()=>new Float64Array(new SharedArrayBuffer(N*8));
 const mkI=()=>new Int8Array(new SharedArrayBuffer(N));
 const re=[mkF(),mkF()],im=[mkF(),mkF()],act=[mkF(),mkF()],sym=[mkI(),mkI()];
 const partial=new Float64Array(new SharedArrayBuffer(W*8));
 const fb=new Float64Array(new SharedArrayBuffer(32));fb[0]=1;
 const stat=new Float64Array(new SharedArrayBuffer(32));stat[0]=1e9;stat[1]=-1e9;
 const samp=new Float64Array(new SharedArrayBuffer(SMP*8));
 const ctrl=new Int32Array(new SharedArrayBuffer(12));
 let a=SEED>>>0;const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 for(let i=0;i<N;i++){const ph=rnd()*2*Math.PI,amp=0.5+0.5*rnd();re[0][i]=amp*Math.cos(ph);im[0][i]=amp*Math.sin(ph);act[0][i]=2*rnd()-1;sym[0][i]=(rnd()*3)|0;}
 Atomics.store(ctrl,PAR,0);
 function eq(p){let mr=0,mi=0,en=0,s0=0,s1=0,s2=0;for(let i=0;i<N;i++){mr+=re[p][i];mi+=im[p][i];en+=re[p][i]*re[p][i]+im[p][i]*im[p][i];const s=sym[p][i];if(s===0)s0++;else if(s===1)s1++;else s2++;}return{c:Math.hypot(mr/N,mi/N),e:en/N,q:1-(Math.abs(s0-N/3)+Math.abs(s1-N/3)+Math.abs(s2-N/3))/N,r:[s0,s1,s2]};}
 console.log("QNE-R — Quantique-Neuronal Équilatéral RÉSONANT");
 console.log("nœuds="+N+" pas="+STEPS+" cœurs="+W+" G(ampli)="+G);
 const sh={re,im,act,sym,partial,fb,stat,samp,ctrl,N,STEPS,W,H,G,ALPHA,OMEGA2,DAMP,RING,PHMOD,SMP};
 let done=0;const t0=process.hrtime.bigint();
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:Object.assign({wid:w},sh)});
  wk.on("message",()=>{if(++done===W){const t1=process.hrtime.bigint(),ms=Number(t1-t0)/1e6,up=N*STEPS,ups=up/(ms/1000),fin=Atomics.load(ctrl,PAR),e=eq(fin);
   const blk="▁▂▃▄▅▆▇█".split(""),lo=stat[0],hi=stat[1],rg=(hi-lo)||1;let sp="";for(let k=0;k<SMP;k++){const v=(samp[k]-lo)/rg;sp+=blk[Math.max(0,Math.min(7,Math.round(v*7)))];}
   console.log("--------------------------------------------------");
   console.log("temps        : "+ms.toFixed(1)+" ms");
   console.log("SCORE COPROC.: "+Math.round(ups).toLocaleString("fr-FR")+" maj/s ("+W+" cœurs)");
   console.log("énergie      : "+e.e.toFixed(4)+" (stable)");
   console.log("équilibre Δ  : "+e.q.toFixed(4)+" (1=triangle parfait)");
   console.log("signal min   : "+stat[0].toFixed(4));
   console.log("signal max   : "+stat[1].toFixed(4));
   console.log("amplitude osc: "+(stat[1]-stat[0]).toFixed(4)+" (0=plat, >0=résonance)");
   console.log("résonance    : "+sp);
   console.log("répart.0/1/2 : "+e.r.join(" / "));process.exit(0);}});
  wk.on("error",er=>{console.error("Erreur worker:",er);process.exit(1);});}
}else{
 const d=workerData,wid=d.wid,{re,im,act,sym,partial,fb,stat,samp,ctrl}=d;
 const N=d.N,STEPS=d.STEPS,W=d.W,H=d.H,G=d.G,ALPHA=d.ALPHA,OMEGA2=d.OMEGA2,DAMP=d.DAMP,RING=d.RING,PHMOD=d.PHMOD,SMP=d.SMP;
 const T=2*Math.PI/3,TH=1/3,lo=Math.floor(wid*N/W),hi=Math.floor((wid+1)*N/W);
 function nb(i,k){if(k===0)return(i+1)%N;if(k===1)return(i-1+N)%N;return(i+H)%N;}
 function bar(){const g=Atomics.load(ctrl,GEN);if(Atomics.add(ctrl,CNT,1)===W-1){Atomics.store(ctrl,CNT,0);Atomics.store(ctrl,GEN,g+1);Atomics.notify(ctrl,GEN);}else{while(Atomics.load(ctrl,GEN)===g)Atomics.wait(ctrl,GEN,g);}}
 const ss2=Math.max(1,Math.floor(STEPS/SMP));
 for(let s=0;s<STEPS;s++){
  const par=Atomics.load(ctrl,PAR),np=par^1,S=fb[1],iv=fb[0];
  const oR=re[par],oI=im[par],oA=act[par],oS=sym[par],nR=re[np],nI=im[np],nA=act[np],nS=sym[np];
  const pmod=1+PHMOD*S;let ss=0;
  for(let i=lo;i<hi;i++){const a=nb(i,0),b=nb(i,1),c=nb(i,2);
   const sv=(oS[a]+oS[b]+oS[c])%3;
   const na=Math.tanh(TH*(oA[a]+oA[b]+oA[c])+0.15);
   let mr=TH*(oR[a]+oR[b]+oR[c]),mi=TH*(oI[a]+oI[b]+oI[c]);mr=0.5*oR[i]+0.5*mr;mi=0.5*oI[i]+0.5*mi;
   const phi=sv*T*0.5*pmod,cs=Math.cos(phi),sn=Math.sin(phi),g=0.5*(1+na);
   let vr=g*(mr*cs-mi*sn),vi=g*(mr*sn+mi*cs);vr*=iv;vi*=iv;
   nR[i]=vr;nI[i]=vi;nA[i]=na;nS[i]=sv;ss+=vr*vr+vi*vi;}
  partial[wid]=ss;bar();
  if(wid===0){let E=0;for(let k=0;k<W;k++)E+=partial[k];E/=N;
   let M=1;for(let k=0;k<W;k++)M*=(1+ALPHA*(partial[k]*W/N-1));
   fb[0]=1/Math.sqrt(Math.max(E,1e-12));
   const drive=(G-1)+RING*(M-1);let acc=OMEGA2*(drive-fb[1])-DAMP*fb[2];fb[2]+=acc;fb[1]+=fb[2];
   const Sn=fb[1];if(Sn<stat[0])stat[0]=Sn;if(Sn>stat[1])stat[1]=Sn;stat[2]=Sn;
   samp[Math.min(SMP-1,Math.floor(s/ss2))]=Sn;Atomics.store(ctrl,PAR,np);}
  bar();}
 parentPort.postMessage("done");
}
