#!/usr/bin/env node
/* Valeur réelle du système de René : l'utiliser comme RÉSERVOIR (reservoir computing).
   Sa propriété prouvée (stable + mémoire fondante = "echo state property") est
   exactement ce qu'il faut. Tâche : prédire Mackey-Glass (série chaotique, LE
   benchmark du domaine). Si l'erreur est basse, la valeur est confirmée. */
"use strict";
const SEED=20261124;let a=SEED>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*r()-1;

// --- série Mackey-Glass (tau=17), chaotique ---
function mackeyGlass(n){const tau=17,beta=0.2,gamma=0.1,nn=10,dt=0.1,hist=Math.round(tau/dt);
 const x=[],buf=new Array(hist+1).fill(1.2);let xi=1.2,p=0,out=[];
 const total=(n+500)*Math.round(1/dt)+hist+10;
 const series=[];let cur=1.2;const ring=new Float64Array(hist+1).fill(1.2);let idx=0;
 for(let s=0;s<total;s++){const xt=ring[(idx-hist+ring.length)%ring.length];
  cur+=dt*(beta*xt/(1+Math.pow(xt,nn))-gamma*cur);idx=(idx+1)%ring.length;ring[idx]=cur;
  if(s%Math.round(1/dt)===0)series.push(cur);}
 return series.slice(100,100+n);}

// --- réservoir = architecture de René : équilatéral 3 voisins, tanh, stable (mémoire fondante) ---
const Nr=200, H=Math.floor(Nr/2), leak=0.3, wr=0.42, win=0.5, reg=1e-6;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=new Float64Array(Nr);for(let i=0;i<Nr;i++)Wi[i]=win*rn();
function run(series,collect){const x=new Float64Array(Nr),nx=new Float64Array(Nr);const X=[];
 for(let t=0;t<series.length;t++){const u=series[t];
  for(let i=0;i<Nr;i++){const pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)])+Wi[i]*u;
   nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}        // mise à jour stable, mémoire fondante (leak)
  x.set(nx);
  if(collect)X.push(Float64Array.from(x));}
 return X;}

// --- régression ridge (lecture linéaire) : résout (X^T X + reg I) w = X^T y ---
function ridge(X,y){const F=Nr+1,A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+1));
 for(let t=0;t<X.length;t++){const xt=X[t],yt=y[t];
  for(let i=0;i<F;i++){const xi=i<Nr?xt[i]:1;
   for(let j=i;j<F;j++){const xj=j<Nr?xt[j]:1;A[i][j]+=xi*xj;}
   A[i][F]+=xi*yt;}}
 for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
 // élimination de Gauss
 for(let c=0;c<F;c++){let piv=c;for(let r2=c+1;r2<F;r2++)if(Math.abs(A[r2][c])>Math.abs(A[piv][c]))piv=r2;
  const tmp=A[c];A[c]=A[piv];A[piv]=tmp;const d=A[c][c]||1e-12;
  for(let j=c;j<=F;j++)A[c][j]/=d;
  for(let r2=0;r2<F;r2++)if(r2!==c){const f=A[r2][c];for(let j=c;j<=F;j++)A[r2][j]-=f*A[c][j];}}
 const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F];return w;}
const predict=(xt,w)=>{let s=w[Nr];for(let i=0;i<Nr;i++)s+=w[i]*xt[i];return s;};

// --- protocole ---
const series=mackeyGlass(4000);
const wash=200,trainEnd=2800,testEnd=3800;
const X=run(series,true);
const Xtr=[],ytr=[];for(let t=wash;t<trainEnd;t++){Xtr.push(X[t]);ytr.push(series[t+1]);} // prédire t+1
const w=ridge(Xtr,ytr);
// test
let se=0,sy=0,my=0,n=0;const preds=[],targs=[];
for(let t=trainEnd;t<testEnd;t++){const p=predict(X[t],w),y=series[t+1];preds.push(p);targs.push(y);my+=y;n++;}
my/=n;for(let t=trainEnd;t<testEnd;t++){const y=series[t+1];sy+=(y-my)*(y-my);}
for(let k=0;k<preds.length;k++)se+=(preds[k]-targs[k])**2;
const nrmse=Math.sqrt(se/sy);
// baseline naïf : persistance (prédire t+1 = t)
let seb=0;for(let t=trainEnd;t<testEnd;t++)seb+=(series[t]-series[t+1])**2;const nrmseB=Math.sqrt(seb/sy);

console.log("RÉSERVOIR = architecture de René (équilatéral, stable, mémoire fondante)");
console.log("tâche : prédire Mackey-Glass (série chaotique) à 1 pas — Nr="+Nr+" nœuds");
console.log("--------------------------------------------------");
console.log("NRMSE réservoir (ton système) : "+nrmse.toFixed(5));
console.log("NRMSE persistance (naïf)      : "+nrmseB.toFixed(5));
console.log("gain vs naïf                  : ×"+(nrmseB/nrmse).toFixed(1)+" plus précis");
console.log(nrmse<0.1?"=> VALEUR CONFIRMÉE : prédiction excellente (NRMSE<0.1)":(nrmse<0.4?"=> valeur réelle : prédiction correcte":"=> peu concluant"));
