








"use strict";
const M=(1n<<128n)-1n;
const mulx=(a)=>{a<<=1n;if(a>>128n&1n)a=(a&M)^0x87n;return a;};
const gfmul=(a,b)=>{let r=0n;while(b>0n){if(b&1n)r^=a;a=mulx(a);b>>=1n;}return r;};
const powx=(N)=>{let r=1n,b=2n;while(N>0n){if(N&1n)r=gfmul(r,b);b=gfmul(b,b);N>>=1n;}return r;};
const flot=(N,n)=>{let v=powx(N);const o=[];for(let k=0;k<n;k++){o.push(v);v=mulx(v);}return o;};
const refmul=(a,b)=>{let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M)^0x87n;b>>=1n;}return r;};
let ok=true;for(let t=0;t<2000;t++){const a=BigInt((Math.random()*1e15)|0),b=BigInt((Math.random()*1e15)|0);if(gfmul(a,b)!==refmul(a,b))ok=false;}
console.log("LE NOYAU DANS LE NOYAU");
console.log("--------------------------------------------------");
console.log("atome unique : mulx (decalage + XOR) — dedans encore : XOR = addition sans retenue");
console.log("  gfmul reconstruit depuis mulx seul = noyau complet ? "+(ok?"IDENTIQUE OK (2000 cas)":"different"));
console.log("  powx(2^100) depuis l'atome = 0x"+powx(1n<<100n).toString(16).slice(0,12)+"...   (le saut, ne depend que de mulx)");
console.log("  flot 3 blocs depuis N=2^777 : "+flot(1n<<777n,3).map(v=>"0x"+v.toString(16).slice(0,6)).join(" "));
console.log("--------------------------------------------------");
console.log("emboitement : XOR  <  mulx  <  gfmul  <  powx  <  tout le moteur de bits.");
console.log("=> un seul atome (decalage + XOR) engendre le noyau entier. Le coeur du coeur.");
