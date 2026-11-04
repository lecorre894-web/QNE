








"use strict";
const N=8;
let s=12345>>>0;const rnd=()=>((s=(s*1103515245+12345)>>>0)>>16)&1;
const Mm=Array.from({length:N},()=>Array.from({length:N},()=>rnd()));
const xb=Array.from({length:N},()=>rnd());
const yExact=Mm.map(row=>row.reduce((acc,m,j)=>acc^(m&xb[j]),0));
const dotC=(row,x)=>{let p=1;for(let j=0;j<N;j++)p*=(1-2*(row[j]*x[j]));return (1-p)/2;};
const ySci=Mm.map(row=>dotC(row,xb));
let ok=true;for(let i=0;i<N;i++)if(Math.abs(ySci[i]-yExact[i])>1e-9)ok=false;
console.log("GF(2) MATERIALISE EN CALCUL SCIENTIFIQUE");
console.log("--------------------------------------------------");
console.log("produit matrice-vecteur GF(2), "+N+"x"+N);
console.log("  exact (bits)       : ["+yExact.join(" ")+"]");
console.log("  scientifique (reel): ["+ySci.map(v=>v.toFixed(0)).join(" ")+"]   identique ? "+(ok?"VRAI":"faux"));
console.log("--------------------------------------------------");
const xg=xb.map((b,i)=>b?0.85:0.15);xg[3]=0.5;
const yg=Mm.map(row=>dotC(row,xg));
console.log("meme calcul avec une entree GRADUEE (reelle, bit3=0.5 indecis) :");
console.log("  sortie continue : ["+yg.map(v=>v.toFixed(2)).join(" ")+"]");
console.log("--------------------------------------------------");
console.log("=> GF(2) devient de l'algebre lineaire REELLE : exacte sur 0/1, continue et derivable entre.");
console.log("   Resoudre un systeme GF(2) = Gauss ; l'optimiser = gradient. C'est du calcul scientifique.");
console.log("   Tout notre GF(2^128) (multiply, LFSR, cryptanalyse) vit maintenant dans ce langage commun.");
