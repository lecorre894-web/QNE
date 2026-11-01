"use strict";
const W=128, taps=[128,7,2,1];
// --- LFSR de reference (pour verif + base) ---
const WORDS=4;const vmask=new Uint32Array(WORDS);for(const d of taps){const b=d-1;vmask[b>>>5]|=(1<<(b&31))>>>0;}
const unit=k=>{const v=new Uint32Array(WORDS);v[k>>>5]=(1<<(k&31))>>>0;return v;};
const advV=v=>{const lsb=v[0]&1;for(let w=0;w<WORDS;w++)v[w]=((v[w]>>>1)|(w+1<WORDS?((v[w+1]&1)<<31):0))>>>0;if(lsb)for(let w=0;w<WORDS;w++)v[w]^=vmask[w];return v;};
// --- arithmetique polynomiale GF(2) mod p(x)=x^128+x^7+x^2+x+1 ---
const spread16=new Uint16Array(256);for(let b=0;b<256;b++){let s=0;for(let k=0;k<8;k++)if((b>>k)&1)s|=(1<<(2*k));spread16[b]=s;}
function shl5(a,n){const o=new Uint32Array(5);o[0]=(a[0]<<n)>>>0;for(let i=1;i<4;i++)o[i]=((a[i]<<n)|(a[i-1]>>>(32-n)))>>>0;o[4]=a[3]>>>(32-n);return o;}
function sqr(poly){const wide=new Uint32Array(8);
 for(let bi=0;bi<16;bi++){const byte=(poly[bi>>2]>>>((bi&3)*8))&0xFF;const sp=spread16[byte];wide[bi>>1]=(wide[bi>>1]|(sp<<((bi&1)*16)))>>>0;}
 const hi=[wide[4],wide[5],wide[6],wide[7]];
 const f1=shl5(hi,1),f2=shl5(hi,2),f7=shl5(hi,7);const fold=new Uint32Array(5);
 fold[0]=hi[0];fold[1]=hi[1];fold[2]=hi[2];fold[3]=hi[3];fold[4]=0;
 for(let i=0;i<5;i++)fold[i]=(fold[i]^f1[i]^f2[i]^f7[i])>>>0;
 const hi2=fold[4]&0xFF;const c=(hi2^(hi2<<1)^(hi2<<2)^(hi2<<7))>>>0;
 const r=new Uint32Array(4);r[0]=(wide[0]^fold[0]^c)>>>0;r[1]=(wide[1]^fold[1])>>>0;r[2]=(wide[2]^fold[2])>>>0;r[3]=(wide[3]^fold[3])>>>0;
 return r;}
// base : M^i . start  (start = unit(0))
const basis=[];{let s=unit(0);for(let i=0;i<W;i++){basis.push(s.slice());s=advV(s);}}
function at2pow(E){let poly=new Uint32Array([2,0,0,0]);  // x
 for(let e=0;e<E;e++)poly=sqr(poly);                     // x^(2^E) mod p
 const r=new Uint32Array(WORDS);                         // result = XOR basis[i] pour coeff i=1
 for(let i=0;i<W;i++)if((poly[i>>>5]>>>(i&31))&1)for(let w=0;w<WORDS;w++)r[w]^=basis[i][w];
 return r;}
const eq=(a,b)=>{for(let w=0;w<WORDS;w++)if(a[w]!==b[w])return false;return true;};
// verif 2^20
let sv=unit(0);for(let i=0;i<(1<<20);i++)advV(sv);
console.log("verif pas 2^20 (poly vs deroule) : "+(eq(at2pow(20),sv)?"EXACT":"ERREUR"));
for(const E of [1000000,10000000]){const t=process.hrtime.bigint();at2pow(E);const ms=Number(process.hrtime.bigint()-t)/1e6;
 console.log("pas 2^"+E.toLocaleString("fr-FR")+" (~"+Math.round(E*0.30103).toLocaleString("fr-FR")+" chiffres) : "+ms.toFixed(0)+" ms");}
