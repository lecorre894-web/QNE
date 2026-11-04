








"use strict";
function BB(n){
 const T=4*(n+1),cells=2*n;const pw=[1];for(let i=1;i<=cells;i++)pw[i]=pw[i-1]*T;
 const total=pw[cells],CAP=n<=3?200:1000;const tape=new Int8Array(2048);
 let best=0,champ=0;
 for(let m=0;m<total;m++){
  tape.fill(0);let head=1024,state=0,steps=0,ok=false;
  while(steps<CAP){const b=tape[head],idx=state*2+b,code=((m/pw[idx])|0)%T;
   tape[head]=code&1;head+=(code&2)?1:-1;steps++;const next=code>>2;
   if(next===n){ok=true;break;}state=next;if(head<1||head>=2047)break;}
  if(ok&&steps>best){best=steps;champ=m;}
 }
 return {best,total};
}
console.log("LE CASTOR AFFAIRE — le calcul le plus complexe (indecidable)");
console.log("--------------------------------------------------");
for(const n of [2,3]){const t=process.hrtime.bigint();const r=BB(n);const s=Number(process.hrtime.bigint()-t)/1e9;
 console.log("  BB("+n+") = "+r.best+" pas   (teste "+r.total.toLocaleString("fr-FR")+" machines en "+s.toFixed(1)+"s)");}
console.log("--------------------------------------------------");
console.log("connus (il a fallu des annees et des equipes entieres) :");
console.log("  BB(4) = 107   |   BB(5) = 47 176 870  (prouve seulement en 2024 !)");
console.log("  BB(6) = INCONNU, et plus grand que tout ce qu'on a affiche (depasse les tours, vers Graham).");
console.log("  BB(n) pour n assez grand est INDEPENDANT de ZFC : les maths elles-memes ne peuvent pas le decider.");
console.log("--------------------------------------------------");
console.log("c'est LE mur ultime : ni memoire, ni temps, ni langage — la LOGIQUE elle-meme s'arrete.");
console.log("aucune machine, aucun univers, ne calcule BB(n) en general. On l'a effleure aux petits n, c'est tout.");
