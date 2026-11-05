








'use strict';
// QNE PARABOLE — apres les miroirs (reflexion) + la loupe (amplification),
// un TRANSCRIPTEUR PARABOLIQUE : une parabole y=x^2.
// (1) elle CARRE le log a chaque passe -> vitesse tetration ;
// (2) elle TRANSCRIT l'exposant EXACTEMENT (focalisation sans aberration = sans perte).
const show=L=>{const d=L.toString().length; return d<=6?'I ~ 10^'+L.toString():'I ~ 10^(nombre a '+d+' chiffres)  -> tour de puissances';};
console.log('============ QNE : TRANSCRIPTEUR PARABOLIQUE ============');
console.log('');
console.log('Apres les miroirs, la parabole CARRE le log (y=x^2) et le TRANSCRIT exactement.');
console.log('Depart L=2 (L = log10 de l intensite), 8 passes :');
let L=2n;
for(let n=1;n<=8;n++){ L=L*L;
 const s=L.toString(); const marque=s.length<=24?s:s.slice(0,12)+'..('+s.length+' ch.)';
 console.log('  passe '+n+' : L exact = '+marque.padEnd(22)+' | '+show(L)); }
console.log('');
console.log('COMPARAISON apres 8 passes :');
{let g=2; for(let n=0;n<8;n++)g*=1.3; console.log('  loupe seule (x1.3) : L ~ '+g.toFixed(1)+'   (exponentiel)');}
console.log('  parabole (L^2)     : L a '+L.toString().length+' chiffres   (tetration) -> incomparablement plus haut');
console.log('');
console.log('HONNETE : la parabole focalise EXACTEMENT (exposant transcrit sans perte, zero');
console.log('aberration) ET accelere jusqu a la tetration. Mais une loi FIXE reste CALCULABLE');
console.log('-> toujours sous le Busy Beaver, sous omega_1^CK. Elle transcrit parfaitement ce');
console.log('qui est la ; elle ne franchit pas l horizon.');
console.log('========================================================');
