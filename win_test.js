"use strict";
const W=128, taps=[128,7,2,1];
let mask=0n; for(const d of taps) mask|=(1n<<BigInt(d-1));
const start=1n;
const adv=s=>{const l=s&1n; s>>=1n; if(l)s^=mask; return s;};
const rows=new Array(W).fill(0n);
for(let k=0;k<W;k++){let c=adv(1n<<BigInt(k)); for(let i=0;i<W;i++) if((c>>BigInt(i))&1n) rows[i]|=(1n<<BigInt(k));}
const par=x=>{let p=0n; while(x){p^=(x&1n); x>>=1n;} return p;};
const matvec=(R,v)=>{let r=0n; for(let i=0;i<W;i++) if(par(R[i]&v)===1n) r|=(1n<<BigInt(i)); return r;};
let MM=0; const matmul=(A,B)=>{MM++;const C=new Array(W).fill(0n); for(let i=0;i<W;i++){let a=A[i],acc=0n,j=0; while(a){ if(a&1n) acc^=B[j]; a>>=1n; j++;} C[i]=acc;} return C;};
const ident=()=>{const I=new Array(W).fill(0n); for(let i=0;i<W;i++) I[i]=1n<<BigInt(i); return I;};
const matpow=(M,N)=>{let R=ident(),Bb=M; while(N>0n){ if(N&1n) R=matmul(R,Bb); Bb=matmul(Bb,Bb); N>>=1n;} return R;};
function matpowWin(M,N,w){const size=1<<w;const T=new Array(size);T[0]=ident();if(size>1)T[1]=M;for(let i=2;i<size;i++)T[i]=matmul(T[i-1],M);
 const base=BigInt(size);const dg=[];let n=N;while(n>0n){dg.push(Number(n%base));n/=base;}
 let R=ident();for(let i=dg.length-1;i>=0;i--){for(let s=0;s<w;s++)R=matmul(R,R);if(dg[i])R=matmul(R,T[dg[i]]);}return R;}
const N=10n**1000n;
MM=0;const t1=process.hrtime.bigint();const A=matpow(rows,N);const m1=Number(process.hrtime.bigint()-t1)/1e6,mmA=MM;
MM=0;const t2=process.hrtime.bigint();const B=matpowWin(rows,N,8);const m2=Number(process.hrtime.bigint()-t2)/1e6,mmB=MM;
const same=matvec(A,start)===matvec(B,start);
console.log("pas 10^1000 ("+N.toString(2).length+" bits) :");
console.log("  simple   : "+mmA+" matmuls, "+m1.toFixed(0)+" ms");
console.log("  fenetre 8: "+mmB+" matmuls, "+m2.toFixed(0)+" ms (table 256 rouages)");
console.log("  memes resultats : "+(same?"EXACT":"DIFFERENT")+" | gain x"+(m1/m2).toFixed(2));
