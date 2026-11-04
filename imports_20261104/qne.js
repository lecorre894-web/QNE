#!/usr/bin/env node
/* QNE — Quantique-Neuronal Équilatéral (émulateur / coprocesseur)
   Concept : René LE CORRE. Trois piliers de poids égal (1/3) :
   quantique (re,im) + neuronal (tanh) + symbolique {0,1,2}.
   Maillage équilatéral = graphe 3-régulier (3 voisins par nœud).
   Usage : node qne.js [nœuds] [pas]  — Simulation, pas de quantique physique. */
"use strict";
function rng(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const N=Math.max(6,parseInt(process.argv[2],10)||50000);
const STEPS=Math.max(1,parseInt(process.argv[3],10)||400);
const SEED=20261124;const r=rng(SEED);
const re=new Float64Array(N),im=new Float64Array(N);
const nre=new Float64Array(N),nim=new Float64Array(N);
const act=new Float64Array(N),nact=new Float64Array(N);
const sym=new Int8Array(N),nsym=new Int8Array(N);
const H=Math.floor(N/2);
function nb(i,k){if(k===0)return(i+1)%N;if(k===1)return(i-1+N)%N;return(i+H)%N;}
for(let i=0;i<N;i++){const ph=r()*2*Math.PI,amp=0.5+0.5*r();re[i]=amp*Math.cos(ph);im[i]=amp*Math.sin(ph);act[i]=2*r()-1;sym[i]=(r()*3)|0;}
const TWO3=2*Math.PI/3,THIRD=1/3;
function step(){
 for(let i=0;i<N;i++){
  const a=nb(i,0),b=nb(i,1),c=nb(i,2);
  const s=(sym[a]+sym[b]+sym[c])%3;
  const na=Math.tanh(THIRD*(act[a]+act[b]+act[c])+0.15);
  let mr=THIRD*(re[a]+re[b]+re[c]);let mi=THIRD*(im[a]+im[b]+im[c]);
  mr=0.5*re[i]+0.5*mr;mi=0.5*im[i]+0.5*mi;
  const phi=s*TWO3*0.5,cs=Math.cos(phi),sn=Math.sin(phi),g=0.5*(1+na);
  nre[i]=g*(mr*cs-mi*sn);nim[i]=g*(mr*sn+mi*cs);nact[i]=na;nsym[i]=s;
 }
 let norm=0;for(let i=0;i<N;i++)norm+=nre[i]*nre[i]+nim[i]*nim[i];
 norm=Math.sqrt(norm/N)||1;const inv=1/norm;
 re.set(nre);im.set(nim);act.set(nact);sym.set(nsym);
 for(let i=0;i<N;i++){re[i]*=inv;im[i]*=inv;}
}
function equilibre(){let mr=0,mi=0,ma=0,s0=0,s1=0,s2=0,en=0;
 for(let i=0;i<N;i++){mr+=re[i];mi+=im[i];ma+=act[i];en+=re[i]*re[i]+im[i]*im[i];const s=sym[i];if(s===0)s0++;else if(s===1)s1++;else s2++;}
 return{coherence:Math.hypot(mr/N,mi/N),energie:en/N,equi:1-(Math.abs(s0-N/3)+Math.abs(s1-N/3)+Math.abs(s2-N/3))/N,rep:[s0,s1,s2]};}
console.log("QNE — Quantique-Neuronal Équilatéral");
console.log("nœuds="+N+" pas="+STEPS+" graine="+SEED+" (3 voisins, 3 piliers)");
const e0=equilibre();console.log("init: cohérence="+e0.coherence.toFixed(4)+" équilibre="+e0.equi.toFixed(4));
const t0=process.hrtime.bigint();for(let s=0;s<STEPS;s++)step();const t1=process.hrtime.bigint();
const ms=Number(t1-t0)/1e6,up=N*STEPS,ups=up/(ms/1000),e1=equilibre();
console.log("--------------------------------------------------");
console.log("temps        : "+ms.toFixed(1)+" ms");
console.log("mises à jour : "+up.toLocaleString("fr-FR"));
console.log("SCORE COPROC.: "+Math.round(ups).toLocaleString("fr-FR")+" maj/s");
console.log("débit/nœud   : "+(ups/N).toFixed(1)+" pas/s");
console.log("cohérence    : "+e1.coherence.toFixed(4));
console.log("équilibre    : "+e1.equi.toFixed(4)+" (1=triangle parfait)");
console.log("énergie moy. : "+e1.energie.toFixed(4));
console.log("répart.0/1/2 : "+e1.rep.join(" / "));
