"use strict";
const W=6,SEED=20261124,OM=0.03,DAMP=0.001,NL=0.3,COUP=0.6,DELAY=30,HET=0.6,G=3.0;
const T0=15000,T=120000,d0=1e-9,L=64;
const MU=parseFloat(process.argv[2]); const mu=isNaN(MU)?0:MU;   // couplage inter-chambres (présent)
const om=new Float64Array(W),Gk=new Float64Array(W);
for(let k=0;k<W;k++){let a=(SEED+7919*(k+1))>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};om[k]=OM*(1+HET*(2*r()-1));Gk[k]=G*(1+HET*(2*r()-1));}
function mk(seed){let a=seed>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 const SA=new Float64Array(W),VA=new Float64Array(W),SB=new Float64Array(W),VB=new Float64Array(W);
 for(let k=0;k<W;k++){SA[k]=0.3*(r()-0.5);SB[k]=0.3*(r()-0.5);}
 const hA=[],hB=[];for(let i=0;i<L;i++){hA.push(Float64Array.from(SA));hB.push(Float64Array.from(SB));}
 return{SA,VA,SB,VB,hA,hB,ptr:0};}
function step(s){const {SA,VA,SB,VB,hA,hB}=s;const dA=hA[((s.ptr-DELAY)%L+L)%L],dB=hB[((s.ptr-DELAY)%L+L)%L];
 const nA=new Float64Array(W),nVA=new Float64Array(W),nB=new Float64Array(W),nVB=new Float64Array(W);
 for(let k=0;k<W;k++){
  let A=SA[k];const cA=COUP*(Math.sin(dA[(k-1+W)%W]-A)+Math.sin(dA[(k+1)%W]-A))+mu*(SB[k]-A)-NL*A*A*A;
  const vA=VA[k]+om[k]*((Gk[k]-1)+cA-A)-DAMP*VA[k];nVA[k]=vA;nA[k]=A+vA;
  let B=SB[k];const cB=COUP*(Math.sin(dB[(k-1+W)%W]-B)+Math.sin(dB[(k+1)%W]-B))+mu*(SA[k]-B)-NL*B*B*B;
  const vB=VB[k]+om[k]*((Gk[k]-1)+cB-B)-DAMP*VB[k];nVB[k]=vB;nB[k]=B+vB;}
 for(let k=0;k<W;k++){SA[k]=nA[k];VA[k]=nVA[k];SB[k]=nB[k];VB[k]=nVB[k];}
 s.ptr=(s.ptr+1)%L;hA[s.ptr]=Float64Array.from(SA);hB[s.ptr]=Float64Array.from(SB);}
function dist(x,y){let d=0;for(let k=0;k<W;k++){d+=(x.SA[k]-y.SA[k])**2+(x.VA[k]-y.VA[k])**2+(x.SB[k]-y.SB[k])**2+(x.VB[k]-y.VB[k])**2;}return Math.sqrt(d);}
const A=mk(SEED);for(let s=0;s<T0;s++)step(A);
const Bc=mk(SEED);Bc.SA.set(A.SA);Bc.VA.set(A.VA);Bc.SB.set(A.SB);Bc.VB.set(A.VB);Bc.ptr=A.ptr;for(let i=0;i<L;i++){Bc.hA[i]=Float64Array.from(A.hA[i]);Bc.hB[i]=Float64Array.from(A.hB[i]);}
Bc.SA[0]+=d0;Bc.hA[Bc.ptr][0]+=d0;
let lam=null;
for(let s=1;s<=T;s++){step(A);step(Bc);const d=dist(A,Bc);
 if(!isFinite(d)){lam=NaN;break;}
 if(d>0.05){lam=Math.log(d/d0)/s;break;}
 if(s===T)lam=Math.log(d/d0)/T;}
const v=isNaN(lam)?"DIVERGENT":(lam>0.0008?"*** CHAOS (λ>0) ***":(lam<-0.0003?"stable (λ<0)":"marginal"));
console.log("MU(inter-chambres)="+mu.toFixed(3)+"  λ≈"+(isNaN(lam)?"n/a":lam.toFixed(5))+"   "+v);
