








"use strict";
console.log("XOR DEVENU ARITHMETIQUE : une addition sans retenue");
console.log("--------------------------------------------------");
let okA=true;for(let t=0;t<100000;t++){const a=(Math.random()*1e6)|0,b=(Math.random()*1e6)|0;
 if(a+b!==(a^b)+2*(a&b))okA=false;if((a^b)!==a+b-2*(a&b))okA=false;}
console.log("[A] a+b = (a XOR b) + 2*(a AND b)  verifie sur 100000 cas ? "+(okA?"VRAI":"faux"));
console.log("    ex: 22 + 13 = 35 ; 22 XOR 13 = "+(22^13)+" ; retenue 2*(22 AND 13) = "+(2*(22&13))+" ; somme = "+((22^13)+2*(22&13)));
const sx=(a,b)=>a+b-2*a*b;let okB=true,lo=1,hi=0;
for(let t=0;t<100000;t++){const a=Math.random(),b=Math.random();const v=sx(a,b);if(v<lo)lo=v;if(v>hi)hi=v;}
for(const[a,b]of[[0,0],[0,1],[1,0],[1,1]])if(sx(a,b)!==(a^b))okB=false;
console.log("[B] continu sx(a,b)=a+b-2ab : exact aux coins ? "+(okB?"VRAI":"faux")+"  | reste dans ["+lo.toFixed(3)+", "+hi.toFixed(3)+"] -> STABLE");
const xorN=(b)=>b.reduce((a,c)=>a^c,0), pariteC=(b)=>{let p=1;for(const x of b)p*=(1-2*x);return (1-p)/2;};
const v=[1,0,1,1,0,1];console.log("[C] XOR de "+v.length+" bits "+JSON.stringify(v)+" = "+xorN(v)+" (somme mod 2) ; continu = "+pariteC(v).toFixed(2));
function addSansRetenue(a,b,base){let r=0n,p=1n,A=BigInt(a),B=BigInt(b),m=BigInt(base);while(A>0n||B>0n){r+=(((A%m)+(B%m))%m)*p;A/=m;B/=m;p*=m;}return r;}
console.log("[D] 'XOR' en base 10 (addition sans retenue) : 47 (+) 68 = "+addSansRetenue(47,68,10)+"  | en base 2 : 22 (+) 13 = "+addSansRetenue(22,13,2)+" = 22 XOR 13 = "+(22^13));
console.log("--------------------------------------------------");
console.log("MEME idee etendue aux POLYNOMES = addition sans retenue des coefficients = le GF(2) de toute notre crypto.");
console.log("=> une seule loi : XOR = somme sans retenue. Continu, a N entrees, en toute base, en polynomes. Malleable et extensible.");
