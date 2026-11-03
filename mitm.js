








"use strict";
const C=0x9E3779B1;
function minv(a){let x=a;for(let i=0;i<5;i++)x=Math.imul(x,(2-Math.imul(a,x))|0);return x>>>0;}
const Ci=minv(C);
const rotl=(x,r)=>(((x<<r)|(x>>>(32-r)))>>>0);
const perm=(x)=>rotl(Math.imul(x>>>0,C)>>>0,13);
const permInv=(y)=>Math.imul(rotl(y>>>0,19),Ci)>>>0;
const E=(k,x)=>perm((x^k)>>>0);
const D=(k,y)=>(permInv(y)^k)>>>0;
const B=16, KS=1<<B;
const k1=0xBEEF&(KS-1), k2=0xCAFE&(KS-1);
const P1=0x12345678, P2=0x0BADF00D;
const C1=E(k2,E(k1,P1)), C2=E(k2,E(k1,P2));
const t=process.hrtime.bigint();
const T=new Map();for(let a=0;a<KS;a++)T.set(E(a,P1),a);
let trouve=null,ops=KS;
for(let b2=0;b2<KS;b2++){ops++;const m=D(b2,C1);const a=T.get(m);
 if(a!==undefined && E(b2,E(a,P2))===C2){trouve=[a,b2];break;}}
const ms=Number(process.hrtime.bigint()-t)/1e6;
console.log("64x2 N'EST PAS 128 — rencontre au milieu (meet-in-the-middle)");
console.log("--------------------------------------------------");
console.log("vraies cles : k1=0x"+k1.toString(16)+"  k2=0x"+k2.toString(16));
console.log("retrouvees  : k1=0x"+trouve[0].toString(16)+"  k2=0x"+trouve[1].toString(16)+"   -> "+((trouve[0]===k1&&trouve[1]===k2)?"CASSE":"?"));
console.log("--------------------------------------------------");
console.log("force brute naive  : 2^(2x"+B+") = 2^"+(2*B)+" = "+Math.pow(2,2*B).toLocaleString("fr-FR")+" essais");
console.log("rencontre au milieu: ~"+ops.toLocaleString("fr-FR")+" ops (~2^"+(Math.log2(ops)).toFixed(1)+") + "+KS.toLocaleString("fr-FR")+" en memoire");
console.log("gain : securite reelle ~2^"+(B+1)+", PAS 2^"+(2*B)+". Doubler les tours ~double les bits, il ne les multiplie pas.");
console.log("=> 64x2 donne ~65 bits, pas 128. (C'est pourquoi le 2DES fut abandonne pour le 3DES.)");
