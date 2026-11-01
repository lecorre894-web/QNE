"use strict";
const W=128, WORDS=4, taps=[128,7,2,1];
const mask=new Uint32Array(WORDS);for(const d of taps){const b=d-1;mask[b>>>5]|=(1<<(b&31))>>>0;}
const pc=x=>{x=x>>>0;x-=(x>>>1)&0x55555555;x=(x&0x33333333)+((x>>>2)&0x33333333);return (((x+(x>>>4))&0x0f0f0f0f)*0x01010101)>>>24;};
const unit=k=>{const v=new Uint32Array(WORDS);v[k>>>5]=(1<<(k&31))>>>0;return v;};
const advV=v=>{const lsb=v[0]&1;for(let w=0;w<WORDS;w++)v[w]=((v[w]>>>1)|(w+1<WORDS?((v[w+1]&1)<<31):0))>>>0;if(lsb)for(let w=0;w<WORDS;w++)v[w]^=mask[w];return v;};
const M=new Uint32Array(W*WORDS);
for(let k=0;k<W;k++){const c=advV(unit(k));for(let i=0;i<W;i++)if((c[i>>>5]>>>(i&31))&1)M[i*4+(k>>>5)]|=(1<<(k&31))>>>0;}
function mul(A,B){const C=new Uint32Array(W*4);
 for(let i=0;i<W;i++){const base=i*4;let c0=0,c1=0,c2=0,c3=0;
  for(let w=0;w<4;w++){let a=A[base+w]>>>0;const sh=w*32;
   while(a){const low=(a&(-a))>>>0;const j=(sh+(31-Math.clz32(low)))*4;c0^=B[j];c1^=B[j+1];c2^=B[j+2];c3^=B[j+3];a=(a&(a-1))>>>0;}}
  C[base]=c0>>>0;C[base+1]=c1>>>0;C[base+2]=c2>>>0;C[base+3]=c3>>>0;}
 return C;}
const matvec=R=>{const v=unit(0);const r=new Uint32Array(WORDS);for(let i=0;i<W;i++){const b=i*4;const acc=((R[b]&v[0])^(R[b+1]&v[1])^(R[b+2]&v[2])^(R[b+3]&v[3]))>>>0;if(pc(acc)&1)r[i>>>5]|=(1<<(i&31))>>>0;}return r;};
const eq=(a,b)=>{for(let w=0;w<WORDS;w++)if(a[w]!==b[w])return false;return true;};
// pas 2^E : E carres de M. AUCUN BigInt pour la distance.
function at2pow(E){let R=M.slice();for(let e=0;e<E;e++)R=mul(R,R);return matvec(R);}
// verif : 2^20 = 1048576, atteignable par deroule
let sv=unit(0);for(let i=0;i<(1<<20);i++)advV(sv);
console.log("verif pas 2^20 (deroule vs carres) : "+(eq(at2pow(20),sv)?"EXACT":"ERREUR"));
for(const E of [100000,500000,1000000]){
 const t=process.hrtime.bigint();at2pow(E);const ms=Number(process.hrtime.bigint()-t)/1e6;
 const digits=Math.round(E*Math.LN2/Math.LN10);
 console.log("pas 2^"+E.toLocaleString("fr-FR")+" (~"+digits.toLocaleString("fr-FR")+" chiffres) : "+ms.toFixed(0)+" ms  (aucun TILT)");
}
