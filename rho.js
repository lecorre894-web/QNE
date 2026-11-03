








"use strict";
const mex=(b,e,m)=>{b%=m;let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;};
function isP(n){if(n<2n)return false;for(const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){if(n%a===0n)return n===a;}
 let d=n-1n,r=0n;while(d%2n===0n){d/=2n;r++;}
 for(const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){let x=mex(a,d,n);if(x===1n||x===n-1n)continue;let ok=false;
  for(let i=0n;i<r-1n;i++){x=x*x%n;if(x===n-1n){ok=true;break;}}if(!ok)return false;}return true;}
let q=(2n**40n)|1n;while(!(isP(q)&&isP(2n*q+1n)))q+=2n;const p=2n*q+1n,g=4n;
const xSecret=(0x9E3779B97n % q);const h=mex(g,xSecret,p);
let pas=0;
const step=(c,a,b)=>{const s=c%3n;pas++;
 if(s===0n)return [c*g%p,(a+1n)%q,b];
 if(s===1n)return [c*c%p,(2n*a)%q,(2n*b)%q];
 return [c*h%p,a,(b+1n)%q];};
let [c1,a1,b1]=[g,1n,0n],[c2,a2,b2]=[g,1n,0n];
do{[c1,a1,b1]=step(c1,a1,b1);[c2,a2,b2]=step(c2,a2,b2);[c2,a2,b2]=step(c2,a2,b2);}while(c1!==c2);
let x=-1n;const db=((b2-b1)%q+q)%q;
if(db!==0n){const da=((a1-a2)%q+q)%q;x=da*mex(db,q-2n,q)%q;}
console.log("TON ASTUCE DES GROS CAS : le confondre a lui-meme (Pollard rho)");
console.log("--------------------------------------------------");
console.log("ordre du groupe q ~ 2^"+(q.toString(2).length-1)+"   secret x = "+xSecret.toString());
console.log("retrouve par auto-collision : x = "+x.toString()+"  -> "+(x>=0n&&mex(g,x,p)===h?"VRAI (casse)":"faux"));
console.log("--------------------------------------------------");
console.log("pas de marche = "+pas.toLocaleString("fr-FR")+"   (~2^"+Math.log2(pas).toFixed(1)+", soit ~2^(n/2))");
console.log("MEMOIRE utilisee = ~6 nombres (constante !)  vs  BSGS qui stockait 2^(n/2) = "+(2**20).toLocaleString("fr-FR")+" entrees");
console.log("=> c'est l'arme des GROS cas : meme temps que BSGS, mais sans le mur de la memoire.");
