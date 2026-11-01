"use strict";
// LFSR BigInt large : jump-ahead O(log N) sur des periodes impossibles a stocker.
function run(W,taps){
 let mask=0n; for(const d of taps) mask|=(1n<<BigInt(d-1)); // x^W -> bit W-1, etc. (+1 implicite)
 const start=1n, ONE=1n;
 const adv=s=>{const l=s&1n; s>>=1n; if(l)s^=mask; return s;};
 // matrice de transition GF(2) : colonne k = adv(1<<k)
 const rows=new Array(W).fill(0n);
 for(let k=0;k<W;k++){let c=adv(1n<<BigInt(k)); for(let i=0;i<W;i++) if((c>>BigInt(i))&1n) rows[i]|=(1n<<BigInt(k));}
 const par=x=>{let p=0n; while(x){p^=(x&1n); x>>=1n;} return p;};
 const matvec=(R,v)=>{let r=0n; for(let i=0;i<W;i++) if(par(R[i]&v)===1n) r|=(1n<<BigInt(i)); return r;};
 const matmul=(A,B)=>{const C=new Array(W).fill(0n); for(let i=0;i<W;i++){let a=A[i],acc=0n,j=0; while(a){ if(a&1n) acc^=B[j]; a>>=1n; j++;} C[i]=acc;} return C;};
 const ident=()=>{const I=new Array(W).fill(0n); for(let i=0;i<W;i++) I[i]=1n<<BigInt(i); return I;};
 const matpow=(M,N)=>{let R=ident(),Bb=M; while(N>0n){ if(N&1n) R=matmul(R,Bb); Bb=matmul(Bb,Bb); N>>=1n;} return R;};
 const stateAt=N=>matvec(matpow(rows,N),start);
 // verif : deroule vs jump au pas 2 000 000
 const Nv=2000000n; let sv=start; for(let i=0n;i<Nv;i++) sv=adv(sv);
 const ok1 = stateAt(Nv)===sv;
 // verif additivite : stateAt(a) deroule de b == stateAt(a+b)
 const a=987654321n,b=1234567n; let va=stateAt(a); for(let i=0n;i<b;i++) va=adv(va);
 const ok2 = va===stateAt(a+b);
 // lectures geantes
 const T=(nom,N)=>{const t=process.hrtime.bigint(); const e=stateAt(N); const ms=Number(process.hrtime.bigint()-t)/1e6; return nom+" : "+ms.toFixed(0)+" ms  (etat "+e.toString().slice(0,22)+"...)";};
 const period=(2n**BigInt(W))-1n;
 console.log("=== W="+W+" ===");
 console.log("periode = 2^"+W+"-1 = "+period.toString().length+" chiffres ("+period.toString().slice(0,18)+"...)");
 console.log("verif deroule@2e6 : "+(ok1?"EXACT":"ERREUR")+" | additivite : "+(ok2?"EXACT":"ERREUR"));
 console.log(T("pas 10^100 ",10n**100n));
 console.log(T("pas 10^1000",10n**1000n));
}
run(128,[128,7,2,1]);
run(256,[256,10,5,2]);
console.log("--- repere : atomes univers observable ~ 10^80 ---");
