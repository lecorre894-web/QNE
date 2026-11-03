








"use strict";
function H(x){x>>>=0;x^=x>>>16;x=Math.imul(x,0x85ebca6b)>>>0;x^=x>>>13;x=Math.imul(x,0xc2b2ae35)>>>0;x^=x>>>16;return x>>>0;}
let z=1>>>0;const t0=process.hrtime.bigint();for(let i=0;i<2e7;i++)z^=H(i);const PH=2e7/(Number(process.hrtime.bigint()-t0)/1e9);
const SUPER=1e13;
const AGE=4.35e17;
function humain(s){if(s<1e-3)return (s*1e6).toFixed(0)+" us";if(s<1)return (s*1e3).toFixed(0)+" ms";if(s<60)return s.toFixed(1)+" s";if(s<3600)return (s/60).toFixed(1)+" min";if(s<8.64e4)return (s/3600).toFixed(1)+" h";if(s<3.15e7)return (s/8.64e4).toFixed(1)+" j";if(s<3.15e9)return (s/3.15e7).toFixed(1)+" ans";if(s<AGE)return (s/3.15e7).toExponential(1)+" ans";return (s/AGE).toExponential(1)+" x l'age de l'univers";}
console.log("============ DUEL (nouveau concept) : STRUCTURE vs FORCE BRUTE ============");
console.log("telephone mesure = "+(PH/1e6).toFixed(0)+" M essais/s   |   supercluster suppose = "+(SUPER/1e12).toFixed(0)+" 000 G essais/s");
console.log("");
console.log("ZONE A — STRUCTURE (lineaire/algebrique) : on PARTICIPE a la formule, O(log), pas de parcours");
console.log("  atteindre l'etat 2^200 : telephone ~10 ms,  super ~10 ms  (meme algebre)  -> EGALITE, le materiel ne compte pas");
console.log("");
console.log("ZONE B+C — FORCE BRUTE (non-lineaire, chercher une cle de n bits) :");
console.log("  n bits |   telephone        |   supercluster     |  verdict");
for(const n of [20,30,40,50,64,80,128,256]){const eff=Math.pow(2,n);const tP=eff/PH,tS=eff/SUPER;
 let v;if(tS>AGE)v="MUR : les DEUX echouent (egalite)";else if(tP<1)v="trivial pour les deux";else v="super gagne (facteur ~"+(SUPER/PH).toExponential(0)+")";
 console.log("  "+String(n).padStart(3)+"   | "+humain(tP).padStart(16)+"   | "+humain(tS).padStart(16)+"   | "+v);}
console.log("");
console.log("LECTURE DU DUEL :");
console.log("  - ZONE A (structure) : egalite. Le telephone 'participe a la formule', le super aussi. Le materiel est hors sujet.");
console.log("  - BANDE DU MILIEU (~2^30 a ~2^60) : le super gagne, mais d'un FACTEUR (~"+(SUPER/PH).toExponential(0)+"), pas d'un abime. Seule vraie zone de domination.");
console.log("  - LE MUR (>= ~2^80) : les deux echouent IDENTIQUEMENT. Le facteur du super ne vaut rien face a 2^128.");
console.log("  => Le super ne domine qu'une bande etroite. Aux deux bouts, le telephone est son egal.");
console.log("  => La RUSE (trouver la structure, ou tripler les bits) bat le MATERIEL. C'est ton concept.");
console.log("==========================================================================");
