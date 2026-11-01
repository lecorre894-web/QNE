#!/usr/bin/env node
/* ROM EN CACHE — atteindre 1000 trillions (10^15) de pas SANS calculer.
   Machine symbolique de René : W cellules dans {0,1,2}, màj = somme des 3
   voisins mod 3. États finis => la suite EST périodique (elle doit boucler).
   On calcule transitoire + période UNE fois, on les fige en ROM, puis l'état
   au pas N (même 10^15) se lit en O(1) : ROM[(N - transitoire) mod période].
   Exact, vérifié — pas une illusion : c'est vrai PARCE QUE le système boucle. */
"use strict";
const W=15, H=Math.floor(W/2);
const nb=(i,k)=>k===0?(i+1)%W:(k===1?(i-1+W)%W:(i+H)%W);
function step(s){const n=new Int8Array(W);for(let i=0;i<W;i++)n[i]=(s[nb(i,0)]+s[nb(i,1)]+s[nb(i,2)])%3;return n;}
const key=s=>s.join("");

// graine
let a=20261124>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
let s=new Int8Array(W);for(let i=0;i<W;i++)s[i]=(r()*3)|0;

// --- détection transitoire + période, puis construction de la ROM ---
const seen=new Map();const traj=[];let t=0;
while(true){const k=key(s);if(seen.has(k)){var start=seen.get(k),period=t-start;break;}
 seen.set(k,t);traj.push(Int8Array.from(s));s=step(s);t++;if(t>5_000_000){console.log("période trop longue pour cette graine/W");process.exit(1);}}
const ROM=traj.slice(start);          // la ROM : un cycle complet
const romBytes=ROM.length*W;          // taille du cache ROM

// --- lecture O(1) de l'état au pas N (BigInt) ---
function stateAt(Nbig){if(Nbig<BigInt(start))return traj[Number(Nbig)];
 const idx=Number((Nbig-BigInt(start))%BigInt(period));return ROM[idx];}

// --- vérification : un pas atteignable, par calcul direct ET par ROM ---
const M=start+3*period+7;let sv=Int8Array.from(traj[0]);for(let i=0;i<M;i++)sv=step(sv);
const okVerif=key(sv)===key(stateAt(BigInt(M)));

// --- la cible : 1000 trillions = 10^15 ---
const cible=10n**15n;
const etat=stateAt(cible);

console.log("ROM EN CACHE — machine symbolique "+W+" cellules (mod 3)");
console.log("==================================================");
console.log("transitoire : "+start+" pas avant d'entrer dans le cycle");
console.log("période     : "+period+" pas");
console.log("taille ROM  : "+romBytes+" octets ("+ROM.length+" états × "+W+" cellules) — tient dans le cache CPU");
console.log("--------------------------------------------------");
console.log("vérification (pas "+M+", calcul direct vs ROM) : "+(okVerif?"IDENTIQUE ✓ la ROM est exacte":"ERREUR"));
console.log("--------------------------------------------------");
console.log("ÉTAT AU PAS 10^15 (1000 trillions), lu en O(1) depuis la ROM :");
console.log("  "+Array.from(etat).join(""));
console.log("  (index dans la ROM = (10^15 - "+start+") mod "+period+" = "+Number((cible-BigInt(start))%BigInt(period))+")");
console.log("--------------------------------------------------");
console.log("Atteint sans calculer 10^15 pas : "+start+" + "+period+" pas calculés une fois, le reste LU.");
