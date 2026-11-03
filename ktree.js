








"use strict";
function H(x){x>>>=0;x^=x>>>16;x=Math.imul(x,0x85ebca6b)>>>0;x^=x>>>13;x=Math.imul(x,0xc2b2ae35)>>>0;x^=x>>>16;return x>>>0;}
const n=30, tiers=10;
const LOW=(1<<tiers)-1, L=1<<tiers;
let ops=0;
const mk=(salt)=>{const a=[];for(let j=0;j<L;j++){const s=(j*2654435761+salt)>>>0;a.push({s,v:H(s)});ops++;}return a;};
const L1=mk(0x11111111),L2=mk(0x22222222),L3=mk(0x33333333),L4=mk(0x44444444);
function fus(A,B,shift){const m=new Map();for(const a of A){const k=(a.v>>>shift)&LOW;(m.get(k)||m.set(k,[]).get(k)).push(a);ops++;}
 const out=[];for(const b of B){const k=(b.v>>>shift)&LOW;const arr=m.get(k);ops++;if(arr)for(const a of arr){out.push({s:[...(a.s.push?a.s:[a.s]),...(b.s.push?b.s:[b.s])],v:(a.v^b.v)>>>0});}}return out;}
const L12=fus(L1,L2,0), L34=fus(L3,L4,0);
const sol=[];const m=new Map();for(const x of L12){const k=(x.v>>>tiers)&LOW;(m.get(k)||m.set(k,[]).get(k)).push(x);ops++;}
for(const y of L34){const k=(y.v>>>tiers)&LOW;const arr=m.get(k);ops++;if(arr)for(const x of arr){if(((x.v^y.v)&((1<<n)-1))===0)sol.push([x,y]);}}
console.log("JOKER — attaque PAR PALIERS (arbre de fusion)");
console.log("--------------------------------------------------");
console.log("cible : 4 graines dont H(a)^H(b)^H(c)^H(d) = 0 sur "+n+" bits");
if(sol.length){const [x,y]=sol[0];const gs=[...x.s,...y.s];const x4=gs.map(H);const xr=x4.reduce((p,c)=>p^c,0)>>>0;
 console.log("TROUVE : graines "+gs.map(g=>"0x"+g.toString(16)).join(" "));
 console.log("verif  : H^H^H^H sur "+n+" bits = "+((xr&((1<<n)-1))===0?"0  -> VRAI":"NON"));
}else console.log("pas de solution dans cet echantillon (relancer avec listes plus grandes)");
console.log("--------------------------------------------------");
console.log("operations par paliers = "+ops.toLocaleString("fr-FR")+"   (~2^"+Math.log2(ops).toFixed(1)+")");
console.log("force brute a plat      = 2^"+n+" = "+Math.pow(2,n).toLocaleString("fr-FR"));
console.log("anniversaire simple     = 2^"+(n/2)+" = "+Math.pow(2,n/2).toLocaleString("fr-FR"));
console.log("=> les paliers cassent l'exposant : n -> n/3. Plus de branches = coupe plus profonde.");
