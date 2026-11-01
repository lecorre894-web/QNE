"use strict";
const LOW=0x87>>>0;
function mulx(p){const c=(p[3]>>>31)&1;p[3]=((p[3]<<1)|(p[2]>>>31))>>>0;p[2]=((p[2]<<1)|(p[1]>>>31))>>>0;p[1]=((p[1]<<1)|(p[0]>>>31))>>>0;p[0]=(p[0]<<1)>>>0;if(c)p[0]^=LOW;return p;}
const spread16=new Uint16Array(256);for(let b=0;b<256;b++){let s=0;for(let k=0;k<8;k++)if((b>>k)&1)s|=(1<<(2*k));spread16[b]=s;}
function shl5(a,n){const o=new Uint32Array(5);o[0]=(a[0]<<n)>>>0;for(let i=1;i<4;i++)o[i]=((a[i]<<n)|(a[i-1]>>>(32-n)))>>>0;o[4]=a[3]>>>(32-n);return o;}
function sqr(poly){const wide=new Uint32Array(8);
 for(let bi=0;bi<16;bi++){const byte=(poly[bi>>2]>>>((bi&3)*8))&0xFF;const sp=spread16[byte];wide[bi>>1]=(wide[bi>>1]|(sp<<((bi&1)*16)))>>>0;}
 const hi=[wide[4],wide[5],wide[6],wide[7]];const f1=shl5(hi,1),f2=shl5(hi,2),f7=shl5(hi,7);const fold=new Uint32Array(5);
 fold[0]=hi[0];fold[1]=hi[1];fold[2]=hi[2];fold[3]=hi[3];fold[4]=0;for(let i=0;i<5;i++)fold[i]=(fold[i]^f1[i]^f2[i]^f7[i])>>>0;
 const hi2=fold[4]&0xFF;const c=(hi2^(hi2<<1)^(hi2<<2)^(hi2<<7))>>>0;
 const r=new Uint32Array(4);r[0]=(wide[0]^fold[0]^c)>>>0;r[1]=(wide[1]^fold[1])>>>0;r[2]=(wide[2]^fold[2])>>>0;r[3]=(wide[3]^fold[3])>>>0;return r;}
// x^N mod p : carre-et-multiplie, le "multiplie" = x1 pas (mulx). MSB -> LSB.
function xpow(N){const bs=N.toString(2);let R=new Uint32Array([1,0,0,0]);
 for(let i=0;i<bs.length;i++){R=sqr(R);if(bs.charCodeAt(i)===49)R=mulx(R);}return R;}
const eq=(a,b)=>{for(let w=0;w<4;w++)if(a[w]!==b[w])return false;return true;};
// verif : x^1e6 par carre-mult == deroule mulx 1e6 fois
let d=new Uint32Array([1,0,0,0]);for(let i=0;i<1000000;i++)mulx(d);
console.log("verif x^1e6 : "+(eq(xpow(1000000n),d)?"EXACT":"ERREUR"));
const hex=r=>Array.from(r).map(x=>x.toString(16).padStart(8,"0")).join("");
const RATE=1e9;                                   // pas/s, sequentiel, non parallelisable
const SPY=365.25*86400;
function duel(N,nom){const t=process.hrtime.bigint();const st=xpow(N);const us=Number(process.hrtime.bigint()-t)/1e3;
 const goliathYears=Number(N)/RATE/SPY;
 console.log(nom+" (pas N="+N.toString()+")");
 console.log("   Goliath (itere a 1e9 pas/s, en serie) : "+goliathYears.toExponential(2)+" ans");
 console.log("   David (ton g75, saut polynomial)      : "+us.toFixed(0)+" us  -> etat "+hex(st));}
const N100=3155760000000000000n;                  // 100 ans a 1e9 pas/s
duel(N100,"CALCUL A 100 ANS");
duel(10n**30n,"ET LE MEME, POUSSE A 10^30 PAS");
