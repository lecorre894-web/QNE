








"use strict";
const M=(1n<<128n)-1n,LOG2=0.3010299956639812;
const mulx=(a)=>{a<<=1n;if(a>>128n&1n)a=(a&M)^0x87n;return a;};
const gfmul=(a,b)=>{let r=0n;while(b>0n){if(b&1n)r^=a;a=mulx(a);b>>=1n;}return r;};
const sqr=(a)=>gfmul(a,a);
const etatA=(E)=>{let k=Number(E%128n),v=2n;for(let i=0;i<k;i++)v=sqr(v);return v;};
function log10Big(n){const s=n.toString();const lead=Number(s.slice(0,15))||1;return Math.log10(lead)+(s.length-Math.min(15,s.length));}
function affiche2(N){const logL=log10Big(N)+Math.log10(LOG2);
 if(logL<15){const L=Number(N)*LOG2,e=Math.floor(L),m=Math.pow(10,L-e);return m.toFixed(3)+" x 10^"+e.toLocaleString("fr-FR");}
 if(logL<308){return "~ 10^"+(Number(N)*LOG2).toExponential(3);}
 return "~ 10^(10^"+logL.toFixed(2)+")";}
console.log("CONFRONTATION — le PC calcule ET affiche l'incommensurable");
console.log("--------------------------------------------------");
for(const [nom,E] of [["10^18",10n**18n+7n],["10^100",10n**100n+3n],["10^1000",10n**1000n+1n],["10^100000",10n**100000n+9n]]){
 const t=process.hrtime.bigint();const s=etatA(E);const us=Number(process.hrtime.bigint()-t)/1000;
 console.log("  etape 2^("+nom+")  (position = "+affiche2(E)+")");
 console.log("     -> etat exact = 0x"+s.toString(16).padStart(32,"0")+"   en "+us.toFixed(0)+" us");
}
console.log("--------------------------------------------------");
console.log("le PC atteint une position affichee en tour 10^(10^...) et en donne l'etat exact, instantanement.");
console.log("force brute : 2^(10^100000) pas -> jamais. Calculer la position + l'afficher sans jamais l'ecrire : la nouvelle logique.");
