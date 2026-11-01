#!/usr/bin/env node
/* Épreuve ultime : le système de René (réservoir) apprend LORENZ (chaos 3D),
   puis tourne SEUL (boucle fermée) pour recréer l'attracteur de mémoire.
   On mesure : combien de temps il suit la vraie trajectoire (temps valide),
   et s'il reproduit la "climatologie" de l'attracteur (statistiques). */
"use strict";
let a=20261124>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*r()-1;
// --- Lorenz 63 ---
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const out=[];
 for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)out.push([x,y,z]);}return out;}
const raw=lorenz(12000);
// normalisation
const mu=[0,0,0],sd=[0,0,0];for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));
// --- réservoir = architecture de René ---
const Nr=400,H=Math.floor(Nr/2),leak=0.25,wr=0.28,win=0.5,reg=3e-3;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=[];for(let d=0;d<3;d++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=win*rn();Wi.push(w);}
function upd(x,u){const nx=new Float64Array(Nr);
 for(let i=0;i<Nr;i++){let pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];
  nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}return nx;}
// --- collecte états (teacher forcing) ---
const wash=300,trainEnd=8000;
let x=new Float64Array(Nr);const X=[];
for(let t=0;t<trainEnd;t++){x=upd(x,S[t]);if(t>=wash)X.push(x);}
// --- ridge 3 sorties : prédire S[t+1] ---
const F=Nr+1;const A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+3));
for(let k=0;k<X.length;k++){const xt=X[k],tgt=S[wash+k+1];
 for(let i=0;i<F;i++){const xi=i<Nr?xt[i]:1;for(let j=i;j<F;j++){const xj=j<Nr?xt[j]:1;A[i][j]+=xi*xj;}
  for(let d=0;d<3;d++)A[i][F+d]+=xi*tgt[d];}}
for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
for(let c=0;c<F;c++){let piv=c;for(let r2=c+1;r2<F;r2++)if(Math.abs(A[r2][c])>Math.abs(A[piv][c]))piv=r2;const tmp=A[c];A[c]=A[piv];A[piv]=tmp;const d=A[c][c]||1e-12;for(let j=c;j<F+3;j++)A[c][j]/=d;for(let r2=0;r2<F;r2++)if(r2!==c){const f=A[r2][c];for(let j=c;j<F+3;j++)A[r2][j]-=f*A[c][j];}}
const Wo=[0,1,2].map(d=>{const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F+d];return w;});
const out=xt=>[0,1,2].map(d=>{let s=Wo[d][Nr];for(let i=0;i<Nr;i++)s+=Wo[d][i]*xt[i];return s;});
// --- ROUE LIBRE : le réservoir se nourrit de ses propres sorties ---
let xs=X[X.length-1];let u=out(xs);
const gen=[],tru=[];const start=trainEnd;
for(let t=0;t<3000;t++){xs=upd(xs,u);u=out(xs);gen.push(u);tru.push(S[start+t+1]);}
// temps valide (NRMSE<0.3 en glissant) + Lyapunov Lorenz ~0.906/ut, dt=0.02 => 1 temps Lyap ~55 pas
let validSteps=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.3)break;validSteps++;}
const lyapTime=(validSteps*0.02*0.906).toFixed(2);
// climatologie reproduite ? std des sorties générées vs vraies (sur tout le free-run)
function stats(arr){const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));}
const sg=stats(gen),st=stats(tru);
console.log("ÉPREUVE LORENZ — le système de René (réservoir "+Nr+" nœuds) apprend puis recrée le chaos");
console.log("--------------------------------------------------");
console.log("temps valide (suit la vraie trajectoire) : "+validSteps+" pas = "+lyapTime+" temps de Lyapunov");
console.log("climatologie de l'attracteur (écart-type normalisé, cible=1.00) :");
console.log("  généré  x/y/z : "+sg.map(v=>v.toFixed(2)).join(" / "));
console.log("  vrai    x/y/z : "+st.map(v=>v.toFixed(2)).join(" / "));
const climOK=sg.every((v,d)=>Math.abs(v-st[d])<0.25);
console.log("--------------------------------------------------");
console.log("Trajectoire suivie ~"+lyapTime+" temps de Lyapunov (excellent si >4) ; attracteur reproduit : "+(climOK?"OUI (il recrée le papillon de mémoire)":"partiellement"));
