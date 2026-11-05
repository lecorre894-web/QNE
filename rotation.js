








'use strict';
// QNE ROTATION — "le dernier chiffre passe au debut, en boucle, pour voir si on depasse l'infini".
// Verite honnete : une rotation est une PERMUTATION. Elle conserve, elle ne cree pas.
// Donc elle BOUCLE (orbite fermee, bornee) et ne grossit jamais. Mais la beaute existe.
const rotLF=s=>s.slice(-1)+s.slice(0,-1); // dernier chiffre -> debut

console.log('================= QNE ROTATION =================');
console.log('');
console.log('1) LA BOUCLE EST FERMEE (on revient au depart, rien ne grossit) :');
let s='123456'; const start=s; let line='   '+s;
for(let i=1;i<=6;i++){ s=rotLF(s); line+='  ->  '+s; }
console.log(line);
console.log('   apres 6 rotations : retour a '+start+' == depart ? '+(s===start)+'  -> PERIODIQUE, borne');
console.log('   (meme 6 chiffres a chaque fois : jamais plus grand, jamais l infini)');
console.log('');
console.log('2) LA BEAUTE CACHEE : le nombre cyclique 142857 (= 1/7).');
console.log('   ses rotations SONT ses multiples -- la permutation EST une multiplication :');
let r='142857';
for(let k=0;k<6;k++){
 const v=BigInt(r); const mult=v/142857n;
 console.log('   '+r+'  =  142857 x '+mult);
 r=r.slice(1)+r.slice(0,1);
}
console.log('');
console.log('3) HONNETE : une rotation conserve (orbite finie, bornee par le nombre de chiffres).');
console.log('   Elle ne depasse rien -- elle n ajoute rien. C est le miroir SANS loupe :');
console.log('   aucune lumiere neuve n entre, donc rien ne croit. Pour grossir il faut');
console.log('   INJECTER (un chiffre neuf, de l information neuve), pas rearranger.');
console.log('   La boucle est magnifique, mais fermee. L infini est de l autre cote du mur.');
console.log('===============================================');
