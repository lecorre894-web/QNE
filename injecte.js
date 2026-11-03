








"use strict";
const POLY=0x87n,M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powx(N){let res=1n,base=2n;while(N>0n){if(N&1n)res=mul(res,base);base=mul(base,base);N>>=1n;}return res;}
function toR(v){return new Uint32Array([Number(v&0xffffffffn),Number((v>>32n)&0xffffffffn),Number((v>>64n)&0xffffffffn),Number((v>>96n)&0xffffffffn)]);}
function mulx32(R){const c=R[3]>>>31;R[3]=((R[3]<<1)|(R[2]>>>31))>>>0;R[2]=((R[2]<<1)|(R[1]>>>31))>>>0;R[1]=((R[1]<<1)|(R[0]>>>31))>>>0;R[0]=((R[0]<<1)^(c?0x87:0))>>>0;}
function H(x){x>>>=0;x^=x>>>16;x=Math.imul(x,0x85ebca6b)>>>0;x^=x>>>13;x=Math.imul(x,0xc2b2ae35)>>>0;x^=x>>>16;return x>>>0;}
const BITS=16, MASK=(1<<BITS)-1, CIBLE=0xABCD&MASK;
const INJ=5000000;
let R=toR(powx(2n**500n+1n));
let trouves=0;const ex=[];
const t=process.hrtime.bigint();
for(let k=0;k<INJ;k++){const cand=R[0];if((H(cand)&MASK)===CIBLE){trouves++;if(ex.length<3)ex.push(cand>>>0);}mulx32(R);}
const s=Number(process.hrtime.bigint()-t)/1e9;
console.log("INJECTER TOUT + VERIFIER CE QUI EST VRAI (non-lineaire)");
console.log("condition : H(graine) & 0xFFFF == 0x"+CIBLE.toString(16).toUpperCase()+"  (1 chance sur "+(MASK+1)+")");
console.log("--------------------------------------------------");
console.log("candidats injectes (par la formule) = "+INJ.toLocaleString("fr-FR")+" en "+s.toFixed(2)+"s  ("+(INJ/s/1e6).toFixed(0)+" M/s)");
console.log("verifies VRAIS                       = "+trouves+"   (attendu ~"+Math.round(INJ/(MASK+1))+")");
console.log("exemples de graines vraies : "+ex.map(v=>"0x"+v.toString(16)).join("  "));
if(ex.length)console.log("re-verif graine "+("0x"+ex[0].toString(16))+" : H & mask = 0x"+(H(ex[0])&MASK).toString(16).toUpperCase()+" -> "+(((H(ex[0])&MASK)===CIBLE)?"VRAI":"FAUX"));
console.log("--------------------------------------------------");
console.log("La machine n'a fait que VERIFIER (facile). La formule a INJECTE (presque gratuit).");
console.log("Frontiere honnete : marche si les solutions sont assez denses ; une cible de 128 bits resterait hors de portee.");
