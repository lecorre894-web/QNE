"use strict";
const W=parseInt(process.argv[2])||6, G=parseFloat(process.argv[3])||3.0;
const COUP=parseFloat(process.argv[4]), COUPL=isNaN(COUP)?0.2:COUP;
const HET=parseFloat(process.argv[5]), H=isNaN(HET)?0.6:HET;
const NL=parseFloat(process.argv[6]), NLv=isNaN(NL)?0.3:NL;
const OMEGA2=0.03,DAMP=0.001,SEED=20261124;
const T0=20000,T=200000,d0=1e-9;
// params propres par CPU (même schéma que qneX)
const omk=new Float64Array(W),Gk=new Float64Array(W);
for(let k=0;k<W;k++){let a=(SEED+7919*(k+1))>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 omk[k]=OMEGA2*(1+H*(2*r()-1));Gk[k]=G*(1+H*(2*r()-1));}
function step(S,V){const nS=new Float64Array(W),nV=new Float64Array(W);
 for(let k=0;k<W;k++){const Sl=S[(k-1+W)%W],Sr=S[(k+1)%W],Sk=S[k];
  const drive=(Gk[k]-1)+COUPL*(Math.sin(Sl-Sk)+Math.sin(Sr-Sk))-NLv*Sk*Sk*Sk;
  const Vn=V[k]+omk[k]*(drive-Sk)-DAMP*V[k];nV[k]=Vn;nS[k]=Sk+Vn;}
 for(let k=0;k<W;k++){S[k]=nS[k];V[k]=nV[k];}}
let a=SEED>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const S=new Float64Array(W),V=new Float64Array(W);
for(let k=0;k<W;k++){S[k]=0.3*(r()-0.5);V[k]=0;}
for(let s=0;s<T0;s++)step(S,V);                    // transitoire
const Sp=Float64Array.from(S),Vp=Float64Array.from(V);Sp[0]+=d0;
let acc=0;
for(let s=0;s<T;s++){step(S,V);step(Sp,Vp);
 let d=0;for(let k=0;k<W;k++){const a1=S[k]-Sp[k],a2=V[k]-Vp[k];d+=a1*a1+a2*a2;}d=Math.sqrt(d);
 if(d>0){acc+=Math.log(d/d0);const f=d0/d;for(let k=0;k<W;k++){Sp[k]=S[k]+(Sp[k]-S[k])*f;Vp[k]=V[k]+(Vp[k]-V[k])*f;}}}
const lam=acc/T;
console.log("W="+W+" G="+G+" coupl="+COUPL+" hétéro="+H+" nonlin="+NLv+"  =>  λ = "+lam.toFixed(6)+"  "+(lam>0.0005?"CHAOS (λ>0)":(lam<-0.0005?"stable/convergent (λ<0)":"≈ marginal (λ≈0)")));
