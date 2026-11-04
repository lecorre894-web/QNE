#!/usr/bin/env node
"use strict";
const base=BigInt(process.argv[2]||8);
const levels=parseInt(process.argv[3]||4,10);
let n=1n;for(let i=0;i<levels;i++)n*=base;
const s=n.toString();
console.log("cascade "+base+"^"+levels+" (workers effectifs)");
console.log("--------------------------------------------------");
console.log("valeur exacte : "+s);
console.log("nb de chiffres: "+s.length);
console.log("≈ "+s[0]+(s.length>1?"."+s.slice(1,4):"")+" × 10^"+(s.length-1));
