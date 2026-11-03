








"use strict";
const mex=(b,e,m)=>{b%=m;let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;};
function isP(n){if(n<2n)return false;for(const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){if(n%a===0n)return n===a;}
 let d=n-1n,r=0n;while(d%2n===0n){d/=2n;r++;}
 for(const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){let x=mex(a,d,n);if(x===1n||x===n-1n)continue;let ok=false;
  for(let i=0n;i<r-1n;i++){x=x*x%n;if(x===n-1n){ok=true;break;}}if(!ok)return false;}return true;}
const nextP=(n)=>{n|=1n;while(!isP(n))n+=2n;return n;};
function isqrt(n){if(n<2n)return n;let x=n,y=(x+1n)>>1n;while(y<x){x=y;y=(x+n/x)>>1n;}return x;}
let t0=Date.now();
const p=nextP(2n**2048n+987654321n), q=nextP(p+2n);
const N=p*q;const bits=N.toString(2).length;
const tgen=Date.now()-t0;
t0=Date.now();let a=isqrt(N);if(a*a<N)a+=1n;let pas=0,bb,b;
while(true){pas++;bb=a*a-N;b=isqrt(bb);if(b*b===bb)break;a+=1n;}
const f1=a-b,f2=a+b,tf=Date.now()-t0;
console.log("CASSER UN 4096 BITS PAR DIFFERENCE DE CARRES (Fermat)");
console.log("--------------------------------------------------");
console.log("N fait "+bits+" bits (produit de 2 premiers de ~2048 bits)");
console.log("pas de Fermat = "+pas+"   temps = "+tf+" ms");
console.log("facteur trouve ? "+((f1*f2===N && f1!==1n && f1!==N)?"OUI -> CASSE":"non")+"   ("+(f1===p||f1===q?"= un vrai premier":"")+")");
console.log("--------------------------------------------------");
console.log("MARCHE car les 2 premiers sont PROCHES (b=(q-p)/2 petit). gen des premiers: "+tgen+" ms");
console.log("HONNETE : si les premiers sont bien ECARTES (aleatoires), Fermat explose ; il faut le crible");
console.log("  quadratique / NFS -> on recolte des relations et ON RESOUT un systeme lineaire mod 2 (meme esprit),");
console.log("  mais sous-exponentiel, PAS rapide. Un RSA-4096 bien genere tient. La ruse ne bat que la mauvaise cle.");
