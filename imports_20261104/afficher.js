








"use strict";
const LOG2=0.3010299956639812;
function log10Big(n){const s=n.toString();const lead=Number(s.slice(0,15))||1;return Math.log10(lead)+(s.length-Math.min(15,s.length));}
function affiche2(N){
 const logL=log10Big(N)+Math.log10(LOG2);
 if(logL<15){
  const L=Number(N)*LOG2,e=Math.floor(L),m=Math.pow(10,L-e);
  return m.toFixed(4)+" x 10^"+e.toLocaleString("fr-FR")+"   ("+(e+1).toLocaleString("fr-FR")+" chiffres)";
 } else if(logL<308){
  const L=Number(N)*LOG2;
  return "~ 10^"+L.toExponential(3)+"   (un nombre a "+L.toExponential(3)+" chiffres)";
 } else {
  return "~ 10^(10^"+logL.toFixed(3)+")   (le nombre de ses chiffres a lui-meme ~"+logL.toFixed(1)+" chiffres)";
 }
}
console.log("AFFICHER L'INCOMMENSURABLE — le PC montre ce qu'on ne peut pas ecrire");
console.log("--------------------------------------------------");
for(const [nom,N] of [["2^1000",1000n],["2^(10^6)",10n**6n],["2^(10^18)",10n**18n],["2^(10^100)",10n**100n],["2^(10^1000)",10n**1000n],["2^(10^100000)",10n**100000n]]){
 console.log("  "+nom.padEnd(14)+" = "+affiche2(N));
}
console.log("--------------------------------------------------");
console.log("3 regimes : chiffres de tete connus | nombre de chiffres connu | tour 10^(10^...) quand meme ca deborde.");
console.log("le PC affiche n'importe quelle position de notre moteur sans jamais l'ecrire en entier.");
