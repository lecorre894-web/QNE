








"use strict";
const spread16=new Uint16Array(256);for(let b=0;b<256;b++){let s=0;for(let k=0;k<8;k++)if((b>>k)&1)s|=(1<<(2*k));spread16[b]=s;}
const defs=[[128,[7,2,1,0]],[256,[10,5,2,0]],[512,[8,5,2,0]],[1024,[19,6,1,0]],[2048,[19,14,13,0]],[4096,[27,15,1,0]]];
function makeSqr(W,lowtaps){const words=W>>>5;
 return poly=>{const wide=new Uint32Array(2*words);const nb=words*4;
  for(let bi=0;bi<nb;bi++){const byte=(poly[bi>>2]>>>((bi&3)*8))&0xFF;const sp=spread16[byte];wide[bi>>1]=(wide[bi>>1]|(sp<<((bi&1)*16)))>>>0;}
  for(let pos=2*W-1;pos>=W;pos--){const w=pos>>5,b=pos&31;if((wide[w]>>>b)&1){wide[w]^=(1<<b)>>>0;const base=pos-W;for(let k=0;k<lowtaps.length;k++){const q=base+lowtaps[k];wide[q>>5]^=(1<<(q&31))>>>0;}}}
  const r=new Uint32Array(words);for(let i=0;i<words;i++)r[i]=wide[i];return r;};}
console.log("MAX BITS par paquet — retour en W carres et cout du saut");
for(const [W,lt] of defs){const words=W>>>5;const sqr=makeSqr(W,lt);
 const x=new Uint32Array(words);x[0]=2;let p=x.slice();const t0=process.hrtime.bigint();
 for(let e=0;e<W;e++)p=sqr(p);const ms=Number(process.hrtime.bigint()-t0)/1e6;
 let same=true;for(let i=0;i<words;i++)if(p[i]!==x[i]){same=false;break;}
 console.log("W="+String(W).padStart(5)+" bits | paquet="+W+" | retour : "+(same?"OUI":"NON")+" | "+W+" carres en "+ms.toFixed(1)+" ms");
}
