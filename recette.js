








"use strict";
const C=0x9E3779B1;
function minv(a){let x=a;for(let i=0;i<5;i++)x=Math.imul(x,(2-Math.imul(a,x))|0);return x>>>0;}
const Ci=minv(C),rotl=(x,r)=>(((x<<r)|(x>>>(32-r)))>>>0);
const perm=(x)=>rotl(Math.imul(x>>>0,C)>>>0,13),permInv=(y)=>Math.imul(rotl(y>>>0,19),Ci)>>>0;
const E=(k,x)=>perm((x^k)>>>0),D=(k,y)=>(permInv(y)^k)>>>0;
const E3=(a,b,c,x)=>E(c,E(b,E(a,x)));
console.log("=========== RECETTES POUR UNE VRAIE SECURITE DE 128 PUIS 256 BITS ===========");
console.log("\nCHIFFREMENT (resistance a la recherche de cle) :");
console.log("  etages x bits   ->  securite reelle");
for(const [n,b] of [[1,128],[2,64],[3,64],[1,256],[3,128]]){
 const reel = n===1?b : (n===2?b+1 : 2*b);
 console.log("  "+n+" x "+String(b).padStart(3)+" bits    ->  ~2^"+reel+(n===2?"  (rencontre au milieu : piege)":""));}
console.log("  CONCLUSION  128 reels : 1x128  OU  3x64     |   256 reels : 1x256  OU  3x128");
console.log("\nHACHAGE (resistance aux collisions, loi des anniversaires -> sortie = 2x securite) :");
console.log("  sortie 256 bits -> 128 bits de securite (SHA-256)");
console.log("  sortie 512 bits -> 256 bits de securite (SHA-512)");
console.log("\n--- PREUVE : la rencontre au milieu simple (qui cassait x2) ECHOUE sur x3 ---");
const B=16,KS=1<<B,k1=0xBEEF,k2=0x1234,k3=0xCAFE,P1=0x12345678,P2=0x0BADF00D;
const C1=E3(k1,k2,k3,P1),C2=E3(k1,k2,k3,P2);
const T=new Map();for(let a=0;a<KS;a++)T.set(E(a,P1),a);
let confirmes=0;
for(let c=0;c<KS;c++){const m=D(c,C1);const a=T.get(m);if(a!==undefined && E(c,E(a,P2))===C2)confirmes++;}
console.log("  cles confirmees par la rencontre simple a 2 etages : "+confirmes+"  -> "+(confirmes===0?"RESISTE (il faut 2^2b=2^"+(2*B)+", pas 2^"+(B+1)+")":"faille"));
console.log("  => empiler un 3e etage DOUBLE les bits : c'est le bon multiple.");
console.log("=============================================================================");
