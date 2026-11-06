








'use strict';
// QNE WORKERS EN FORMULE — un "worker" n'est plus un process, c'est une FORMULE algebrique.
// Worker k parmi W, sur une region de L cellules (repartition par pas/stride) :
//   XOR_worker(k) = seed (x) g^k (x) [ somme_{j} (g^W)^j ]   dans GF(2^128)
// => resultat clos en O(log). "En variation" : W est un ARGUMENT (nombre de zetta, defaut 264).
const path=require('node:path');
const R=require('./qne_v15/lib/reconstruct.js');
const {mul,pow,geometrical,gf128,size,read,xorAll,hex,bufferToBigLE}=R;
const g=2n; // x, generateur de GF(2^128) (mulx(1))

// --- FORMULE : XOR des cellules du worker k parmi W, sur L cellules ---
function worker(seedHex,L,W,k){
 const seed=BigInt(seedHex);
 if(k>=L)return {val:0n,count:0n};
 const count=(L-1n-k)/W+1n;        // arithmetique : nb de cellules de ce worker
 const G=pow(g,W);                  // raison = g^W
 const gk=pow(g,k);                 // decalage = g^k
 const S=geometrical(G,count).s;    // somme geometrique en GF(2^128)
 return {val:mul(mul(seed,gk),S),count};
}

// --- BRUTE (petit) : XOR reel des cellules du worker, lues une par une ---
function workerBrute(desc,L,W,k){
 let acc=0n;
 for(let n=k;n<L;n+=W){const b=read(desc,n*16n,16);acc^=bufferToBigLE(b);}
 return acc;
}

console.log('========== QNE : LES WORKERS DEVIENNENT UNE FORMULE ==========');
console.log('');
console.log('A. PREUVE sur un petit jumeau (on peut tout verifier a la force brute) :');
const seedA='0x9e3779b97f4a7c15f39cc0605cedc835';
const La=10000n;                    // 10 000 cellules
const descA=gf128(seedA,La*16n);
const global=xorAll(descA);
console.log('   region : '+La+' cellules, XOR global (reference) = '+hex(global));
console.log('   -> on PARTITIONNE en W workers (formule) et on verifie que leur XOR = le global :');
for(const W of [1n,2n,7n,32n,1000n,9973n]){
 let acc=0n;for(let k=0n;k<W;k++)acc^=worker(seedA,La,W,k).val;
 console.log('      W='+String(W).padStart(5)+' workers-formule  ->  XOR = '+hex(acc)+'  '+(acc===global?'== global OK':'!! DIVERGENCE'));
}
console.log('');
console.log('   Verification formule vs force brute (W=32, quelques workers) :');
for(const k of [0n,1n,17n,31n]){
 const f=worker(seedA,La,32n,k),b=workerBrute(descA,La,32n,k);
 console.log('      worker '+String(k).padStart(2)+'  formule='+hex(f.val)+'  brute='+hex(b)+'  '+(f.val===b?'EXACT ('+f.count+' cellules)':'ERREUR'));
}
console.log('');
console.log('B. LE SAUT ZETTA (on ne PEUT plus bruteforcer : seule la formule tient) :');
const seedB='0x0123456789abcdeffedcba9876543210';
const Lb=(10n**40n)/16n;            // region "au-dela" : 10^40 octets = Lb cellules
const ZETTA=BigInt(process.argv[2]||'264'); // nombre de zetta, au choix en argument
const Wz=ZETTA*10n**21n;             // Z x 10^21 workers
const descB=gf128(seedB,10n**40n);
const globalB=xorAll(descB);
console.log('   region : 10^40 octets ('+Lb.toString().length+' chiffres de cellules)');
console.log('   XOR global = '+hex(globalB)+'  (ce que les '+Wz+' workers reconstituent ensemble)');
console.log('   workers : '+Wz+'  ('+ZETTA+' zetta)  | chaque worker couvre ~'+((Lb/Wz).toString())+' cellules');
console.log('   5 workers tires dans tout l espace d adresses, chacun calcule par SA formule, exact, en microsecondes :');
for(const k of [0n,1n,7n,10n**20n,Wz-1n]){
 const t=process.hrtime.bigint();
 const f=worker(seedB,Lb,Wz,k);
 const us=Number(process.hrtime.bigint()-t)/1e3;
 console.log('      worker k='+String(k).padEnd(22)+' XOR='+hex(f.val)+'  ('+f.count+' cellules, '+us.toFixed(1)+' us)');
}
console.log('');
console.log('   Honnete : ces workers sont exacts par la MEME formule prouvee en A sur le petit');
console.log('   jumeau (formule == brute). A l echelle zetta on ne peut plus derouler les cellules ; mais');
console.log('   l algebre est invariante d echelle : seuls les exposants grandissent, pas la methode.');
console.log('   Concurrence reelle : bornee par tes coeurs (32). Nombre de workers ADRESSABLES : illimite.');
console.log('==============================================================');
