








"use strict";
const cube=(n)=>n*n*n;
const c42=[-80538738812075974n, 80435758145817515n, 12602123297335631n];
const c33=[8866128975287528n, -8778405442862239n, -2736111468807040n];
const s42=cube(c42[0])+cube(c42[1])+cube(c42[2]);
const s33=cube(c33[0])+cube(c33[1])+cube(c33[2]);
console.log("VERIFICATION DES RESULTATS MACHINE (on juge au resultat) :");
console.log("  42 = x^3+y^3+z^3 ?  -> "+s42+"   "+(s42===42n?"EXACT OK":"FAUX"));
console.log("  33 = x^3+y^3+z^3 ?  -> "+s33+"   "+(s33===33n?"EXACT OK":"FAUX"));
console.log("--------------------------------------------------");
function cherche(k,B){for(let x=-B;x<=B;x++){const x3=BigInt(x)**3n;for(let y=x;y<=B;y++){const r=BigInt(k)-x3-BigInt(y)**3n;
 let z=Math.round(Math.cbrt(Number(r)));for(const zz of [z-1,z,z+1]){if(BigInt(zz)**3n===r&&zz>=y)return [x,y,zz];}}}return null;}
console.log("recherche machine des petites solutions (|x,y,z| <= 200) :");
for(const k of [1,2,3,6,7,8,9,10,11,15,42,29,74]){const s=cherche(k,200);
 console.log("  k="+String(k).padStart(2)+" : "+(s?s.join("^3 + ")+"^3":"rien sous 200 (cas dur)"));}
console.log("--------------------------------------------------");
console.log("k = 4 ou 5 (mod 9) est IMPOSSIBLE (preuve humaine) ; les autres sont des recherches machine.");
