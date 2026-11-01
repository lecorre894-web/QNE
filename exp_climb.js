"use strict";
// Dernier axe : on fige W=128 et on fait grimper l'EXPOSANT du pas.
// Cout du saut ~ nombre de bits de N (log2 N). Ou est le mur ?
const W=128, taps=[128,7,2,1];
let mask=0n; for(const d of taps) mask|=(1n<<BigInt(d-1));
const start=1n;
const adv=s=>{const l=s&1n; s>>=1n; if(l)s^=mask; return s;};
const rows=new Array(W).fill(0n);
for(let k=0;k<W;k++){let c=adv(1n<<BigInt(k)); for(let i=0;i<W;i++) if((c>>BigInt(i))&1n) rows[i]|=(1n<<BigInt(k));}
const par=x=>{let p=0n; while(x){p^=(x&1n); x>>=1n;} return p;};
const matvec=(R,v)=>{let r=0n; for(let i=0;i<W;i++) if(par(R[i]&v)===1n) r|=(1n<<BigInt(i)); return r;};
const matmul=(A,B)=>{const C=new Array(W).fill(0n); for(let i=0;i<W;i++){let a=A[i],acc=0n,j=0; while(a){ if(a&1n) acc^=B[j]; a>>=1n; j++;} C[i]=acc;} return C;};
const ident=()=>{const I=new Array(W).fill(0n); for(let i=0;i<W;i++) I[i]=1n<<BigInt(i); return I;};
const matpow=(M,N)=>{let R=ident(),Bb=M; while(N>0n){ if(N&1n) R=matmul(R,Bb); Bb=matmul(Bb,Bb); N>>=1n;} return R;};
// verif EXACT au pas 1 000 000
let sv=start; for(let i=0;i<1000000;i++) sv=adv(sv);
console.log("verif pas 1e6 (deroule vs saut) : "+(matvec(matpow(rows,1000000n),start)===sv?"EXACT":"ERREUR"));
for(const d of [1000,10000,100000]){
 const N=10n**BigInt(d);
 const bits=N.toString(2).length;
 const t=process.hrtime.bigint(); matvec(matpow(rows,N),start); const ms=Number(process.hrtime.bigint()-t)/1e6;
 console.log("pas 10^"+d+"  ("+bits.toLocaleString("fr-FR")+" bits a parcourir) : "+ms.toFixed(0)+" ms");
}
