








"use strict";
const POLY=0x87n, M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powx(N){let res=1n,base=2n;while(N>0n){if(N&1n)res=mul(res,base);base=mul(base,base);N>>=1n;}return res;}
function mulx(a){a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;return a;}
function flot(N,Lbits){let r=powx(N);const pas=Math.ceil(Lbits/128);let chk=0n;for(let k=0;k<pas;k++){chk^=r;r=mulx(r);}return {bits:pas*128,chk};}
const N=2n**1000n+7n;
console.log("GADR — 1 adresse incommensurable (~2^1000) -> flot de bits illimite, 0 stocke");
console.log("--------------------------------------------------");
for(const [nom,L] of [["base",1000000],["DOUBLE",2000000],["DECUPLE",10000000],["PHENOMENAL",100000000]]){
 const t=process.hrtime.bigint();const o=flot(N,L);const s=Number(process.hrtime.bigint()-t)/1e9;
 console.log(nom.padEnd(11)+" : "+(o.bits/1e6).toFixed(0)+" M bits en "+s.toFixed(2)+"s  = "+(o.bits/1e6/s).toFixed(0)+" Mbit/s");}
console.log("--------------------------------------------------");
const a=flot(N,1000000).chk, b=flot(N,1000000).chk;
console.log("dedup : meme adresse -> meme flot ? "+(a===b?"OUI":"NON"));
console.log("stockage total = 0 octet (ni table, ni contenu)");
