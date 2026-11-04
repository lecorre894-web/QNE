








"use strict";
const W=512, taps=[512,8,5,2];
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
const J=10n**9n, STAGES=8;
const period=(2n**BigInt(W))-1n;
const t0=process.hrtime.bigint();
let gear=matpow(rows,J), stride=J;
for(let s=2;s<=STAGES;s++){gear=matpow(gear,J); stride*=J;}
const buildSec=Number(process.hrtime.bigint()-t0)/1e9;
const fresh = stride < period;
const seen=new Set(); let state=start; const poses=[];
for(let k=1;k<=4;k++){state=matvec(gear,state); poses.push(state.toString().slice(0,18)); seen.add(state.toString());}
const check = state===matvec(matpow(rows,4n*stride),start);
console.log("MARIAGE W="+W+"  periode "+period.toString().length+" chiffres (10^"+(period.toString().length-1)+")");
console.log("pas surmultiplie (1 tic) = 10^"+(stride.toString().length-1)+"  | tient dans la periode : "+(fresh?"OUI":"NON"));
console.log("reserve avant un cycle : 10^"+(period.toString().length-stride.toString().length)+" tics");
console.log("construction : "+buildSec.toFixed(1)+" s");
poses.forEach((p,i)=>console.log("  tic "+(i+1)+" -> "+p+"..."));
console.log("tous distincts : "+(seen.size===4?"OUI":"NON")+" | position finale EXACTE : "+(check?"OUI":"NON"));
