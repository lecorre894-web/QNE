"use strict";
// Mémoire ADAPTATIVE : trace m = moyenne glissante du passé, vitesse d'oubli
// beta qui s'ajuste à l'agitation |V|. Pas de retard rigide, pas de correcteur.
// Mesure: Benettin rigoureux (renormalisation à chaque pas) sur l'état [S,V,m].
const W=6,SEED=20261124,OM=0.03,DAMP=0.001,NL=0.3,COUP=0.6,HET=0.6,G=3.0;
const T0=20000,T=200000,d0=1e-9;
const BETA0=parseFloat(process.argv[2]); const b0=isNaN(BETA0)?0.05:BETA0;
const BGAIN=parseFloat(process.argv[3]); const bg=isNaN(BGAIN)?0.5:BGAIN;
const om=new Float64Array(W),Gk=new Float64Array(W);
for(let k=0;k<W;k++){let a=(SEED+7919*(k+1))>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};om[k]=OM*(1+HET*(2*r()-1));Gk[k]=G*(1+HET*(2*r()-1));}
function mk(){let a=SEED>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 const S=new Float64Array(W),V=new Float64Array(W),m=new Float64Array(W);for(let k=0;k<W;k++){S[k]=0.3*(r()-0.5);m[k]=S[k];}return{S,V,m};}
function step(s){const{S,V,m}=s;const nS=new Float64Array(W),nV=new Float64Array(W),nm=new Float64Array(W);
 for(let k=0;k<W;k++){const Sk=S[k];
  const cpl=COUP*(Math.sin(m[(k-1+W)%W]-Sk)+Math.sin(m[(k+1)%W]-Sk));  // couplage à la MÉMOIRE des voisins
  const drive=(Gk[k]-1)+cpl-NL*Sk*Sk*Sk;
  const Vn=V[k]+om[k]*(drive-Sk)-DAMP*V[k];const Sn=Sk+Vn;
  let beta=b0+bg*Math.abs(Vn); if(beta>0.5)beta=0.5; if(beta<0.001)beta=0.001;  // oubli ADAPTATIF
  nV[k]=Vn;nS[k]=Sn;nm[k]=m[k]+beta*(Sn-m[k]);}
 for(let k=0;k<W;k++){S[k]=nS[k];V[k]=nV[k];m[k]=nm[k];}}
function dist(x,y){let d=0;for(let k=0;k<W;k++)d+=(x.S[k]-y.S[k])**2+(x.V[k]-y.V[k])**2+(x.m[k]-y.m[k])**2;return Math.sqrt(d);}
const A=mk();for(let s=0;s<T0;s++)step(A);
const B=mk();B.S.set(A.S);B.V.set(A.V);B.m.set(A.m);B.S[0]+=d0;
let acc=0,bad=0;
for(let s=0;s<T;s++){step(A);step(B);const d=dist(A,B);if(!isFinite(d)){bad=1;break;}
 if(d>0){acc+=Math.log(d/d0);const f=d0/d;for(let k=0;k<W;k++){B.S[k]=A.S[k]+(B.S[k]-A.S[k])*f;B.V[k]=A.V[k]+(B.V[k]-A.V[k])*f;B.m[k]=A.m[k]+(B.m[k]-A.m[k])*f;}}}
const lam=bad?NaN:acc/T;
const v=isNaN(lam)?"DIVERGENT":(lam>0.0005?"CHAOS":(lam<-0.0003?"STABLE ***":"marginal"));
console.log("beta0="+b0.toFixed(3)+" gain_adapt="+bg.toFixed(2)+"  λ="+(isNaN(lam)?"n/a":lam.toFixed(6)).padStart(10)+"   "+v);
