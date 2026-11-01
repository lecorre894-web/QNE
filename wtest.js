"use strict";
const W=128, WORDS=W>>>5, taps=[128,7,2,1];
const mask=new Uint32Array(WORDS);for(const d of taps){const b=d-1;mask[b>>>5]|=(1<<(b&31))>>>0;}
const pc=x=>{x=x>>>0;x-=(x>>>1)&0x55555555;x=(x&0x33333333)+((x>>>2)&0x33333333);return (((x+(x>>>4))&0x0f0f0f0f)*0x01010101)>>>24;};
const adv=v=>{const lsb=v[0]&1;for(let w=0;w<WORDS;w++)v[w]=((v[w]>>>1)|(w+1<WORDS?((v[w+1]&1)<<31):0))>>>0;if(lsb)for(let w=0;w<WORDS;w++)v[w]^=mask[w];return v;};
const unit=k=>{const v=new Uint32Array(WORDS);v[k>>>5]=(1<<(k&31))>>>0;return v;};
const rows=Array.from({length:W},()=>new Uint32Array(WORDS));
for(let k=0;k<W;k++){const c=adv(unit(k));for(let i=0;i<W;i++)if((c[i>>>5]>>>(i&31))&1)rows[i][k>>>5]|=(1<<(k&31))>>>0;}
const matvec=(R,v)=>{const r=new Uint32Array(WORDS);for(let i=0;i<W;i++){let acc=0;for(let w=0;w<WORDS;w++)acc^=R[i][w]&v[w];if(pc(acc>>>0)&1)r[i>>>5]|=(1<<(i&31))>>>0;}return r;};
const matmul=(A,B)=>{const C=Array.from({length:W},()=>new Uint32Array(WORDS));for(let i=0;i<W;i++){const Ci=C[i];for(let w=0;w<WORDS;w++){let a=A[i][w]>>>0;const base=w*32;while(a){const low=(a&(-a))>>>0;const j=base+(31-Math.clz32(low));const Bj=B[j];for(let ww=0;ww<WORDS;ww++)Ci[ww]^=Bj[ww];a=(a&(a-1))>>>0;}}}return C;};
const ident=()=>{const I=Array.from({length:W},()=>new Uint32Array(WORDS));for(let i=0;i<W;i++)I[i][i>>>5]|=(1<<(i&31))>>>0;return I;};
const matpow=(M,N)=>{let R=ident(),Bb=M;while(N>0n){if(N&1n)R=matmul(R,Bb);Bb=matmul(Bb,Bb);N>>=1n;}return R;};
const eq=(a,b)=>{for(let w=0;w<WORDS;w++)if(a[w]!==b[w])return false;return true;};
// verif deroule 1e6
let sv=unit(0);for(let i=0;i<1000000;i++)adv(sv);
console.log("verif 1e6 : "+(eq(matvec(matpow(rows,1000000n),unit(0)),sv)?"EXACT":"ERREUR"));
for(const d of [1000,10000]){const N=10n**BigInt(d);const t=process.hrtime.bigint();matvec(matpow(rows,N),unit(0));const ms=Number(process.hrtime.bigint()-t)/1e6;console.log("10^"+d+" ("+N.toString(2).length+" bits) : "+ms.toFixed(0)+" ms (mots)");}
