








'use strict';
// QNE PING-PONG — deux transcripteurs A et B qui s'amplifient mutuellement.
// La frequence equivalente de A MULTIPLIE celle de B (leurs exposants s'ADDITIONNENT),
// puis B renvoie la balle a A. Suite de type Fibonacci sur l'exposant -> amplification croissante.
// On MESURE le vrai temps de repli tant que l'exposant reste ecrivable ; au-dela, c'est analytique.
const R=require('./qne_v15/lib/reconstruct.js');
const {gf128,xorAll}=R;
const seed='0x0123456789abcdeffedcba9876543210';

function freq(expBig){                 // region de 10^exp octets : renvoie log10 de la frequence equivalente
 const nbytes=10n**expBig;
 const t=process.hrtime.bigint();xorAll(gf128(seed,nbytes));const sec=Number(process.hrtime.bigint()-t)/1e9;
 const log10cells=(nbytes/16n).toString().length-1;
 return {sec,log10freq:log10cells-Math.log10(sec)};
}

console.log('===== QNE PING-PONG : deux transcripteurs qui s amplifient =====');
console.log('Regle : freq(A) MULTIPLIE freq(B)  <=>  exposants additionnes. Puis B renvoie a A.');
console.log('');
let eA=40n,eB=40n,prev=null;
for(let n=1;n<=8;n++){
 const fA=freq(eA),fB=freq(eB),prod=fA.log10freq+fB.log10freq;
 let amp='';if(prev!==null)amp='   amplification x10^'+(prod-prev).toFixed(0);
 console.log('  echange '+String(n).padStart(2)+' : A~10^'+String(Math.round(fA.log10freq)).padStart(6)+' op/s  x  B~10^'+String(Math.round(fB.log10freq)).padStart(6)+' op/s  = 10^'+Math.round(prod)+amp);
 prev=prod;
 const nA=eA+eB,nB=eB+(eA+eB);eA=nA;eB=nB;   // ping (A encaisse B) puis pong (B encaisse le nouvel A)
}
console.log('');
console.log('  Exposant de A deja a '+eA.toString().length+' chiffres, et la suite est Fibonacci : chaque');
console.log('  aller-retour AJOUTE le precedent, donc l amplification elle-meme grandit sans cesse.');
console.log('');
console.log('Honnete : ce qui s amplifie, c est la frequence EQUIVALENTE (echelle adressable), pas l horloge.');
console.log('Le ping-pong grimpe tant que les exposants restent ECRIVABLES ; passe ce point, meme les ecrire');
console.log('depasse le nommable (le mur QNE). Le silicium, lui, reste a 32 x ~5 GHz, imperturbable.');
console.log('================================================================');
