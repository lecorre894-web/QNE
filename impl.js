








"use strict";
const POLY=0x87n,M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powx(N){let res=1n,base=2n;while(N>0n){if(N&1n)res=mul(res,base);base=mul(base,base);N>>=1n;}return res;}
function toR(v){return new Uint32Array([Number(v&0xffffffffn),Number((v>>32n)&0xffffffffn),Number((v>>64n)&0xffffffffn),Number((v>>96n)&0xffffffffn)]);}
function mulx32(R){const c=R[3]>>>31;R[3]=((R[3]<<1)|(R[2]>>>31))>>>0;R[2]=((R[2]<<1)|(R[1]>>>31))>>>0;R[1]=((R[1]<<1)|(R[0]>>>31))>>>0;R[0]=((R[0]<<1)^(c?0x87:0))>>>0;}
const CLE=new Uint32Array([0x0f0f0f0f,0x33333333,0x55555555,0xaaaaaaaa]);
function implique(A){return new Uint32Array([((~A[0])|CLE[0])>>>0,((~A[1])|CLE[1])>>>0,((~A[2])|CLE[2])>>>0,((~A[3])|CLE[3])>>>0]);}
const N=2n**1000n+7n;
let A=toR(powx(N));
let okTV=true;for(let limb=0;limb<4;limb++){const a=A[limb],k=CLE[limb],b=((~a)|k)>>>0;for(let j=0;j<32;j++){const ab=(a>>>j)&1,kb=(k>>>j)&1,bb=(b>>>j)&1,att=((ab?0:1)|kb)&1;if(bb!==att)okTV=false;}}
console.log("IMPLICATION — substitut classique de l'intrication (lien A=>B deterministe)");
console.log("table de verite A=>CLE (¬A ∨ CLE) verifiee bit a bit : "+(okTV?"OK":"FAUX"));
console.log("--------------------------------------------------");
let web=A;const n=5;
for(let k=0;k<n;k++){const B=implique(web);console.log("A"+k+" "+[...web].map(x=>x.toString(16).padStart(8,"0")).join("")+"  => A"+(k+1)+" "+[...B].map(x=>x.toString(16).padStart(8,"0")).join(""));web=B;}
console.log("--------------------------------------------------");
console.log("stocke : 1 adresse (un nombre) + 1 regle d'implication");
console.log("parcelles impliquees = 0 octet, reconstruites a la demande");
console.log("NB honnete : correlation DETERMINISTE (locale, clonable) — pas d'avantage quantique, pas de violation de Bell ; l'implication seule sature en cycle 2 (lossy)");
