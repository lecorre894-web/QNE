"use strict";
// Anneau GF(2)[x]/p(x), p=x^128+x^7+x^2+x+1. Avancer d'un pas = multiplier par x.
const LOW=0x87>>>0;                       // x^7+x^2+x+1 (reduction de x^128)
// multiplication par x mod p (sur un poly de 4 mots, en place)
function mulx(p){const carry=(p[3]>>>31)&1;
 p[3]=((p[3]<<1)|(p[2]>>>31))>>>0;p[2]=((p[2]<<1)|(p[1]>>>31))>>>0;p[1]=((p[1]<<1)|(p[0]>>>31))>>>0;p[0]=(p[0]<<1)>>>0;
 if(carry)p[0]^=LOW;return p;}
// carre GF(2) mod p : etaler les bits puis reduire
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
function at2pow(E){let poly=new Uint32Array([2,0,0,0]);for(let e=0;e<E;e++)poly=sqr(poly);return poly;} // x^(2^E) = etat au pas 2^E (depuis x^0=1)
const eq=(a,b)=>{for(let w=0;w<4;w++)if(a[w]!==b[w])return false;return true;};
// deroule de reference : partir de 1, multiplier par x, 2^20 fois
let s=new Uint32Array([1,0,0,0]);for(let i=0;i<(1<<20);i++)mulx(s);
console.log("verif pas 2^20 (poly vs deroule) : "+(eq(at2pow(20),s)?"EXACT":"ERREUR"));
for(const E of [1000000,10000000,100000000]){const t=process.hrtime.bigint();at2pow(E);const ms=Number(process.hrtime.bigint()-t)/1e6;
 console.log("pas 2^"+E.toLocaleString("fr-FR")+" (~"+Math.round(E*0.30103).toLocaleString("fr-FR")+" chiffres) : "+ms.toFixed(0)+" ms");}
