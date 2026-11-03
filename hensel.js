








"use strict";
const MOD=1n<<128n, mask=MOD-1n;
const a=(0x9E3779B97F4A7C15F39CC0605CEDC835n|1n);
const b= 0xCAFEBABE0123456789ABCDEF0BADF00Dn;
let x=0n;const check=[];
for(let k=0n;k<128n;k++){
 const r=((b - a*x)&mask);
 const bit=(r>>k)&1n;
 x|=bit<<k;
 if(k===0n||k===7n||k===31n||k===63n||k===127n){const mod=1n<<(k+1n);check.push([k+1n,((a*x)%mod)===(b%mod)]);}
}
console.log("SOUSTRACTION INVERSEE (relevement de Hensel) : a*x = b mod 2^128");
console.log("--------------------------------------------------");
console.log("x reconstruit bit par bit (128 pas) :");
console.log("  x = 0x"+x.toString(16));
console.log("--------------------------------------------------");
console.log("a chaque etage, le resultat tient sur tous les bits deja poses :");
for(const [niv,ok] of check)console.log("   mod 2^"+String(niv).padStart(3)+" : a*x == b ? "+(ok?"VRAI":"faux"));
console.log("--------------------------------------------------");
console.log("verif finale mod 2^128 : "+(((a*x)&mask)===(b&mask)?"VRAI -> resolu":"faux"));
function minv(a){let x=1n;for(let i=0;i<8;i++)x=(x*(2n-a*x))&mask;return x&mask;}
const xdirect=(b*minv(a))&mask;
console.log("meme x que par l'inverse direct ? "+(x===xdirect?"OUI":"non")+"   (128 pas de soustraction = 1 inverse)");
