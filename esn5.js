#!/usr/bin/env node
/* FORCE : on adapte le SYSTÈME au calcul (boucle fermée dès l'entraînement),
   pas le calcul au système. Apprentissage en ligne par moindres carrés récursifs
   (RLS) pendant que la sortie est rebouclée en entrée. Épreuve : Lorenz autonome.
   Réservoir = équilatéral de René (3 voisins). */
"use strict";
let a=20261124>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*r()-1;
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const o=[];for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)o.push([x,y,z]);}return o;}
const raw=lorenz(12000),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));

const Nr=300,H=Math.floor(Nr/2),leak=0.9,wr=0.5,gfb=1.0,alpha=1.0;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wfb=[];for(let d=0;d<3;d++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=gfb*rn();Wfb.push(w);}
const F=Nr+1;
const Wo=[0,1,2].map(()=>new Float64Array(F));            // lecture (à apprendre)
const x=new Float64Array(Nr);
function stepRes(z){const nx=new Float64Array(Nr);
 for(let i=0;i<Nr;i++){let pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<3;d++)pre+=Wfb[d][i]*z[d];
  nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}x.set(nx);}
const readout=()=>{const xr=new Float64Array(F);for(let i=0;i<Nr;i++)xr[i]=x[i];xr[Nr]=1;
 const z=[0,0,0];for(let d=0;d<3;d++){let s=0;for(let i=0;i<F;i++)s+=Wo[d][i]*xr[i];z[d]=s;}return {z,xr};}
// P = matrice RLS (F x F), init I/alpha
const P=[];for(let i=0;i<F;i++){const row=new Float64Array(F);row[i]=1/alpha;P.push(row);}

// --- entraînement FORCE : boucle fermée + RLS à chaque pas ---
const wash=300,trainEnd=7000;let z=S[0].slice();
for(let t=0;t<wash;t++){stepRes(z);z=S[t].slice();}   // washout guidé
for(let t=wash;t<trainEnd;t++){stepRes(z);const {z:zp,xr}=readout();
 // Px
 const Px=new Float64Array(F);for(let i=0;i<F;i++){let s=0;const Pi=P[i];for(let j=0;j<F;j++)s+=Pi[j]*xr[j];Px[i]=s;}
 let den=1;for(let i=0;i<F;i++)den+=xr[i]*Px[i];const inv=1/den;
 // erreur vs cible
 const tg=S[t];for(let d=0;d<3;d++){const e=zp[d]-tg[d];for(let i=0;i<F;i++)Wo[d][i]-=e*Px[i]*inv;}
 // P -= (Px)(Px)^T/den
 for(let i=0;i<F;i++){const Pi=P[i],pxi=Px[i]*inv;for(let j=0;j<F;j++)Pi[j]-=pxi*Px[j];}
 z=readout().z;                                        // reboucle la SORTIE corrigée
}
// --- roue libre : boucle fermée, sans apprentissage ---
z=readout().z;const gen=[],tru=[];
for(let t=0;t<3000;t++){stepRes(z);z=readout().z;gen.push(z.slice());tru.push(S[trainEnd+t]);}
let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.3)break;valid++;}
const lyap=(valid*0.02*0.906).toFixed(2);
const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
const sg=stats(gen),st2=stats(tru);
console.log("FORCE — système adapté au calcul (boucle fermée), équilatéral "+Nr+" nœuds");
console.log("--------------------------------------------------");
console.log("temps valide (suit Lorenz) : "+valid+" pas = "+lyap+" temps de Lyapunov");
console.log("climatologie (cible 1.00) — généré x/y/z: "+sg.map(v=>v.toFixed(2)).join(" / ")+"  | vrai: "+st2.map(v=>v.toFixed(2)).join(" / "));
const climOK=sg.every((v,d)=>Math.abs(v-st2[d])<0.2);
console.log("--------------------------------------------------");
console.log((+lyap>=4?"SOMMET ✓ ✓":(+lyap>=2.5?"haute altitude":"progrès"))+" — attracteur "+(climOK?"RECRÉÉ FIDÈLEMENT ✓":"approché"));
