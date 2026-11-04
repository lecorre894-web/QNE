








"use strict";
const pair   =(f)=>(x)=>(f(x)+f(-x))/2;
const impair =(f)=>(x)=>(f(x)-f(-x))/2;
const f=(x)=>Math.exp(x);
const P=pair(f), I=impair(f);
const estPair  =(g)=>Math.abs(g(1.3)-g(-1.3))<1e-9;
const estImpair=(g)=>Math.abs(g(1.3)+g(-1.3))<1e-9;
console.log("FORMULE DE PARITE");
console.log("--------------------------------------------------");
console.log("[1] f = exp :  P = (f(x)+f(-x))/2 ,  I = (f(x)-f(-x))/2");
console.log("    P(1) = "+P(1).toFixed(6)+"  (cosh 1 = "+Math.cosh(1).toFixed(6)+")   P pair ? "+estPair(P));
console.log("    I(1) = "+I(1).toFixed(6)+"  (sinh 1 = "+Math.sinh(1).toFixed(6)+")   I impair ? "+estImpair(I));
console.log("    P + I = f ? "+(Math.abs(P(0.7)+I(0.7)-f(0.7))<1e-9?"VRAI":"faux"));
const integ=(g,a,b,n=20000)=>{const h=(b-a)/n;let s=g(a)+g(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*g(a+i*h);return s*h/3;};
const g=(x)=>x*x*x+2*x*x+5*x+3;
console.log("[gain] \u222b_-2..2 (x^3+2x^2+5x+3) : direct = "+integ(g,-2,2).toFixed(4)+"  |  2*\u222b_0..2 part paire = "+(2*integ(pair(g),0,2)).toFixed(4)+"  (l'impair s'annule)");
console.log("--------------------------------------------------");
const a=[10,11,12,13,14,15,16,17];
const pairs=a.filter((_,i)=>i%2===0), impairs=a.filter((_,i)=>i%2===1);
const recompose=[];for(let i=0;i<pairs.length;i++){recompose.push(pairs[i]);recompose.push(impairs[i]);}
console.log("[2] suite "+JSON.stringify(a));
console.log("    indices PAIRS   -> "+JSON.stringify(pairs));
console.log("    indices IMPAIRS -> "+JSON.stringify(impairs));
console.log("    recombinaison exacte ? "+(JSON.stringify(recompose)===JSON.stringify(a)?"VRAI":"faux")+"   (c'est le papillon de la FFT : O(n^2) -> O(n log n))");
console.log("--------------------------------------------------");
console.log("une formule, deux tranchants : couper une fonction en pair/impair, couper une suite en indices pair/impair.");
