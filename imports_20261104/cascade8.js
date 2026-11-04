








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
const J=10n**18n, STAGES=8;
const t0=process.hrtime.bigint();
let gear=matpow(rows,J), stride=J;
console.log("etage 1 : pas = 10^"+(stride.toString().length-1));
for(let s=2;s<=STAGES;s++){gear=matpow(gear,J); stride*=J; console.log("etage "+s+" : pas = 10^"+(stride.toString().length-1));}
const buildSec=Number(process.hrtime.bigint()-t0)/1e9;
const state=matvec(gear,start);
const check = matvec(matpow(rows,stride),start)===state;
console.log("--------------------------------------------------");
console.log("pas final d'un seul tic : "+stride.toString().length+" chiffres");
console.log("cascade en "+buildSec.toFixed(2)+" s | teleportation EXACTE : "+(check?"OUI":"NON"));
