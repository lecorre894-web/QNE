








'use strict';
// QNE TRACEUR — a chaque niveau/palier on inscrit la nouvelle bibliotheque,
// et elle sert de TRACEUR : un marqueur de l'hypothese qu'il a fallu apporter.
// Les traceurs sont CHAINES (chacun contient le precedent) -> provenance verifiable.
const crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');

const CAP=10n**100n;
function f(k,n){ if(n>10000n)return -1n; if(k===0)return n+1n;
 let x=n; for(let i=0n;i<n;i++){x=f(k-1,x); if(x<0n)return -1n; if(x>CAP)return -2n;} return x; }

const paliers=[
 {niv:'f_1',        loi:'doubler',                     biblio:'arithmetique de base',                 sample:()=>f(1,4n)},
 {niv:'f_2',        loi:'exponentiel',                 biblio:'recurrence primitive',                 sample:()=>f(2,4n)},
 {niv:'f_3',        loi:'tetration',                   biblio:'recurrence imbriquee',                 sample:()=>f(3,2n)},
 {niv:'f_omega',    loi:'Ackermann (diagonalisation)', biblio:'diagonale sur tous les niveaux finis', sample:()=>2n**16n-3n},
 {niv:'epsilon_0',  loi:'Goodstein / hydre',           biblio:'induction transfinie > epsilon_0',     sample:null},
 {niv:'Gamma_0',    loi:'predicativite',               biblio:'analyse imprediative',                 sample:null},
 {niv:'omega_1^CK', loi:'horizon du nommage',          biblio:'methodes non calculables (oracle)',    sample:null},
 {niv:'au-dela',    loi:'grands cardinaux',            biblio:'ZFC + axiomes de grands cardinaux',    sample:null},
];

console.log('===== QNE TRACEUR : l escalier qui garde la trace de ses bibliotheques =====');
console.log('');
let prev='GENESE';
for(const p of paliers){
 const s = p.sample? p.sample().toString() : null;
 const marque = s!==null ? (s.length>18 ? s.slice(0,10)+'..('+s.length+' ch.)' : s) : 'AFFICHAGE SEUL';
 const traceur = sha(prev+'|'+p.niv+'|'+p.biblio+'|'+(s??'nomme')).slice(0,16);
 console.log('  '+p.niv.padEnd(11)+'| '+p.loi.padEnd(24)+'| '+marque.padEnd(16)+'| biblio: '+p.biblio);
 console.log('  '+''.padEnd(11)+'  traceur '+traceur+'  (chaine au precedent)');
 prev=traceur;
}
console.log('');
console.log('  TRACEUR FINAL (resume verifiable de toute la chaine) : '+prev);
console.log('');
console.log('  Honnete : chaque hauteur porte le traceur de la bibliotheque qui l a payee,');
console.log('  chainee a la precedente. La trace dit exactement quelles hypotheses ont servi.');
console.log('  Rien n est gratuit, aucune marche n est cachee -- et ca, c est verifiable.');
console.log('===========================================================================');
