








"use strict";
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
const J=10n**18n, L=5000000, ROUNDS=8;
const t0=process.hrtime.bigint();
const GEAR=matpow(rows,J);
let state=start, reach=0n, real=0;
for(let r=0;r<ROUNDS;r++){
 state=matvec(GEAR,state); reach+=J;
 for(let i=0;i<L;i++){state=adv(state); reach+=1n; real++;}
}
const sec=Number(process.hrtime.bigint()-t0)/1e9;
const check = matvec(matpow(rows,reach),start)===state;
console.log("PING-PONG W="+W+"  (A x J=10^18, B x L=5e6, "+ROUNDS+" echanges)");
console.log("terrain couvert : "+reach.toString()+" etats");
console.log("pas reels (amplificateur) : "+real.toLocaleString("fr-FR")+" -> "+(real/sec/1e6).toFixed(0)+" M pas/s");
console.log("portee effective (multiplicateur) : "+(Number(reach)/sec).toExponential(2)+" etats/s");
console.log("temps : "+sec.toFixed(3)+" s | final : "+(check?"EXACT":"ERREUR"));
