"use strict";
const W=6,SEED=20261124,OM=0.03,DAMP=0.001,NL=0.3,COUP=0.6,DELAY=30,HET=0.6,G=3.0;
const T0=15000,T=120000,d0=1e-9,L=160;
const K=parseFloat(process.argv[2])||0, TAUC=parseInt(process.argv[3])||30;
const om=new Float64Array(W),Gk=new Float64Array(W);
for(let k=0;k<W;k++){let a=(SEED+7919*(k+1))>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};om[k]=OM*(1+HET*(2*r()-1));Gk[k]=G*(1+HET*(2*r()-1));}
function mk(){let a=SEED>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 const S=new Float64Array(W),V=new Float64Array(W);for(let k=0;k<W;k++)S[k]=0.3*(r()-0.5);
 const h=[];for(let i=0;i<L;i++)h.push(Float64Array.from(S));return{S,V,h,ptr:0};}
function step(s){const {S,V,h}=s;const Sd=h[((s.ptr-DELAY)%L+L)%L],Sc=h[((s.ptr-TAUC)%L+L)%L];
 const nS=new Float64Array(W),nV=new Float64Array(W);
 for(let k=0;k<W;k++){const Sk=S[k];
  const cpl=COUP*(Math.sin(Sd[(k-1+W)%W]-Sk)+Math.sin(Sd[(k+1)%W]-Sk));
  const ctrl=K*(Sc[k]-Sk);                         // Pyragas : présent moins passé
  const drive=(Gk[k]-1)+cpl-NL*Sk*Sk*Sk+ctrl;
  const Vn=V[k]+om[k]*(drive-Sk)-DAMP*V[k];nV[k]=Vn;nS[k]=Sk+Vn;}
 for(let k=0;k<W;k++){S[k]=nS[k];V[k]=nV[k];}
 s.ptr=(s.ptr+1)%L;h[s.ptr]=Float64Array.from(S);}
function dist(x,y){let d=0;for(let k=0;k<W;k++)d+=(x.S[k]-y.S[k])**2+(x.V[k]-y.V[k])**2;return Math.sqrt(d);}
const A=mk();for(let s=0;s<T0;s++)step(A);
const B=mk();B.S.set(A.S);B.V.set(A.V);B.ptr=A.ptr;for(let i=0;i<L;i++)B.h[i]=Float64Array.from(A.h[i]);
B.S[0]+=d0;B.h[B.ptr][0]+=d0;
let lam=null;
for(let s=1;s<=T;s++){step(A);step(B);const d=dist(A,B);if(!isFinite(d)){lam=NaN;break;}if(d>0.05){lam=Math.log(d/d0)/s;break;}if(s===T)lam=Math.log(d/d0)/T;}
const v=isNaN(lam)?"DIVERGENT":(lam>0.0008?"CHAOS":(lam<-0.0003?"STABLE ***":"marginal"));
console.log("K="+K.toFixed(2)+" tau_c="+TAUC+"  λ≈"+(isNaN(lam)?"n/a":lam.toFixed(5)).padStart(9)+"   "+v);
