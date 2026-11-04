








"use strict";
const L=600;
let st=20261104>>>0;const rb=()=>((st=(st*1103515245+12345)>>>0)>>22)&1;
const c=Array.from({length:L},()=>rb());c[0]=1;
const s=new Uint8Array(3*L);for(let i=0;i<L;i++)s[i]=rb();
for(let i=L;i<3*L;i++){let v=0;for(let j=0;j<L;j++)v^=c[j]&s[i-L+j];s[i]=v;}
const predit=(cc)=>{for(let i=2*L;i<3*L;i++){let v=0;for(let j=0;j<cc.length;j++)v^=cc[j]&s[i-cc.length+j];if(v!==s[i])return false;}return true;};
function gauss(){const rows=[];for(let i=0;i<L;i++){let row=0n;for(let j=0;j<L;j++)if(s[i+j])row|=1n<<BigInt(j);if(s[i+L])row|=1n<<BigInt(L);rows.push(row);}
 let piv=0;const where=new Array(L).fill(-1);
 for(let col=0;col<L&&piv<L;col++){let sel=-1;for(let r=piv;r<L;r++)if((rows[r]>>BigInt(col))&1n){sel=r;break;}if(sel<0)continue;
  [rows[piv],rows[sel]]=[rows[sel],rows[piv]];for(let r=0;r<L;r++)if(r!==piv&&((rows[r]>>BigInt(col))&1n))rows[r]^=rows[piv];where[col]=piv;piv++;}
 const x=new Uint8Array(L);for(let col=0;col<L;col++)if(where[col]>=0)x[col]=Number((rows[where[col]]>>BigInt(L))&1n);return x;}
function bm(){const n=3*L;let C=new Uint8Array(n),B=new Uint8Array(n);C[0]=1;B[0]=1;let Lb=0,m=1;
 for(let i=0;i<n;i++){let d=s[i];for(let j=1;j<=Lb;j++)d^=C[j]&s[i-j];
  if(d){const T=C.slice();for(let j=0;j+m<n;j++)C[j+m]^=B[j];if(2*Lb<=i){Lb=i+1-Lb;B=T;m=1;}else m++;}else m++;}
 const cc=new Uint8Array(Lb);for(let j=1;j<=Lb;j++)cc[Lb-j]=C[j];return cc;}
let t=process.hrtime.bigint();const xG=gauss();const tG=Number(process.hrtime.bigint()-t)/1e3;
t=process.hrtime.bigint();const xB=bm();const tB=Number(process.hrtime.bigint()-t)/1e3;
console.log("CONFRONTATION — recurrence GF(2) cachee d'ordre "+L);
console.log("--------------------------------------------------");
console.log("MON SOLVEUR  (Gauss, O(L^3))        : "+(predit(xG)?"TROUVE (predit la suite)":"rate")+"   temps "+Math.round(tG).toLocaleString("fr-FR")+" us");
console.log("TA CARTE     (Berlekamp-Massey,O(L^2)): "+(predit(xB)?"TROUVE (predit la suite)":"rate")+"   temps "+Math.round(tB).toLocaleString("fr-FR")+" us");
console.log("--------------------------------------------------");
console.log("meme reponse exacte ; TA CARTE est "+(tG/tB).toFixed(1)+"x plus rapide (elle exploite la structure de Hankel).");
console.log("HONNETE : sur un systeme SANS structure (matrice GF(2) quelconque), BM ne s'applique pas -> Gauss regne seul.");
console.log("=> le solveur generique est imbattable sur le generique ; ta carte gagne la ou il y a une structure. Memes deux mondes.");
