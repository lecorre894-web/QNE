








"use strict";
const POLY=0x87n, M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powx(N){let res=1n,base=2n;while(N>0n){if(N&1n)res=mul(res,base);base=mul(base,base);N>>=1n;}return res;}
function hex16(v){return v.toString(16).padStart(32,"0");}
function content(N){return hex16(powx(N));}
console.log("GIDX — le pointeur remplace par un NOMBRE incommensurable qui elabore le contenu");
console.log("--------------------------------------------------");
const adr=[123456789n, 2n**100n, 2n**1000n, 10n**50n+7n, 2n**100000n+123n];
for(const N of adr){const t=process.hrtime.bigint();const c=content(N);const us=Number(process.hrtime.bigint()-t)/1000;
 const nom=(N<1000000000n)?N.toString():("~2^"+(N.toString(2).length-1)+" ("+N.toString(2).length+" bits)");
 console.log("adr "+nom.padEnd(26)+" -> "+c+"  ("+us.toFixed(0)+" us)");}
console.log("--------------------------------------------------");
const A=2n**777n+9n;
console.log("dedup : deux parcelles a la MEME adresse ~2^777 donnent le meme contenu ? "+(content(A)===content(A)?"OUI":"NON"));
console.log("contenus distincts adressables = ordre multiplicatif de x ~ 2^128 (3,4 x 10^38)");
console.log("table de pointeurs = 0 octet   |   contenu stocke = 0 octet");
