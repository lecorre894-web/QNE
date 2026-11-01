"use strict";
// Banque de B generateurs lineaires par mots (xorshift128, 128 bits d'etat chacun).
// Chacun sort 32 bits/pas -> B mots = 4B octets par tour. Max de mots = max debit.
function makeBank(B){const st=new Uint32Array(B*4);
 for(let i=0;i<B*4;i++)st[i]=(0x9E3779B1^(i*2654435761))>>>0||1;
 return st;}
function encrypt(buf,st,B){const M=buf.length,out=Buffer.allocUnsafe(M);let p=0;
 while(p<M){
  for(let b=0;b<B && p<M;b++){const o=b*4;
   let x=st[o],y=st[o+1],z=st[o+2],w=st[o+3];
   const t=(x^(x<<11))>>>0; x=y;y=z;z=w;
   w=((w^(w>>>19))^(t^(t>>>8)))>>>0;
   st[o]=x;st[o+1]=y;st[o+2]=z;st[o+3]=w;
   // 4 octets du mot w
   out[p]=(buf[p]^(w&0xFF));if(++p>=M)break;
   out[p]=(buf[p]^((w>>>8)&0xFF));if(++p>=M)break;
   out[p]=(buf[p]^((w>>>16)&0xFF));if(++p>=M)break;
   out[p]=(buf[p]^((w>>>24)&0xFF));if(++p>=M)break;
  }
 }
 return out;}
const M=20_000_000;                 // 20 Mo de message
const plain=Buffer.allocUnsafe(M);for(let i=0;i<M;i++)plain[i]=(i*167+13)&0xFF;
console.log("CHIFFREMENT PAR MOTS — banque de xorshift128, debit (tput)");
for(const B of [1,4,16,64]){
 const s1=makeBank(B);const t0=process.hrtime.bigint();const cipher=encrypt(plain,s1,B);const sec=Number(process.hrtime.bigint()-t0)/1e9;
 const s2=makeBank(B);const back=encrypt(cipher,s2,B);           // meme graine -> dechiffre
 const ok=back.equals(plain);
 const Mo=(M/1e6)/sec;
 console.log("B="+String(B).padStart(3)+" ("+(B*128)+" bits d'etat, "+(B*32)+" bits/tour) | "+Mo.toFixed(0)+" Mo/s ("+(Mo*8).toFixed(0)+" Mbit/s) | dechiffre "+(ok?"IDENTIQUE":"ERREUR"));
}
console.log("--- toujours lineaire : ultra-rapide mais pas sur. Pour du secret reel -> ChaCha20. ---");
