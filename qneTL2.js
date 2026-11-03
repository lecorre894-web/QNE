#!/usr/bin/env node
"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const N=Math.max(8,parseInt(process.argv[2],10)||100000);
const TARGET=Math.max(N,Math.floor(parseFloat(process.argv[3])||1e9));
const W=Math.max(1,Math.min(parseInt(process.argv[4],10)||os.cpus().length,N));
const STEPS=Math.max(1,Math.ceil(TARGET/N));
const G=parseFloat(process.argv[5])||1.5;
const ALPHA=0.30,OMEGA2=0.008,DAMP=0.002,RING=2.0,PHMOD=0.15;
const SEED=20261124,H=Math.floor(N/2),CNT=0,GEN=1,PAR=2;
const PCHECK=Math.max(1,Math.floor(STEPS/50)), FPR=4096;
if(isMainThread){
 const mkF=()=>new Float64Array(new SharedArrayBuffer(N*8));
 const mkI=()=>new Int8Array(new SharedArrayBuffer(N));
 const re=[mkF(),mkF()],im=[mkF(),mkF()],act=[mkF(),mkF()],sym=[mkI(),mkI()];
 const partial=new Float64Array(new SharedArrayBuffer(W*8));
 const fpart=new Float64Array(new SharedArrayBuffer(W*8));
 const fring=new Float64Array(new SharedArrayBuffer(FPR*8));
 const fb=new Float64Array(new SharedArrayBuffer(32));fb[0]=1;
 const flag=new Int32Array(new SharedArrayBuffer(4));
 const ctrl=new Int32Array(new SharedArrayBuffer(12));
 let a=SEED>>>0;const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 for(let i=0;i<N;i++){const ph=rnd()*2*Math.PI,amp=0.5+0.5*rnd();re[0][i]=amp*Math.cos(ph);im[0][i]=amp*Math.sin(ph);act[0][i]=2*rnd()-1;sym[0][i]=(rnd()*3)|0;}
 Atomics.store(ctrl,PAR,0);
 console.log("QNE-TL2 — voisins precalcules, coeurs="+W+" noeuds="+N);
 const sh={re,im,act,sym,partial,fpart,fring,fb,flag,ctrl,N,STEPS,W,H,G,ALPHA,OMEGA2,DAMP,RING,PHMOD,PCHECK,TARGET,FPR};
 let done=0;
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:Object.assign({wid:w},sh)});
  wk.on("message",m=>{if(m&&m.verdict){console.log(m.verdict);}if(++done===W)process.exit(Atomics.load(flag,0)?2:0);});
  wk.on("error",er=>{console.error("Erreur worker:",er);process.exit(1);});}
}else{
 const d=workerData,wid=d.wid,{re,im,act,sym,partial,fpart,fring,fb,flag,ctrl}=d;
 const N=d.N,STEPS=d.STEPS,W=d.W,H=d.H,G=d.G,ALPHA=d.ALPHA,OMEGA2=d.OMEGA2,DAMP=d.DAMP,RING=d.RING,PHMOD=d.PHMOD,TARGET=d.TARGET,FPR=d.FPR;
 const T=2*Math.PI/3,TH=1/3,lo=Math.floor(wid*N/W),hi=Math.floor((wid+1)*N/W);
 const TA=4,TNN=8192,TSS=(2*TA)/TNN,TANH=new Float64Array(TNN+1);
 for(let k=0;k<=TNN;k++)TANH[k]=Math.tanh(-TA+k*TSS);
 function tanhL(x){if(x<=-TA)return -1;if(x>=TA)return 1;const t=(x+TA)/TSS,j=t|0;return TANH[j]+(TANH[j+1]-TANH[j])*(t-j);}
 const SUM3=new Int8Array([0,1,2,0,1,2,0]);
 const NB0=new Int32Array(N),NB1=new Int32Array(N),NB2=new Int32Array(N);
 for(let i=0;i<N;i++){NB0[i]=(i+1)%N;NB1[i]=(i-1+N)%N;NB2[i]=(i+H)%N;}
 function bar(){const g=Atomics.load(ctrl,GEN);if(Atomics.add(ctrl,CNT,1)===W-1){Atomics.store(ctrl,CNT,0);Atomics.store(ctrl,GEN,g+1);Atomics.notify(ctrl,GEN);}else{while(Atomics.load(ctrl,GEN)===g)Atomics.wait(ctrl,GEN,g);}}
 function symq(){let s0=0,s1=0,s2=0;const p=Atomics.load(ctrl,PAR),oS=sym[p];for(let i=0;i<N;i++){const s=oS[i];if(s===0)s0++;else if(s===1)s1++;else s2++;}return 1-(Math.abs(s0-N/3)+Math.abs(s1-N/3)+Math.abs(s2-N/3))/N;}
 const t0=process.hrtime.bigint();
 for(let s=0;s<STEPS;s++){
  if(Atomics.load(flag,0))break;
  const par=Atomics.load(ctrl,PAR),np=par^1,S=fb[1],iv=fb[0];
  const oR=re[par],oI=im[par],oA=act[par],oS=sym[par],nR=re[np],nI=im[np],nA=act[np],nS=sym[np];
  const half=T*0.5*(1+PHMOD*S);
  const c0=1,s0_=0,c1=Math.cos(half),s1_=Math.sin(half),c2=Math.cos(2*half),s2_=Math.sin(2*half);
  let ss=0,fp=0;
  for(let i=lo;i<hi;i++){const a=NB0[i],b=NB1[i],c=NB2[i];
   const sv=SUM3[oS[a]+oS[b]+oS[c]];
   const na=tanhL(TH*(oA[a]+oA[b]+oA[c])+0.15);
   let mr=TH*(oR[a]+oR[b]+oR[c]),mi=TH*(oI[a]+oI[b]+oI[c]);mr=0.5*oR[i]+0.5*mr;mi=0.5*oI[i]+0.5*mi;
   const cs=sv===0?c0:(sv===1?c1:c2), sn=sv===0?s0_:(sv===1?s1_:s2_), g=0.5*(1+na);
   let vr=g*(mr*cs-mi*sn),vi=g*(mr*sn+mi*cs);vr*=iv;vi*=iv;
   nR[i]=vr;nI[i]=vi;nA[i]=na;nS[i]=sv;ss+=vr*vr+vi*vi;fp+=vr*(i+1)+vi+sv;}
  partial[wid]=ss; fpart[wid]=fp;
  bar();
  if(wid===0){let E=0,FP=0;for(let k=0;k<W;k++){E+=partial[k];FP+=fpart[k];}E/=N;
   let M=1;for(let k=0;k<W;k++)M*=(1+ALPHA*(partial[k]*W/N-1));
   fb[0]=1/Math.sqrt(Math.max(E,1e-12));
   const drive=(G-1)+RING*(M-1);let acc=OMEGA2*(drive-fb[1])-DAMP*fb[2];fb[2]+=acc;fb[1]+=fb[2];
   fring[s%FPR]=FP;
   if(!Number.isFinite(E)||!Number.isFinite(fb[1])){Atomics.store(flag,0,1);}
   Atomics.store(ctrl,PAR,np);}
  bar();
 }
 if(wid===0){const el=Number(process.hrtime.bigint()-t0)/1e9,up=STEPS*N,ups=up/el,q=symq(),ok=!Atomics.load(flag,0);
  parentPort.postMessage({verdict:(ok?"OK ✓":"ECHEC ✗")+"  maj="+up.toLocaleString("fr-FR")+"  temps="+el.toFixed(1)+"s  debit="+Math.round(ups).toLocaleString("fr-FR")+" maj/s  Δ="+q.toFixed(4)});}
 else parentPort.postMessage("done");
}
