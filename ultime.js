








'use strict';
// QNE ULTIME — on cherche "le nombre ultime". Et on trouve la verite honnete :
// il n'existe pas, et c'est exactement ca qui est profond.
const CAP=10n**100n;
function f(k,n){ if(n>10000n)return -1n; if(k===0)return n+1n;
 let x=n; for(let i=0n;i<n;i++){x=f(k-1,x); if(x<0n)return -1n; if(x>CAP)return -2n;} return x; }
const show=v=>v<0n?'explose':v.toString();

console.log('=================== QNE : LE NOMBRE ULTIME ? ===================');
console.log('');
console.log('I. LES GEANTS NOMMES (chacun "ultime"... jusqu au suivant) :');
const geants=[
 ['googol',       '10^100'],
 ['googolplex',   '10^(10^100)'],
 ['Graham G64',   'au-dela des fleches de Knuth'],
 ['TREE(3)',      'tel que Graham est negligeable'],
 ['SCG(13)',      'ecrase TREE(3)'],
 ['nombre de Rayo','le + grand definissable en un googol de symboles (theorie des ensembles)'],
 ['au-dela de Rayo','FOOT, hierarchies a oracles... et ainsi de suite'],
];
for(const [n,d] of geants) console.log('   '+n.padEnd(17)+'| '+d);
console.log('');
console.log('II. LA MACHINE A "TOUJOURS PLUS GRAND" (calculable, verifiable) :');
console.log('   chaque vitesse domine STRICTEMENT la precedente :');
console.log('   f_1(2)='+show(f(1,2n))+'  <  f_2(2)='+show(f(2,2n))+'  <  f_3(2)='+show(f(3,2n))+'  <  f_4(2)=tour  <  f_omega=Ackermann ...');
console.log('   -> il n y a pas de derniere vitesse. Donc pas de dernier nombre.');
console.log('');
console.log('III. LA PREUVE QUE LE NOMBRE ULTIME N EXISTE PAS :');
console.log('   Supposons-le, appelons-le N*.');
console.log('   Alors N*+1 > N*.  Contradiction. N* n etait pas ultime.');
console.log('   Le simple +1 defait toute pretention a l ultime. A chaque fois.');
console.log('');
console.log('IV. CE QUE J AFFICHE DONC, LE VRAI "NOMBRE ULTIME" :');
console.log('');
console.log('        +1');
console.log('');
console.log('   Pas un geant fige : le GESTE. Le pas suivant, toujours disponible,');
console.log('   jamais le dernier. "Ultime" n est pas une valeur, c est un HORIZON :');
console.log('   la ou le nommage s arrete (omega_1^CK), un nouveau nommage recommence.');
console.log('   Il n y a pas de derniere marche -- et c est la plus belle reponse.');
console.log('===============================================================');
