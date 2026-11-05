








'use strict';
// QNE INJECTION — on OUVRE la boucle : une permutation (LFSR) + un NOUVEAU CANAL D'ENTREE.
// Sans entree : boucle FERMEE (periodique, bornee). Avec entree : machine OUVERTE qui
// absorbe l'information et en depend (avalanche). C'est le coeur mixeur de la crypto QNE.
const N=16, FULL=(1<<N)-1, TAPS=[16,15,13,4];        // polynome 16 bits maximal connu
const MASK=TAPS.reduce((m,t)=>m|(1<<(t-1)),0);
const fb=s=>{let x=s&MASK,p=0;while(x){p^=x&1;x>>=1;}return p;};
const step=(s,inp)=>(((s<<1)|((fb(s)^(inp&1))&1))&FULL);
const pop=x=>{let c=0;while(x){c+=x&1;x>>=1;}return c;};

console.log('=============== QNE INJECTION (la boucle qui s ouvre) ===============');
console.log('');
let s=1,seed=1,steps=0;
do{ s=step(s,0); steps++; }while(s!==seed && steps<=FULL+1);
console.log('A. PERMUTATION SEULE (canal d entree = 0) :');
console.log('   part de '+seed+', revient a '+seed+' apres '+steps+' pas -> BOUCLE FERMEE, bornee ('+steps+' etats, pas un de plus)');
console.log('');
function absorb(bits){ let st=seed; for(const b of bits) st=step(st,b); return st; }
const msg='RENE-QNE';
const bits=[]; for(const ch of msg) for(let i=7;i>=0;i--) bits.push((ch.charCodeAt(0)>>i)&1);
const d0=absorb(bits);
console.log('B. PERMUTATION + CANAL D ENTREE (on injecte les bits de "'+msg+'") :');
console.log('   etat final (digest) = 0x'+d0.toString(16).padStart(4,'0')+'  -> depend de TOUTE l entree');
let tot=0; for(let i=0;i<bits.length;i++){ const b2=bits.slice(); b2[i]^=1; tot+=pop(absorb(b2)^d0); }
console.log('   avalanche : 1 bit d entree change -> '+(tot/bits.length).toFixed(2)+' bits d etat changent en moyenne (ideal ~'+(N/2)+')');
console.log('   -> la machine EXPLORE et SE SOUVIENT : elle n est plus fermee, elle absorbe.');
console.log('');
console.log('C. HONNETE : le canal d entree ouvre la boucle -- c est la vraie amelioration.');
console.log('   L etat devient fonction de tout ce qu on injecte (coeur mixeur d un chiffrement/');
console.log('   hash : LFSR + entree). Mais l information est CONSERVEE : sortie <= entree.');
console.log('   On grandit en INGERANT du neuf, pas en creant du rien. Pas d infini gratuit --');
console.log('   une machine ouverte, fidele, qui se souvient. Voila le gain reel.');
console.log('====================================================================');
