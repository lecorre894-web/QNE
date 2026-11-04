








"use strict";
const NOT=a=>1-a, AND=(a,b)=>a*b, OR=(a,b)=>a+b-a*b, XOR=(a,b)=>a+b-2*a*b;
let ok=true;const T=[[0,0],[0,1],[1,0],[1,1]];
for(const [a,b] of T){if(AND(a,b)!==(a&&b?1:0))ok=false;if(OR(a,b)!==(a||b?1:0))ok=false;if(XOR(a,b)!==((a^b)))ok=false;}
console.log("BITS CONTINUS ET CONTRIBUTIFS");
console.log("--------------------------------------------------");
console.log("portes continues = logique dure aux coins {0,1} ? "+(ok?"VRAI (exact)":"faux"));
console.log("  entre les deux, graduE : XOR(0.7,0.2)="+XOR(0.7,0.2).toFixed(2)+"   AND(0.6,0.9)="+AND(0.6,0.9).toFixed(2)+"   OR(0.3,0.4)="+OR(0.3,0.4).toFixed(2));
console.log("--------------------------------------------------");
const parite=(b)=>{let pr=1;for(const x of b)pr*=(1-2*x);return (1-pr)/2;};
let exact=true;for(let t=0;t<6;t++){const b=Array.from({length:8},()=>Math.random()<0.5?1:0);const dur=b.reduce((a,c)=>a^c,0);if(Math.abs(parite(b)-dur)>1e-9)exact=false;}
console.log("parite continue = XOR dur sur 8 bits (test) ? "+(exact?"VRAI":"faux"));
const b=[0.9,0.2,0.5,0.7];
const contrib=b.map((_,j)=>{let pr=1;for(let i=0;i<b.length;i++)if(i!==j)pr*=(1-2*b[i]);return pr;});
console.log("--------------------------------------------------");
console.log("entree graduee b = ["+b.join(", ")+"]   parite = "+parite(b).toFixed(4));
console.log("CONTRIBUTION de chaque bit (sa pente sur la sortie) :");
b.forEach((x,j)=>console.log("  bit"+j+" ("+x+") -> contribue "+contrib[j].toFixed(4)+(Math.abs(contrib[j])===Math.max(...contrib.map(Math.abs))?"  <- le plus influent":"")));
console.log("--------------------------------------------------");
console.log("le bit a 0.5 annule la contribution des autres (1-2*0.5=0) : un bit 'indecis' aveugle le circuit.");
console.log("=> le continu donne ce que le dur n'a pas : QUI pousse, et de combien. Les bits deviennent derivables.");
