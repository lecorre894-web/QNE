#!/usr/bin/env node
"use strict";
const W=15,H=Math.floor(W/2);
const nb=(i,k)=>k===0?(i+1)%W:(k===1?(i-1+W)%W:(i+H)%W);
function step(s){const n=new Int8Array(W);for(let i=0;i<W;i++)n[i]=(s[nb(i,0)]+s[nb(i,1)]+s[nb(i,2)])%3;return n;}
const key=s=>s.join("");
let a=20261124>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
let s=new Int8Array(W);for(let i=0;i<W;i++)s[i]=(r()*3)|0;
const seen=new Map(),traj=[];let t=0,start=0,period=0;
while(true){const k=key(s);if(seen.has(k)){start=seen.get(k);period=t-start;break;}seen.set(k,t);traj.push(Int8Array.from(s));s=step(s);t++;}
const ROM=traj.slice(start);
function stateAt(N){if(N<BigInt(start))return traj[Number(N)];return ROM[Number((N-BigInt(start))%BigInt(period))];}
const M=start+3*period+7;let sv=Int8Array.from(traj[0]);for(let i=0;i<M;i++)sv=step(sv);
console.log("transitoire="+start+" periode="+period+" ROM="+(ROM.length*W)+" octets");
console.log("verif pas "+M+" : "+(key(sv)===key(stateAt(BigInt(M)))?"EXACT":"ERREUR"));
const N=process.argv[2]?BigInt(process.argv[2]):10n**15n;
console.log("etat au pas "+N+" = "+Array.from(stateAt(N)).join(""));
