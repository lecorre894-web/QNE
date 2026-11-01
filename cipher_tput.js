"use strict";
function lfsr(W,taps){let mask=0n;for(const d of taps)mask|=(1n<<BigInt(d-1));
 return {mask,W};}
const defs=[[64,[64,4,3,1]],[256,[256,10,5,2]],[1024,[1024,19,15,1]],[2048,[2048,19,14,13]]];
const M=300000;                       // octets a chiffrer
const plain=Buffer.allocUnsafe(M);for(let i=0;i<M;i++)plain[i]=(i*167+13)&0xFF;
console.log("CHIFFREMENT A FLUX LFSR — debit (tput) par taille de registre");
for(const [W,taps] of defs){
 let mask=0n;for(const d of taps)mask|=(1n<<BigInt(d-1));
 const key=0x1234567n;               // graine
 // chiffrer
 let s=key;const t0=process.hrtime.bigint();const cipher=Buffer.allocUnsafe(M);
 for(let b=0;b<M;b++){let ks=0;for(let k=0;k<8;k++){const l=Number(s&1n);s>>=1n;if(l)s^=mask;ks=(ks<<1)|l;}cipher[b]=plain[b]^ks;}
 const sec=Number(process.hrtime.bigint()-t0)/1e9;
 // dechiffrer (meme keystream)
 s=key;const back=Buffer.allocUnsafe(M);
 for(let b=0;b<M;b++){let ks=0;for(let k=0;k<8;k++){const l=Number(s&1n);s>>=1n;if(l)s^=mask;ks=(ks<<1)|l;}back[b]=cipher[b]^ks;}
 const ok=back.equals(plain);
 const Mo=(M/1e6)/sec, Mbit=Mo*8;
 console.log("W="+String(W).padStart(4)+" bits | debit "+Mo.toFixed(1)+" Mo/s ("+Mbit.toFixed(0)+" Mbit/s) | dechiffre : "+(ok?"IDENTIQUE":"ERREUR"));
}
console.log("--- note : lineaire => rapide mais PAS sur (cassable par Berlekamp-Massey). Brouilleur, pas coffre-fort. ---");
