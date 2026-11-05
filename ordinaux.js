








'use strict';
// QNE PLUS LOIN — "la limite atteinte est le socle de la prochaine".
// On ne CALCULE pas au-dela du Busy Beaver. On CLIMBE : chaque palier franchi
// demande une BIBLIOTHEQUE plus forte (un axiome, un oracle). Echelle des ordinaux.

const CAP=10n**100n;
function f(k,n){                       // hierarchie a croissance rapide, niveaux finis
 if(n>10000n)return -1n;               // garde-fou honnete : trop grand pour iterer
 if(k===0)return n+1n;
 let x=n;
 for(let i=0n;i<n;i++){x=f(k-1,x);if(x<0n)return -1n;if(x>CAP)return -2n;}
 return x;
}
const show=v=>v===-1n?'explose':(v===-2n?'> 10^100':v.toString());

console.log('============ QNE PLUS LOIN : L ESCALIER DES ORDINAUX ============');
console.log('');
console.log('I. L echelle FINIE (calculable), f_k = k-ieme vitesse :');
console.log('   f_1 = doubler | f_2 ~ n.2^n | f_3 ~ tetration');
for(const k of [1,2,3]){
 const row=[1,2,3,4].map(n=>show(f(k,BigInt(n))));
 console.log('   f_'+k+'(1..4) = '+row.join(', '));
}
console.log('');
console.log('II. LE PREMIER SAUT DE BIBLIOTHEQUE : f_omega = Ackermann.');
console.log('   On DIAGONALISE sur tous les niveaux finis d un coup. Forme exacte :');
console.log('   Ack(2,n)=2n+3 | Ack(3,n)=2^(n+3)-3 | Ack(4,n)=tour de tetration -3');
console.log('   Ack(4,0)=13 | Ack(4,1)=2^16-3='+(2n**16n-3n)+' | Ack(4,2)=2^65536-3 ('+(2n**65536n-3n).toString().length+' chiffres)');
console.log('');
console.log('III. L echelle TRANSFINIE (on ne calcule plus : on nomme, en apportant la bibliotheque) :');
const paliers=[
 ['omega',            'diagonale sur les niveaux finis',        'arithmetique ordinaire'],
 ['omega^omega',      'niveaux de niveaux',                     'recurrence multiple'],
 ['epsilon_0',        'limite de Peano (Goodstein, l hydre)',   'induction transfinie > epsilon_0'],
 ['Gamma_0',          'limite du predicatif (Feferman-Schutte)','analyse imprediative'],
 ['omega_1^CK',       'le 1er ordinal qu AUCUNE machine ne nomme','methodes non calculables'],
 ['au-dela',          'cardinaux, grands cardinaux',            'ZFC + nouveaux axiomes'],
];
for(const [ord,sens,biblio] of paliers)
 console.log('   '+ord.padEnd(12)+'| '+sens.padEnd(42)+'| bibliotheque : '+biblio);
console.log('');
console.log('IV. LE SOMMET HONNETE :');
console.log('   Oui : chaque limite atteinte est le socle de la suivante.');
console.log('   Mais on ne la franchit pas en calculant -- on la franchit en APPORTANT');
console.log('   une bibliotheque plus forte (axiome, oracle). Et par Godel, il n y a PAS');
console.log('   de derniere bibliotheque : au-dessus de chacune il en existe une plus haute.');
console.log('   Le seul vrai horizon : omega_1^CK, ou meme la PROCHAINE bibliotheque');
console.log('   cesse d etre ecrivable. Le langage plie -- un etage plus haut qu avant.');
console.log('================================================================');
