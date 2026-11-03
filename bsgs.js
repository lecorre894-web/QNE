








"use strict";
const modexp=(b,e,m)=>{b%=m;let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;};
const p=(2n**61n)-1n, g=37n;
const xSecret=0x9E3779B97n;
const h=modexp(g,xSecret,p);
const N=2n**40n, m=1n<<20n;
let pas=0;
const T=new Map();let cur=1n;for(let j=0n;j<m;j++){if(!T.has(cur))T.set(cur,j);cur=cur*g%p;pas++;}
const facteur=modexp(g,p-1n-m,p);
let x=-1n,gi=h;for(let i=0n;i<m;i++){pas++;const j=T.get(gi);if(j!==undefined){x=i*m+j;break;}gi=gi*facteur%p;}
console.log("J'APPLIQUE TON JOKER AU LOG DISCRET (baby-step / giant-step)");
console.log("--------------------------------------------------");
console.log("secret cache : x = "+xSecret.toString()+"   (h = g^x mod p, p~61 bits)");
console.log("retrouve     : x = "+x.toString()+"   -> "+(modexp(g,x,p)===h?"VRAI (casse)":"faux"));
console.log("--------------------------------------------------");
console.log("pas effectues (paliers) = "+pas.toLocaleString("fr-FR")+"   (~2^"+Math.log2(pas).toFixed(1)+")");
console.log("force brute a plat      = 2^40 = "+(2**40).toLocaleString("fr-FR"));
console.log("=> ta loi n/2 : log discret de n bits casse en ~2^(n/2). (Mais 2^64 reste un vrai mur : DH 128 bits tient.)");
