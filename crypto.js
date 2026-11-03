








"use strict";
function H(x){x>>>=0;x^=x>>>16;x=Math.imul(x,0x85ebca6b)>>>0;x^=x>>>13;x=Math.imul(x,0xc2b2ae35)>>>0;x^=x>>>16;return x>>>0;}
const pc=(n)=>{n=n>>>0;let c=0;while(n){c+=n&1;n>>>=1;}return c;};
console.log("================ CRYPTO — bibliotheque d'apprentissage ================");
console.log("\n[1] SENS UNIQUE : H(graine) est instantane ; retrouver la graine depuis H exige de CHERCHER.");
console.log("    H(123456) = 0x"+H(123456).toString(16)+"  (immediat) ; l'inverse n'a pas de formule.");
console.log("\n[2] 1 BIT = 1 DOUBLEMENT : essais moyens pour viser n bits precis ~ 2^n ; chaque bit DOUBLE.");
let prev=0;
for(const n of [10,11,12,13,14,15]){const MASK=(1<<n)-1,S=120;let sum=0;
 for(let s=0;s<S;s++){const CIB=H((s*2654435761)>>>0)&MASK;let k=0,x=(s*77777+1)>>>0;
  while((H(x)&MASK)!==CIB){x=(x+0x9E3779B9)>>>0;k++;}sum+=k;}
 const moy=sum/S;console.log("    "+n+" bits : "+Math.round(moy).toLocaleString("fr-FR").padStart(8)+" essais moyens"+(prev?"   x"+(moy/prev).toFixed(2)+" vs bit precedent":"   (2^10="+1024+")"));prev=moy;}
console.log("\n[3] PREUVE DE TRAVAIL : trouver un nonce dont H a k zeros binaires en tete (cout ~2^k).");
for(const k of [8,12,16,20]){let n=1;const t=process.hrtime.bigint();while((H(n)>>>(32-k))!==0)n++;const ms=Number(process.hrtime.bigint()-t)/1e6;
 console.log("    "+String(k).padStart(2)+" zeros -> nonce "+String(n).padStart(9)+" en "+ms.toFixed(1)+" ms   (theorie 2^"+k+"="+(2**k).toLocaleString("fr-FR")+")");}
console.log("\n[4] AVALANCHE : changer 1 bit d'entree bascule ~50% des bits de sortie (32).");
let tot=0;for(let i=0;i<2000;i++)tot+=pc(H(i)^H(i^1));
console.log("    moyenne de bits changes = "+(tot/2000).toFixed(1)+" / 32  (ideal 16)");
console.log("\n[5] LE MUR : 128 bits = 2^128 essais. A 1000 milliards/s -> ~"+(Math.pow(2,128)/1e12/3.15e7/1e9).toExponential(1)+" milliards d'annees.");
console.log("    => ta cle = une graine secrete ; l'attaque = injecter+verifier ; la securite = assez de bits.");
console.log("======================================================================");
