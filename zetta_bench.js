








'use strict';
// QNE ZETTA BENCH — on met la formule-worker a l'epreuve a TOUTE echelle.
// 3 tests : (1) le temps suit log(W), (2) une partition complete reconstitue le global
// a grande echelle enumerable, (3) coherence algebrique au niveau zetta SANS force brute.
const R=require('./qne_v15/lib/reconstruct.js');
const {mul,pow,geometrical,gf128,xorAll,hex}=R;
const g=2n;
function worker(seed,L,W,k){if(k>=L)return 0n;const count=(L-1n-k)/W+1n;
 return mul(mul(seed,pow(g,k)),geometrical(pow(g,W),count).s);}

const seed=BigInt('0x0123456789abcdeffedcba9876543210');
const L=(10n**40n)/16n;
const global=xorAll(gf128('0x0123456789abcdeffedcba9876543210',10n**40n));

console.log('============ QNE ZETTA BENCH ============');
console.log('region : 10^40 octets | XOR global de reference = '+hex(global));
console.log('');
console.log('1. TEMPS d un worker quand W explose (croit comme log W = nb de chiffres, pas comme W).');
console.log('   NB : des que W depasse ~6e38 cellules, chaque worker ne tient qu UNE cellule (seed*g^7),');
console.log('   donc la VALEUR se stabilise mais le TEMPS continue de suivre log W -- c est lui qu on mesure :');
for(const [nom,W] of [['10^21 (zetta)',10n**21n],['10^24 (yotta)',10n**24n],['10^30',10n**30n],['10^60',10n**60n],['10^100 (googol)',10n**100n],['10^300',10n**300n]]){
 const t=process.hrtime.bigint();const v=worker(seed,L,W,7n);const us=Number(process.hrtime.bigint()-t)/1e3;
 console.log('   W='+nom.padEnd(16)+' worker#7 = '+hex(v)+'  en '+us.toFixed(1)+' us');
}
console.log('');
console.log('2. PARTITION COMPLETE == global, a grande echelle enumerable (preuve forte) :');
for(const W of [100n,1000n,10000n]){
 const t=process.hrtime.bigint();
 const G=pow(g,W);let acc=0n,gk=1n;
 for(let k=0n;k<W;k++){const count=(L-1n-k)/W+1n;acc^=mul(mul(seed,gk),geometrical(G,count).s);gk=mul(gk,g);}
 const ms=Number(process.hrtime.bigint()-t)/1e6;
 console.log('   W='+String(W).padStart(8)+' : XOR des '+W+' workers = '+(acc===global?'== global OK':'DIVERGE')+'  ('+ms.toFixed(0)+' ms)');
}
console.log('');
console.log('3. COHERENCE ALGEBRIQUE au niveau ZETTA, sans force brute :');
console.log('   on coupe un worker en deux sous-workers (pair/impair) et on verifie enfant0 XOR enfant1 == parent :');
const Wz=10n**21n;
for(const k of [0n,7n,10n**20n,Wz-1n]){
 const parent=worker(seed,L,Wz,k);
 const e0=worker(seed,L,2n*Wz,k),e1=worker(seed,L,2n*Wz,k+Wz);
 console.log('   parent#'+String(k).padEnd(22)+' == enfants ? '+((e0^e1)===parent?'OUI (exact)':'NON'));
}
console.log('========================================');
