#!/usr/bin/env node
/* QNE-X — expérience AU BORD DU CHAOS (fédéré hétérogène).
   Chaque CPU a SA fréquence propre et SON G (hétérogénéité HET),
   amortissement bas, non-linéarité cubique forte, couplage faible.
   On cherche la bascule synchro -> désynchro/chaos.
   node qneX.js [nœuds] [pas] [cœurs] [G] [COUP] [HET] [NL]
*/
"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const N=Math.max(8,parseInt(process.argv[2],10)||30000);
const STEPS=Math.max(1,parseInt(process.argv[3],10)||3000);
const W=Math.max(2,Math.min(parseInt(process.argv[4],10)||os.cpus().length,N));
const G=parseFloat(process.argv[5])||3.0;
const COUP=parseFloat(process.argv[6]);const COUPL=isNaN(COUP)?0.2:COUP;
const HETp=parseFloat(process.argv[7]);const HET=isNaN(HETp)?0.6:HETp;
const NLp=parseFloat(process.argv[8]);const NL=isNaN(NLp)?0.3:NLp;
const OMEGA2=0.03,DAMP=0.001,PHMOD=0.15,ALPHA=0.30;
const SEED=20261124,H=Math.floor(N/2),CNT=0,GEN=1,PAR=2,SMP=28,FPR=2048;

if(isMainThread){
 const mkF=()=>new Float64Array(new SharedArrayBuffer(N*8));
 const mkI=()=>new Int8Array(new SharedArrayBuffer(N));
 const re=[mkF(),mkF()],im=[mkF(),mkF()],act=[mkF(),mkF()],sym=[mkI(),mkI()];
 const S=[new Float64Array(new SharedArrayBuffer(W*8)),new Float64Array(new SharedArrayBuffer(W*8))];
 const V=[new Float64Array(new SharedArrayBuffer(W*8)),new Float64Array(new SharedArrayBuffer(W*8))];
 const stat=new Float64Array(new SharedArrayBuffer(4*8));stat[0]=1e9;stat[1]=-1e9;
 const samp=new Float64Array(new SharedArrayBuffer(SMP*8));
 const fring=new Float64Array(new SharedArrayBuffer(FPR*8));
 const ctrl=new Int32Array(new SharedArrayBuffer(12));
 let a=SEED>>>0;const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 for(let i=0;i<N;i++){const ph=rnd()*2*Math.PI,amp=0.5+0.5*rnd();re[0][i]=amp*Math.cos(ph);im[0][i]=amp*Math.sin(ph);act[0][i]=2*rnd()-1;sym[0][i]=(rnd()*3)|0;}
 for(let k=0;k<W;k++){S[0][k]=0.3*(rnd()-0.5);V[0][k]=0;}
 Atomics.store(ctrl,PAR,0);
 console.log("QNE-X — bord du chaos (CPU hétérogènes)");
 console.log("nœuds="+N+" pas="+STEPS+" cœurs="+W+" G="+G+" couplage="+COUPL+" hétéro="+HET+" nonlin="+NL);
 console.log("--------------------------------------------------");
 const sh={re,im,act,sym,S,V,stat,samp,fring,ctrl,N,STEPS,W,H,G,ALPHA,OMEGA2,DAMP,PHMOD,COUPL,HET,NL,SMP,FPR,SEED};
 let done=0;const t0=process.hrtime.bigint();
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:Object.assign({wid:w},sh)});
  wk.on("message",()=>{if(++done===W){const t1=process.hrtime.bigint(),ms=Number(t1-t0)/1e6;
   const blk="▁▂▃▄▅▆▇█".split(""),lo=stat[0],hi=stat[1],rg=(hi-lo)||1;let sp="";for(let k=0;k<SMP;k++){const v=(samp[k]-lo)/rg;sp+=blk[Math.max(0,Math.min(7,Math.round(v*7)))];}
   // cycle sur meanS
   const have=Math.min(STEPS,FPR);let period=0;
   for(let p=1;p<=(have>>1)&&!period;p++){let good=1;for(let k=0;k<have-p&&good;k++){const A=fring[(STEPS-1-k+FPR*2)%FPR],B=fring[(STEPS-1-k-p+FPR*2)%FPR];if(Math.abs(A-B)>1e-5*(1+Math.abs(A)))good=0;}if(good)period=p;}
   const sdf=stat[2];
   const regime=sdf<1e-3?"SYNCHRONISÉ (verrouillage total)":(period?("QUASI-PÉRIODIQUE / verrouillage partiel (période "+period+")"):"DÉSYNCHRONISÉ IRRÉGULIER — chaos probable");
   console.log("--------------------------------------------------");
   console.log("temps        : "+ms.toFixed(1)+" ms");
   console.log("écart CPU min: "+stat[0].toFixed(5));
   console.log("écart CPU max: "+stat[1].toFixed(5));
   console.log("écart final  : "+sdf.toFixed(5));
   console.log("cycle meanS  : "+(period?("période "+period):"aucun (apériodique)"));
   console.log("RÉGIME       : "+regime);
   console.log("écart CPU(t) : "+sp);
   console.log("équilibre Δ  : "+stat[3].toFixed(4));
   process.exit(0);}});
  wk.on("error",er=>{console.error("Erreur worker:",er);process.exit(1);});}
}else{
 const d=workerData,wid=d.wid,{re,im,act,sym,S,V,stat,samp,fring,ctrl}=d;
 const N=d.N,STEPS=d.STEPS,W=d.W,H=d.H,G=d.G,ALPHA=d.ALPHA,OMEGA2=d.OMEGA2,DAMP=d.DAMP,PHMOD=d.PHMOD,COUPL=d.COUPL,HET=d.HET,NL=d.NL,SMP=d.SMP,FPR=d.FPR,SEED=d.SEED;
 const T=2*Math.PI/3,TH=1/3,lo=Math.floor(wid*N/W),hi=Math.floor((wid+1)*N/W);
 // paramètres PROPRES à ce CPU (déterministes via wid)
 let a=(SEED+7919*(wid+1))>>>0;const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 const omk=OMEGA2*(1+HET*(2*rnd()-1)), Gk=G*(1+HET*(2*rnd()-1));
 const TA=4,TNN=8192,TSS=(2*TA)/TNN,TANH=new Float64Array(TNN+1);
 for(let k=0;k<=TNN;k++)TANH[k]=Math.tanh(-TA+k*TSS);
 function tanhL(x){if(x<=-TA)return -1;if(x>=TA)return 1;const t=(x+TA)/TSS,j=t|0;return TANH[j]+(TANH[j+1]-TANH[j])*(t-j);}
 const SUM3=new Int8Array([0,1,2,0,1,2,0]);
 function nb(i,k){if(k===0)return(i+1)%N;if(k===1)return(i-1+N)%N;return(i+H)%N;}
 function bar(){const g=Atomics.load(ctrl,GEN);if(Atomics.add(ctrl,CNT,1)===W-1){Atomics.store(ctrl,CNT,0);Atomics.store(ctrl,GEN,g+1);Atomics.notify(ctrl,GEN);}else{while(Atomics.load(ctrl,GEN)===g)Atomics.wait(ctrl,GEN,g);}}
 function symq(){let s0=0,s1=0,s2=0;const p=Atomics.load(ctrl,PAR),oS=sym[p];for(let i=0;i<N;i++){const s=oS[i];if(s===0)s0++;else if(s===1)s1++;else s2++;}return 1-(Math.abs(s0-N/3)+Math.abs(s1-N/3)+Math.abs(s2-N/3))/N;}
 let invk=1;const ss2=Math.max(1,Math.floor(STEPS/SMP)),kl=(wid-1+W)%W,kr=(wid+1)%W;
 for(let s=0;s<STEPS;s++){
  const par=Atomics.load(ctrl,PAR),np=par^1;
  const Sk=S[par][wid],Sl=S[par][kl],Sr=S[par][kr],Vk=V[par][wid];
  const oR=re[par],oI=im[par],oA=act[par],oS=sym[par],nR=re[np],nI=im[np],nA=act[np],nS=sym[np];
  const half=T*0.5*(1+PHMOD*Sk),c1=Math.cos(half),s1_=Math.sin(half),c2=Math.cos(2*half),s2_=Math.sin(2*half);
  let ssum=0;
  for(let i=lo;i<hi;i++){const a2=nb(i,0),b=nb(i,1),c=nb(i,2);
   const sv=SUM3[oS[a2]+oS[b]+oS[c]];
   const na=tanhL(TH*(oA[a2]+oA[b]+oA[c])+0.15);
   let mr=TH*(oR[a2]+oR[b]+oR[c]),mi=TH*(oI[a2]+oI[b]+oI[c]);mr=0.5*oR[i]+0.5*mr;mi=0.5*oI[i]+0.5*mi;
   const cs=sv===0?1:(sv===1?c1:c2),sn=sv===0?0:(sv===1?s1_:s2_),g=0.5*(1+na);
   let vr=g*(mr*cs-mi*sn),vi=g*(mr*sn+mi*cs);vr*=invk;vi*=invk;
   nR[i]=vr;nI[i]=vi;nA[i]=na;nS[i]=sv;ssum+=vr*vr+vi*vi;}
  invk=1/Math.sqrt(Math.max(ssum/(hi-lo),1e-12));
  const drive=(Gk-1)+COUPL*(Math.sin(Sl-Sk)+Math.sin(Sr-Sk))-NL*Sk*Sk*Sk;
  const Vn=Vk+omk*(drive-Sk)-DAMP*Vk, Sn=Sk+Vn;
  S[np][wid]=Sn;V[np][wid]=Vn;
  bar();
  if(wid===0){let m=0;for(let k=0;k<W;k++)m+=S[np][k];m/=W;let v=0;for(let k=0;k<W;k++){const dd=S[np][k]-m;v+=dd*dd;}const sd=Math.sqrt(v/W);
   if(sd<stat[0])stat[0]=sd;if(sd>stat[1])stat[1]=sd;stat[2]=sd;stat[3]=symq();
   samp[Math.min(SMP-1,Math.floor(s/ss2))]=sd; fring[s%FPR]=m;
   Atomics.store(ctrl,PAR,np);}
  bar();
 }
 parentPort.postMessage("done");
}
