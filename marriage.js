








"use strict";
// MARIAGE portee x richesse : W=512 (periode 10^154), cascade surmultipliee.
// Le bond reste DANS une periode -> chaque saut atterrit sur du neuf, pas de cycle.
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
for(let s=2;s<=STAGES;s++){gear=matpow(gear,J); stride*=J;}       // surmultiplication -> stride = J^8 = 10^72
const buildSec=Number(process.hrtime.bigint()-t0)/1e9;
const fresh = stride < period;                                    // le bond tient-il dans une periode ?
// on CONTINUE : chaque tic pose l'etat exact et repart, sans repeter de cycle
const seen=new Set(); let state=start; const poses=[];
for(let k=1;k<=4;k++){state=matvec(gear,state); poses.push(state.toString().slice(0,18)); seen.add(state.toString());}
const tousDistincts = seen.size===4;
// verif EXACT : apres 4 tics on est au pas 4*stride, calcul direct independant
const check = state===matvec(matpow(rows,4n*stride),start);
console.log("MARIAGE W="+W+"  periode "+period.toString().length+" chiffres (10^"+(period.toString().length-1)+")");
console.log("pas surmultiplie (1 tic) = 10^"+(stride.toString().length-1)+"  | tient dans la periode : "+(fresh?"OUI (du neuf a chaque saut)":"NON"));
console.log("reserve avant de revoir un cycle : periode/pas = 10^"+(period.toString().length-stride.toString().length)+" tics");
console.log("construction cascade : "+buildSec.toFixed(1)+" s");
console.log("4 tics poses (18 1ers chiffres), chacun un etat neuf :");
poses.forEach((p,i)=>console.log("  tic "+(i+1)+" -> "+p+"..."));
console.log("tous distincts : "+(tousDistincts?"OUI":"NON")+"  | position finale EXACTE : "+(check?"OUI":"NON"));
