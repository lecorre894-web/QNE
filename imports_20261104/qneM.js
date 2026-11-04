#!/usr/bin/env node
"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const N=Math.max(8,parseInt(process.argv[2],10)||100000);
const STEPS=Math.max(1,parseInt(process.argv[3],10)||2000);
const W=Math.max(2,Math.min(parseInt(process.argv[4],10)||os.cpus().length,N));
const G=parseFloat(process.argv[5])||3.0;
const BETAp=parseFloat(process.argv[6]);const BETA=isNaN(BETAp)?0.05:BETAp;
const COUP=0.30,NL=0.10,OMEGA2=0.02,DAMP=0.004,PHMOD=0.15;
const SEED=20261124,H=Math.floor(N/2),CNT=0,GEN=1,PAR=2,SMP=28;
if(isMainThread){
 const mkF=()=>new Float64Array(new SharedArrayBuffer(N*8));
 const mkI=()=>new Int8Array(new SharedArrayBuffer(N));
 const re=[mkF(),mkF()],im=[mkF(),mkF()],act=[mkF(),mkF()],sym=[mkI(),mkI()];
 const mkW=()=>new Float64Array(new SharedArrayBuffer(W*8));
 const S=[mkW(),mkW()],V=[mkW(),mkW()],M=[mkW(),mkW()];
 const stat=new Float64Array(new SharedArrayBuffer(32));stat[0]=1e9;stat[1]=-1e9;
 const samp=new Float64Array(new SharedArrayBuffer(SMP*8));
 const ctrl=new Int32Array(new SharedArrayBuffer(12));
 let a=SEED>>>0;const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 for(let i=0;i<N;i++){const ph=rnd()*2*Math.PI,amp=0.5+0.5*rnd();re[0][i]=amp*Math.cos(ph);im[0][i]=amp*Math.sin(ph);act[0][i]=2*rnd()-1;sym[0][i]=(rnd()*3)|0;}
 for(let k=0;k<W;k++){S[0][k]=0.2*(rnd()-0.5);M[0][k]=S[0][k];}
 Atomics.store(ctrl,PAR,0);
 console.log("QNE-M — QNE résonant + mémoire fondante (double buffer)");
 console.log("nœuds="+N+" pas="+STEPS+" cœurs="+W+" G="+G+" mémoire(beta)="+BETA);
 console.log("--------------------------------------------------");
 const sh={re,im,act,sym,S,V,M,stat,samp,ctrl,N,STEPS,W,H,G,COUP,NL,OMEGA2,DAMP,PHMOD,BETA,SMP};
 let done=0;const t0=process.hrtime.bigint();
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:Object.assign({wid:w},sh)});
  wk.on("message",()=>{if(++done===W){const t1=process.hrtime.bigint(),ms=Number(t1-t0)/1e6,up=N*STEPS,ups=up/(ms/1000);
   const blk="▁▂▃▄▅▆▇█".split(""),lo=stat[0],hi=stat[1],rg=(hi-lo)||1;let sp="";for(let k=0;k<SMP;k++){const v=(samp[k]-lo)/rg;sp+=blk[Math.max(0,Math.min(7,Math.round(v*7)))];}
   console.log("temps        : "+ms.toFixed(1)+" ms");
   console.log("SCORE COPROC.: "+Math.round(ups).toLocaleString("fr-FR")+" maj/s ("+W+" cœurs)");
   console.log("équilibre Δ  : "+stat[3].toFixed(4)+"  (1=triangle parfait)");
   console.log("écart CPU fin: "+stat[2].toFixed(5)+"  (petit=synchronisés, grand=chacun son équilibre)");
   console.log("mémoire(t)   : "+sp);process.exit(0);}});
  wk.on("error",er=>{console.error("Erreur worker:",er);process.exit(1);});}
}else{
 const d=workerData,wid=d.wid,{re,im,act,sym,S,V,M,stat,samp,ctrl}=d;
 const N=d.N,STEPS=d.STEPS,W=d.W,H=d.H,G=d.G,COUP=d.COUP,NL=d.NL,OMEGA2=d.OMEGA2,DAMP=d.DAMP,PHMOD=d.PHMOD,BETA=d.BETA,SMP=d.SMP;
 const T=2*Math.PI/3,TH=1/3,lo=Math.floor(wid*N/W),hi=Math.floor((wid+1)*N/W),kl=(wid-1+W)%W,kr=(wid+1)%W;
 const TA=4,TNN=8192,TSS=(2*TA)/TNN,TANH=new Float64Array(TNN+1);
 for(let k=0;k<=TNN;k++)TANH[k]=Math.tanh(-TA+k*TSS);
 function tanhL(x){if(x<=-TA)return -1;if(x>=TA)return 1;const t=(x+TA)/TSS,j=t|0;return TANH[j]+(TANH[j+1]-TANH[j])*(t-j);}
 const SUM3=new Int8Array([0,1,2,0,1,2,0]);
 function nb(i,k){if(k===0)return(i+1)%N;if(k===1)return(i-1+N)%N;return(i+H)%N;}
 function bar(){const g=Atomics.load(ctrl,GEN);if(Atomics.add(ctrl,CNT,1)===W-1){Atomics.store(ctrl,CNT,0);Atomics.store(ctrl,GEN,g+1);Atomics.notify(ctrl,GEN);}else{while(Atomics.load(ctrl,GEN)===g)Atomics.wait(ctrl,GEN,g);}}
 function symq(){let s0=0,s1=0,s2=0;const p=Atomics.load(ctrl,PAR),oS=sym[p];for(let i=0;i<N;i++){const s=oS[i];if(s===0)s0++;else if(s===1)s1++;else s2++;}return 1-(Math.abs(s0-N/3)+Math.abs(s1-N/3)+Math.abs(s2-N/3))/N;}
 let invk=1;const ss2=Math.max(1,Math.floor(STEPS/SMP));
 for(let s=0;s<STEPS;s++){
  const par=Atomics.load(ctrl,PAR),np=par^1;
  const Sk=S[par][wid],Vk=V[par][wid],Mk=M[par][wid],Ml=M[par][kl],Mr=M[par][kr];
  const oR=re[par],oI=im[par],oA=act[par],oS=sym[par],nR=re[np],nI=im[np],nA=act[np],nS=sym[np];
  const half=T*0.5*(1+PHMOD*Sk),c1=Math.cos(half),s1_=Math.sin(half),c2=Math.cos(2*half),s2_=Math.sin(2*half);
  let ssum=0;
  for(let i=lo;i<hi;i++){const a=nb(i,0),b=nb(i,1),c=nb(i,2);
   const sv=SUM3[oS[a]+oS[b]+oS[c]];
   const na=tanhL(TH*(oA[a]+oA[b]+oA[c])+0.15);
   let mr=TH*(oR[a]+oR[b]+oR[c]),mi=TH*(oI[a]+oI[b]+oI[c]);mr=0.5*oR[i]+0.5*mr;mi=0.5*oI[i]+0.5*mi;
   const cs=sv===0?1:(sv===1?c1:c2),sn=sv===0?0:(sv===1?s1_:s2_),g=0.5*(1+na);
   let vr=g*(mr*cs-mi*sn),vi=g*(mr*sn+mi*cs);vr*=invk;vi*=invk;
   nR[i]=vr;nI[i]=vi;nA[i]=na;nS[i]=sv;ssum+=vr*vr+vi*vi;}
  invk=1/Math.sqrt(Math.max(ssum/(hi-lo),1e-12));
  const drive=(G-1)+COUP*(Math.sin(Ml-Sk)+Math.sin(Mr-Sk))-NL*Sk*Sk*Sk;
  const Vn=Vk+OMEGA2*(drive-Sk)-DAMP*Vk, Sn=Sk+Vn;
  S[np][wid]=Sn;V[np][wid]=Vn;M[np][wid]=Mk+BETA*(Sn-Mk);
  bar();
  if(wid===0){let m=0;for(let k=0;k<W;k++)m+=S[np][k];m/=W;let v=0;for(let k=0;k<W;k++){const dd=S[np][k]-m;v+=dd*dd;}const sd=Math.sqrt(v/W);
   if(sd<stat[0])stat[0]=sd;if(sd>stat[1])stat[1]=sd;stat[2]=sd;stat[3]=symq();
   samp[Math.min(SMP-1,Math.floor(s/ss2))]=M[np][0];Atomics.store(ctrl,PAR,np);}
  bar();}
 parentPort.postMessage("done");
}
