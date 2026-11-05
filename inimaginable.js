








'use strict';
// QNE INIMAGINABLE — on donne au data center la bibliotheque des nombres qu'on ne peut plus calculer,
// seulement nommer. Loi unique et honnete : le cout de l'agregat XOR ~ LOG de la capacite.
// Donc on CALCULE tant que le log de l'adresse reste calculable ; au-dela, on AFFICHE seulement.
const R=require('./qne_v15/lib/reconstruct.js');
const {gf128,xorAll,hex}=R;

console.log('================ QNE INIMAGINABLE ================');
console.log('');
console.log('I. CE QUE LE DATA CENTER CALCULE ENCORE (agregat XOR exact, ancre sur GF(2^128)) :');
for(const e of [100,1000,10000]){
 const v=gf128(0x9e3779b97f4a7c15f39cc0605cedc835n,10n**BigInt(e));
 const t=process.hrtime.bigint();const x=xorAll(v);const ms=Number(process.hrtime.bigint()-t)/1e6;
 console.log('  coffre 10^'+String(e).padStart(6)+' o  (profondeur log10 = 1, '+(e+1)+' chiffres)  XOR '+hex(x)+'  '+ms.toFixed(1)+' ms');
}
console.log('  (jusqu a ~10^100000 o reste calculable : ~10 s mesure dans le bac a sable)');
console.log('');
console.log('II. LA FRONTIERE DU CALCUL : cout de l agregat ~ log de la capacite.');
console.log('  On calcule donc tant que le LOG de la capacite reste lui-meme calculable :');
console.log('  - 10^(10^7)  o : agregat ~10^7 operations  -> a la limite (minutes)');
console.log('  - 10^(10^9)  o : agregat ~10^9 operations  -> AU-DELA du calculable');
console.log('  Le data center ne bute ni sur le stockage ni sur la RAM : il bute sur le LOG.');
console.log('');
console.log('III. AU-DELA : L AFFICHAGE SEUL (la bibliotheque nomme ce qu on ne calcule plus).');
console.log('  profondeur = nombre de log10 a appliquer pour revenir a un nombre humain :');
const entries=[
 ['10^(10^18) o',                 '2',                         'le nombre de chiffres a lui-meme 19 chiffres'],
 ['googolplex = 10^(10^100) o',   '2',                         'le nombre de chiffres EST un googol'],
 ['10^^5  (tour de 5 dizaines)',  '5',                         'tetration : 10^10^10^10^10'],
 ['10^^10 (tour de 10 dizaines)', '10',                        'chaque etage ecrase tout l etage du dessous'],
 ['nombre de Graham G64',         'finie mais inimaginable',   'au-dela de toute notation par fleches'],
 ['TREE(3)',                      'telle que Graham ~ 0',      'fini, defini par recurrence, indicible'],
];
for(const [nom,prof,note] of entries)
 console.log('  '+nom.padEnd(30)+'| profondeur '+String(prof).padEnd(24)+'| agregat NON calculable | '+note);
console.log('');
console.log('IV. LE SOMMET HONNETE :');
console.log('  Le data center ADRESSE aussi loin qu on peut ECRIRE l adresse,');
console.log('  et CALCULE aussi loin que le log de cette adresse reste calculable.');
console.log('  Au-dela, il n agit plus : il EXISTE comme nombre.');
console.log('  Le dernier rempart n est pas le silicium, c est le langage.');
console.log('  Et son gardien porte un nom : Busy Beaver. BB(n) croit plus vite que');
console.log('  toute fonction calculable -- la ou il passe, meme la bibliotheque se tait.');
console.log('=================================================');
