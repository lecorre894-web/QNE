#!/usr/bin/env node
"use strict";
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1;
const Nr=300,H=150,leak=0.95,wr=0.33;
const Wi=[0,1,2].map(()=>{const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=0.4*rn();return w;});
const F=2*Nr+1;const Wo=[0,1,2].map(()=>{const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=0.02*rn();return w;});
const NB0=new Int32Array(Nr),NB1=new Int32Array(Nr),NB2=new Int32Array(Nr);
for(let i=0;i<Nr;i++){NB0[i]=(i+1)%Nr;NB1[i]=(i-1+Nr)%Nr;NB2[i]=(i+H)%Nr;}
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const u=[0.1,0.1,0.1],G=300000;
function runAlloc(){let x=new Float64Array(Nr);let chk=0;const t0=process.hrtime.bigint();
 for(let g=0;g<G;g++){const nx=new Float64Array(Nr);
  for(let i=0;i<Nr;i++){let pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}
  x=nx;const f=new Float64Array(F);for(let i=0;i<Nr;i++){f[i]=x[i];f[Nr+i]=x[i]*x[i];}f[F-1]=1;
  let o=0;for(let i=0;i<F;i++)o+=Wo[0][i]*f[i];chk+=o;}
 return{sec:Number(process.hrtime.bigint()-t0)/1e9,x};}
function runFree(){const x=new Float64Array(Nr),nx=new Float64Array(Nr),f=new Float64Array(F);f[F-1]=1;const t0=process.hrtime.bigint();
 for(let g=0;g<G;g++){
  for(let i=0;i<Nr;i++){let pre=wr*(x[NB0[i]]+x[NB1[i]]+x[NB2[i]]);pre+=Wi[0][i]*u[0]+Wi[1][i]*u[1]+Wi[2][i]*u[2];nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}
  for(let i=0;i<Nr;i++){const v=nx[i];x[i]=v;f[i]=v;f[Nr+i]=v*v;}
  let o=0;const w=Wo[0];for(let i=0;i<F;i++)o+=w[i]*f[i];}
 return{sec:Number(process.hrtime.bigint()-t0)/1e9,x};}
const A=runAlloc();a=20261124>>>0;const B=runFree();
let same=true;for(let i=0;i<Nr;i++)if(Math.abs(A.x[i]-B.x[i])>1e-9){same=false;break;}
console.log("RESERVOIR — "+G.toLocaleString("fr-FR")+" etats, "+Nr+" neurones");
console.log("  allouant   : "+Math.round(G/A.sec).toLocaleString("fr-FR")+" etats/s");
console.log("  sans alloc : "+Math.round(G/B.sec).toLocaleString("fr-FR")+" etats/s  (x"+(A.sec/B.sec).toFixed(2)+")");
console.log("  dynamique identique : "+(same?"OUI":"NON"));
