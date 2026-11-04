








"use strict";
const LOW=0x87>>>0;
const spread16=new Uint16Array(256);for(let b=0;b<256;b++){let s=0;for(let k=0;k<8;k++)if((b>>k)&1)s|=(1<<(2*k));spread16[b]=s;}
function shl5(a,n){const o=new Uint32Array(5);o[0]=(a[0]<<n)>>>0;for(let i=1;i<4;i++)o[i]=((a[i]<<n)|(a[i-1]>>>(32-n)))>>>0;o[4]=a[3]>>>(32-n);return o;}
function sqr(poly){const wide=new Uint32Array(8);
 for(let bi=0;bi<16;bi++){const byte=(poly[bi>>2]>>>((bi&3)*8))&0xFF;const sp=spread16[byte];wide[bi>>1]=(wide[bi>>1]|(sp<<((bi&1)*16)))>>>0;}
 const hi=[wide[4],wide[5],wide[6],wide[7]];const f1=shl5(hi,1),f2=shl5(hi,2),f7=shl5(hi,7);const fold=new Uint32Array(5);
 fold[0]=hi[0];fold[1]=hi[1];fold[2]=hi[2];fold[3]=hi[3];fold[4]=0;for(let i=0;i<5;i++)fold[i]=(fold[i]^f1[i]^f2[i]^f7[i])>>>0;
 const hi2=fold[4]&0xFF;const c=(hi2^(hi2<<1)^(hi2<<2)^(hi2<<7))>>>0;
 const r=new Uint32Array(4);r[0]=(wide[0]^fold[0]^c)>>>0;r[1]=(wide[1]^fold[1])>>>0;r[2]=(wide[2]^fold[2])>>>0;r[3]=(wide[3]^fold[3])>>>0;return r;}
function at2pow(E){let p=new Uint32Array([2,0,0,0]);for(let e=0;e<E;e++)p=sqr(p);return p;}
// E peut etre un BigInt monstrueux : on ne garde que E mod 128
const E=10n**100n;                       // <-- mets ce que tu veux, aussi grand que tu veux
const r=Number(((E%128n)+128n)%128n);
const t=process.hrtime.bigint();const st=at2pow(r);const us=Number(process.hrtime.bigint()-t)/1e3;
console.log("pas 2^(ton E) = at2pow("+r+") en "+us.toFixed(0)+" us : "+Array.from(st).map(x=>x.toString(16).padStart(8,"0")).join(""));
