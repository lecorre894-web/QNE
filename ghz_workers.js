








'use strict';
// QNE GHZ WORKERS — on "adjoint des GHz" aux workers zetta, honnetement :
//  - frequence REELLE  = nb de workers-formule evalues par seconde (le silicium)
//  - debit EQUIVALENT  = nb de cellules que l'algebre absorbe par seconde (ce que la force brute devrait faire)
//  - et le GHz qu'il FAUDRAIT a la force brute pour egaler : impossible, c'est tout le point.
const R=require('./qne_v15/lib/reconstruct.js');
const {mul,pow,geometrical,gf128,hex}=R;
const g=2n;
function worker(seed,L,W,k){if(k>=L)return 0n;const c=(L-1n-k)/W+1n;return mul(mul(seed,pow(g,k)),geometrical(pow(g,W),c).s);}

const seed=BigInt('0x0123456789abcdeffedcba9876543210');
const L=(10n**40n)/16n;              // 10^40 octets
const Wz=10n**21n;                    // zetta workers
const cellsPerWorker=L/Wz;           // ~6.25e17 cellules repliees par worker

const fmt=x=>{const e=Math.log10(x);const u=[[30,'Q'],[27,'R'],[24,'Y'],[21,'Z'],[18,'E'],[15,'P'],[12,'T'],[9,'G'],[6,'M'],[3,'k']];for(const [p,s] of u)if(e>=p)return (x/10**p).toFixed(2)+' '+s;return x.toFixed(2)+' ';};
const years=s=>s/(3600*24*365.25);

console.log('============ QNE : DES GHZ POUR LES WORKERS ZETTA ============');
console.log('region 10^40 o | '+Wz+' workers | chaque worker replie '+cellsPerWorker+' cellules');
console.log('');

const M=1000;
const t=process.hrtime.bigint();
let acc=0n;for(let k=0n;k<BigInt(M);k++)acc^=worker(seed,L,Wz,k);
const sec=Number(process.hrtime.bigint()-t)/1e9;

const realRate=M/sec;
const cellsFolded=BigInt(M)*cellsPerWorker;
const equivRate=Number(cellsFolded)/sec;

console.log('MESURE sur '+M+' workers zetta, en '+sec.toFixed(3)+' s :');
console.log('  frequence REELLE (silicium)     : '+fmt(realRate)+'Hz de workers   ('+realRate.toFixed(0)+' workers/s)');
console.log('  debit EQUIVALENT (algebre)      : '+fmt(equivRate)+'cellules/s   = autant de XOR/s qu il faudrait en brute');
console.log('  -> ton CPU tourne a ~5 GHz = 5.00 G cycles/s ; l algebre, elle, ABSORBE '+fmt(equivRate)+'operations/s.');
console.log('');

const bruteOneWorker=years(Number(cellsPerWorker)/1e9);
const bruteRegion=years(Number(L)/1e9);
console.log('CE QU IL FAUDRAIT A LA FORCE BRUTE (1 coeur a 1 GHz = 1e9 cellules/s) :');
console.log('  1 seul worker ('+cellsPerWorker+' cellules) : '+bruteOneWorker.toExponential(2)+' ANNEES   (formule : ~'+(sec/M*1000).toFixed(2)+' ms)');
console.log('  toute la region 10^40 o         : '+bruteRegion.toExponential(2)+' annees   (age de l univers ~ 1.4e10 ans)');
console.log('');
console.log('Honnete : tu n adjoins pas des GHz au silicium -- il reste a 5 GHz. Tu adjoins un DEBIT');
console.log('EQUIVALENT astronomique, parce que chaque worker saute l enumeration. Le "GHz" vit dans');
console.log('le travail EVITE, pas dans la cadence de l horloge. XOR de controle : '+hex(acc));
console.log('==============================================================');
