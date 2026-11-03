








"use strict";
const POLY=0x87n,M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powb(base,N){let res=1n,b=base;while(N>0n){if(N&1n)res=mul(res,b);b=mul(b,b);N>>=1n;}return res;}
const powx=(N)=>powb(2n,N);
const hx=(v)=>v.toString(16).padStart(32,"0");
const A=2n**100n+3n, B=2n**77n+5n;
const SA=powx(A), SB=powx(B);
console.log("Participer a la formule x^N — operations sur les EXPOSANTS = operations sur les ETATS");
console.log("--------------------------------------------------");
console.log("x^A . x^B  =?=  x^(A+B)   : "+(hx(mul(SA,SB))===hx(powx(A+B))?"VRAI":"FAUX")+"   (1 multiplication, 0 parcours)");
console.log("(x^A)^2    =?=  x^(2A)    : "+(hx(mul(SA,SA))===hx(powx(2n*A))?"VRAI":"FAUX")+"   (Frobenius : 1 carre)");
console.log("(x^A)^B    =?=  x^(A*B)   : "+(hx(powb(SA,B))===hx(powx(A*B))?"VRAI":"FAUX")+"   (adresse ~2^177 sans l'ecrire)");
console.log("--------------------------------------------------");
const enorme=(A*B)+(A+B);
const parComposition=mul(powb(SA,B),mul(SA,SB));
const direct=powx(enorme);
console.log("adresse composee A*B+A+B (~2^177) par algebre = direct ? "+(hx(parComposition)===hx(direct)?"OUI":"NON"));
console.log("etat = "+hx(direct));
console.log("--------------------------------------------------");
console.log("CE QUE CA VEUT DIRE : on ne parcourt rien. On navigue l'espace par ses operations de groupe.");
console.log("Frontiere honnete : vrai pour TOUT ce qui est lineaire/algebrique (il existe une formule).");
console.log("Le jumeau non-lineaire (chaos) n'a PAS de formule fermee -> lui seul doit etre calcule.");
