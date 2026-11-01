"use strict";
// Debit de GENERATION du jumeau non-lineaire : combien d'etats du monde chaotique
// il produit par seconde, en boucle fermee (paquet microseconde).
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1;
const Nr=300,H=150,leak=0.95,wr=0.33,win=0.4;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=[0,1,2].map(()=>{const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=win*rn();return w;});
const F=2*Nr+1;const Wo=[0,1,2].map(()=>{const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=0.01*rn();return w;});
const x=new Float64Array(Nr);
function step(u){const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}x.set(nx);}
function out(){let o=[0,0,0];for(let d=0;d<3;d++){let s=0;const w=Wo[d];for(let i=0;i<Nr;i++){s+=w[i]*x[i]+w[Nr+i]*x[i]*x[i];}s+=w[F-1];o[d]=Math.tanh(s*0.3);}return o;}
const N=1000000;let u=[0.1,0.1,0.1];const t0=process.hrtime.bigint();
for(let k=0;k<N;k++){step(u);u=out();}
const sec=Number(process.hrtime.bigint()-t0)/1e9;
const rate=N/sec, usStep=sec/N*1e6;
const CMB=13.8e9*365.25*86400;         // duree cosmique en secondes
console.log("JUMEAU non-lineaire — debit de generation (etats du monde chaotique)");
console.log("  "+rate.toExponential(2)+" etats/s  ("+usStep.toFixed(2)+" us/etat, "+Nr+" neurones)");
console.log("  sur une duree de CMB ("+CMB.toExponential(2)+" s) : "+(rate*CMB).toExponential(2)+" etats generes");
