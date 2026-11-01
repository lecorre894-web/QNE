#!/usr/bin/env node
/* ROM ÉTENDUE — jusqu'où peut-on étendre la ROM en mémoire ?
   On augmente W (cellules). Période détectée par Brent (mémoire O(1)).
   On reporte période, taille ROM, et l'étage mémoire où elle tient. */
"use strict";
const CAP=30_000_000;                 // plafond de pas pour la détection (temps)
function mk(W){const H=Math.floor(W/2);
 const nb=(i,k)=>k===0?(i+1)%W:(k===1?(i-1+W)%W:(i+H)%W);
 return s=>{const n=new Int8Array(W);for(let i=0;i<W;i++)n[i]=(s[nb(i,0)]+s[nb(i,1)]+s[nb(i,2)])%3;return n;};}
const key=s=>s.join("");
function seed(W){let a=(20261124+W*7919)>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};const s=new Int8Array(W);for(let i=0;i<W;i++)s[i]=(r()*3)|0;return s;}
// Brent : trouve période (lam) et transitoire (mu), mémoire O(1)
function brent(step,x0){let power=1,lam=1,tort=x0,hare=step(x0),n=0;
 while(key(tort)!==key(hare)){if(power===lam){tort=hare;power*=2;lam=0;}hare=step(hare);lam++;n++;if(n>CAP)return null;}
 let mu=0;tort=x0;hare=x0;for(let i=0;i<lam;i++)hare=step(hare);
 while(key(tort)!==key(hare)){tort=step(tort);hare=step(hare);mu++;if(mu>CAP)return null;}
 return {lam,mu};}
function tier(bytes){if(bytes<32e6)return "cache/petit (≤32 Mo)";if(bytes<64e9)return "RAM étendue (≤64 Go, ta tour)";if(bytes<8e12)return "disque NVMe (≤8 To)";return "AU-DELÀ du stockage mondial";}

console.log("ROM ÉTENDUE — période et taille selon la taille du système");
console.log("==================================================");
for(const W of [9,12,15,18,21,24,27,30,36,42,48]){
 const step=mk(W),res=brent(step,seed(W));
 if(!res){console.log("W="+String(W).padStart(2)+"  période > "+CAP.toLocaleString("fr-FR")+" (trop longue à détecter ici)");continue;}
 const bytes=res.lam*W;
 console.log("W="+String(W).padStart(2)+"  transitoire="+String(res.mu).padStart(7)+"  période="+String(res.lam).padStart(10)+"  ROM="+(bytes<1e6?(bytes+" o"):bytes<1e9?(bytes/1e6).toFixed(1)+" Mo":(bytes/1e9).toFixed(2)+" Go").padStart(9)+"  → "+tier(bytes));
}
console.log("--------------------------------------------------");
console.log("Tant que la ROM tient dans un étage (cache→RAM→disque), le pas 10^N se LIT en O(1).");
console.log("Quand la période dépasse le stockage, il faut revenir au calcul : c'est la vraie frontière.");
