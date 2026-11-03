








"use strict";
const POLY=0x87n, M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powx(N){let res=1n,base=2n;while(N>0n){if(N&1n)res=mul(res,base);base=mul(base,base);N>>=1n;}return res;}
function toR(v){return new Uint32Array([Number(v&0xffffffffn),Number((v>>32n)&0xffffffffn),Number((v>>64n)&0xffffffffn),Number((v>>96n)&0xffffffffn)]);}
function mulx32(R){const c=R[3]>>>31;R[3]=((R[3]<<1)|(R[2]>>>31))>>>0;R[2]=((R[2]<<1)|(R[1]>>>31))>>>0;R[1]=((R[1]<<1)|(R[0]>>>31))>>>0;R[0]=((R[0]<<1)^(c?0x87:0))>>>0;}
let v=powx(2n**50n+3n),R=toR(v),ok=true;
for(let k=0;k<20;k++){if(toR(v)[0]!==R[0]||toR(v)[1]!==R[1]||toR(v)[2]!==R[2]||toR(v)[3]!==R[3])ok=false;v=mul(v,2n);mulx32(R);}
console.log("auto-test moteur 32 bits vs BigInt : "+(ok?"IDENTIQUE OK":"DIVERGENCE !"));
function flot(N,Lbits){let R=toR(powx(N));const pas=Math.ceil(Lbits/128);let chk=0;for(let k=0;k<pas;k++){chk^=R[0];mulx32(R);}return {bits:pas*128,chk};}
const N=2n**1000n+7n;
console.log("GADR2 — flot depuis 1 adresse incommensurable (~2^1000), moteur 32 bits");
console.log("--------------------------------------------------");
for(const [nom,L] of [["100 M",1e8],["1 milliard",1e9],["10 G",1e10],["100 G",1e11],["1 BILLION",1e12]]){
 const t=process.hrtime.bigint();const o=flot(N,L);const s=Number(process.hrtime.bigint()-t)/1e9;
 console.log(nom.padEnd(11)+" bits : "+s.toFixed(2)+"s  = "+(o.bits/1e9/s).toFixed(2)+" Gbit/s");}
console.log("stockage total = 0 octet");
