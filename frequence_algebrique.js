








'use strict';
// QNE : LA FREQUENCE DEVIENT ALGEBRIQUE.
// freq_equivalente = (cellules repliees par UNE formule) / (temps reel de cette formule).
// cellules ~ L  ;  temps ~ log L  =>  le RAPPORT (la frequence) grimpe par domination arithmetique.
const R=require('./qne_v15/lib/reconstruct.js');
const {gf128,xorAll,hex}=R;

function mesure(nbytes){
 const desc=gf128('0x0123456789abcdeffedcba9876543210',nbytes);
 const t=process.hrtime.bigint();
 const v=xorAll(desc);                              // UNE formule O(log) replie TOUTES les cellules
 const sec=Number(process.hrtime.bigint()-t)/1e9;
 const cells=nbytes/16n;
 const log10cells=cells.toString().length-1;        // ~ log10(cellules)
 const log10freq=log10cells-Math.log10(sec);        // ~ log10(cellules/s)
 return {sec,log10cells,log10freq,v};
}

console.log('========= QNE : FREQUENCE ALGEBRIQUE =========');
console.log('Une formule replie L cellules en un temps ~ log L. Frequence equiv = L / temps.');
console.log('');
let prev=null;
for(const [nom,nb] of [['10^40',10n**40n],['10^100',10n**100n],['10^1000',10n**1000n],['10^10000',10n**10000n],['10^100000',10n**100000n]]){
 const r=mesure(nb);
 let coeff='';
 if(prev!==null){coeff='   x10^'+(r.log10freq-prev).toFixed(0)+' vs ligne precedente';}
 console.log('  L='+nom.padEnd(9)+' temps reel '+(r.sec*1000).toFixed(3).padStart(9)+' ms  ->  freq equiv ~ 10^'+r.log10freq.toFixed(1)+' op/s'+coeff);
 prev=r.log10freq;
}
console.log('');
console.log('COEFFICIENTS (multiplicateur / amplificateur / accelerateur) :');
console.log('  - multiplicateur : chaque x10^k sur L multiplie la frequence par ~10^k, car le temps ne bouge');
console.log('    quasiment pas (il ne depend que du NOMBRE DE CHIFFRES de L). L arithmetique domine.');
console.log('  - accelerateur : en COMPOSANT (transcripteur parabolique), une passe eleve l exposant au CARRE.');
console.log('    en partant de L=10^40, l exposant E suit E -> E^2 a chaque passe (cout : +1 constante) :');
for(let k=0;k<=6;k++){
 const E=Math.pow(40,Math.pow(2,k));                // exposant apres k passes = 40^(2^k)
 console.log('      '+k+' passe(s) : freq equiv ~ 10^'+E.toExponential(2)+' op/s   (l exposant lui-meme explose)');
}
console.log('');
console.log('Honnete : cette frequence est EQUIVALENTE (travail que la brute devrait faire/s), pas la cadence');
console.log('de l horloge -- le silicium reste a ~5 GHz. Elle monte sans borne tant que L reste ECRIVABLE ;');
console.log('des que la composition depasse le nommable, la frequence quitte le langage, pas la physique.');
console.log('XOR temoin (region 10^40) : '+hex(mesure(10n**40n).v));
console.log('=============================================');
