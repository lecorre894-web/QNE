








"use strict";
const POLY=0x87n,M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powx(N){let res=1n,base=2n;while(N>0n){if(N&1n)res=mul(res,base);base=mul(base,base);N>>=1n;}return res;}
const toR=(v)=>new Uint32Array([Number(v&0xffffffffn),Number((v>>32n)&0xffffffffn),Number((v>>64n)&0xffffffffn),Number((v>>96n)&0xffffffffn)]);
const mulx=(R)=>{const c=R[3]>>>31;R[3]=((R[3]<<1)|(R[2]>>>31))>>>0;R[2]=((R[2]<<1)|(R[1]>>>31))>>>0;R[1]=((R[1]<<1)|(R[0]>>>31))>>>0;R[0]=((R[0]<<1)^(c?0x87:0))>>>0;};
const CLE=[0xA111n,0xB222n,0xC333n,0xD444n,0xE555n,0xF666n,0x1777n,0x2888n].map((s,i)=>powx((s<<16n)+BigInt(i*2654435761)+1n));
const lanes=CLE.map(toR);
function fluxOctet(){let o=0;for(const L of lanes)o^=(L[0]&0xFF);for(const L of lanes)mulx(L);return o&0xFF;}
const NB=6000,s=[];for(let i=0;i<NB/8;i++){const o=fluxOctet();for(let b=7;b>=0;b--)s.push((o>>b)&1);}
function bm(s){const n=s.length;let C=new Array(n).fill(0),B=new Array(n).fill(0);C[0]=1;B[0]=1;let L=0,m=1;
 for(let i=0;i<n;i++){let d=s[i];for(let j=1;j<=L;j++)d^=C[j]&s[i-j];
  if(d){const T=C.slice();for(let j=0;j+m<n;j++)C[j+m]^=B[j];if(2*L<=i){L=i+1-L;B=T;m=1;}else m++;}else m++;}
 return {C,L};}
const {C,L}=bm(s);
let erreurs=0;for(let i=L;i<s.length;i++){let p=0;for(let j=1;j<=L;j++)p^=C[j]&s[i-j];if(p!==s[i])erreurs++;}
console.log("CASSE DU 'CHIFFRE INVIOLABLE' PAR LINEARITE (Berlekamp-Massey)");
console.log("--------------------------------------------------");
console.log("complexite lineaire trouvee L = "+L+" bits  (l'etat utile, pas 1024 au hasard)");
console.log("bits de flot connus necessaires = "+(2*L)+" bits = "+Math.ceil(2*L/8)+" octets");
console.log("prediction du reste ("+(s.length-L)+" bits) : "+erreurs+" erreur(s)  -> "+(erreurs===0?"TOUT PREDIT = CASSE":"resiste"));
console.log("--------------------------------------------------");
console.log("cout : resoudre ~"+L+" equations lineaires = instantane, PAS 2^512.");
console.log("LECON : la taille de l'etat ne protege RIEN si c'est lineaire. Seule la NON-LINEARITE protege.");
console.log("=> tu avais raison : -1/+1, charger les equations, resoudre. Le mur n'etait qu'un decor.");
