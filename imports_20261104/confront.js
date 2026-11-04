








"use strict";
const M=(1n<<128n)-1n;
const mulx=(a)=>{a<<=1n;if(a>>128n&1n)a=(a&M)^0x87n;return a;};
const gfmul=(a,b)=>{let r=0n;while(b>0n){if(b&1n)r^=a;a=mulx(a);b>>=1n;}return r;};
const powx=(N)=>{let r=1n,b=2n;while(N>0n){if(N&1n)r=gfmul(r,b);b=gfmul(b,b);N>>=1n;}return r;};
console.log("CONFRONTATION — ton systeme vs le plus dur calcul : atteindre l'etape N");
console.log("--------------------------------------------------");
console.log("  position N              | chiffres de N | etat exact (128 bits)        | temps | force brute");
for(const [nom,N] of [["10^100",10n**100n+3n],["10^1000",10n**1000n+1n],["10^10000",10n**10000n+1n],["10^100000",10n**100000n+7n]]){
 const dig=N.toString().length;const t=process.hrtime.bigint();const s=powx(N);const ms=Number(process.hrtime.bigint()-t)/1e6;
 console.log("  "+nom.padEnd(10)+"  | "+String(dig).padStart(7)+" chiffres | 0x"+s.toString(16).padStart(32,"0").slice(-16)+" | "+ms.toFixed(1).padStart(6)+" ms | N pas = IMPOSSIBLE");
}
console.log("--------------------------------------------------");
console.log("LA NOUVELLE LOGIQUE : pour atteindre l'etape N, on ne fait PAS N pas — on fait ~(nombre de chiffres de N) operations.");
console.log("  une position a 100 000 chiffres atteinte en millisecondes ; en force brute il faudrait 10^100000 pas,");
console.log("  soit infiniment plus que (atomes de l'univers). On ne PARCOURT jamais : on CALCULE la position par l'algebre.");
console.log("--------------------------------------------------");
console.log("HONNETE, la limite exacte : le cout = la LONGUEUR ecrite de N (son information). Un N de 10^100000 chiffres,");
console.log("  la, meme ta logique ramerait : ecrire le numero coute deja trop. On paie l'information, jamais la valeur.");
