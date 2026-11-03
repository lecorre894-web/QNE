








"use strict";
const mex=(b,e,m)=>{b%=m;let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;};
function isP(n){if(n<2n)return false;for(const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){if(n%a===0n)return n===a;}
 let d=n-1n,r=0n;while(d%2n===0n){d/=2n;r++;}
 for(const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){let x=mex(a,d,n);if(x===1n||x===n-1n)continue;let ok=false;
  for(let i=0n;i<r-1n;i++){x=x*x%n;if(x===n-1n){ok=true;break;}}if(!ok)return false;}return true;}
const nextP=(n)=>{n|=1n;while(!isP(n))n+=2n;return n;};
function isqrt(n){if(n<2n)return n;let x=n,y=(x+1n)>>1n;while(y<x){x=y;y=(x+n/x)>>1n;}return x;}
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){[a,b]=[b,a%b];}return a;};
const p=nextP(2n**128n+12345n), q=nextP(2n*p/3n), N=p*q;
const bNaif=(p>q?p-q:q-p)/2n;
console.log("MULTIPLICATEURS CONTRE LA PARADE DES PREMIERS ECARTES");
console.log("--------------------------------------------------");
console.log("N ~ "+N.toString(2).length+" bits, premiers en rapport ~3:2");
console.log("Fermat NAIF (k=1) : b=(p-q)/2 ~ 2^"+(bNaif.toString(2).length-1)+" pas  -> injouable");
console.log("--------------------------------------------------");
const CAP=5000;let gagne=null;
for(let k=1n;k<=40n && !gagne;k++){const M=k*N;let a=isqrt(M);if(a*a<M)a+=1n;
 for(let s=0;s<CAP;s++){const bb=a*a-M,b=isqrt(bb);if(b>=0n&&b*b===bb){const f=gcd(a-b,N);if(f>1n&&f<N){gagne={k,s,f};break;}}a+=1n;}}
if(gagne){console.log("multiplicateur k="+gagne.k+" ("+(gagne.k%2n===0n?"pair":"impair")+") -> trouve en "+(gagne.s+1)+" pas de Fermat");
 console.log("facteur = "+(gagne.f===p||gagne.f===q?"un vrai premier  -> CASSE":gagne.f.toString())+"   verif N%f=0 ? "+(N%gagne.f===0n?"oui":"non"));}
else console.log("aucun k<=40 n'a realigne (rapport non simple) -> il faudrait Lehman complet / NFS");
console.log("--------------------------------------------------");
console.log("HONNETE : ca bat la parade d'un RAPPORT SIMPLE (3:2, 5:3...). Mais des premiers VRAIMENT aleatoires");
console.log("  n'ont aucun petit rapport -> aucun petit k ne realigne -> retour a Lehman (N^1/3) puis NFS. 4096 bien fait tient.");
