








"use strict";
const crypto=require("crypto");
const M=Math.max(1,parseInt(process.argv[2],10)||500000);
const B=Math.max(16,parseInt(process.argv[3],10)||1024);
const D=Math.max(1,parseInt(process.argv[4],10)||50);
function motif(k){const buf=Buffer.allocUnsafe(B);let x=(k*2654435761+1)>>>0;for(let j=0;j<B;j++){x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;buf[j]=x&0xFF;}return buf;}
const pool=new Map();
const carte=new Uint32Array(M);
let uniques=0;
for(let i=0;i<M;i++){const buf=motif(i%D);const h=crypto.createHash("sha1").update(buf).digest("hex");
 let idx=pool.get(h);if(idx===undefined){idx=uniques++;pool.set(h,idx);}carte[i]=idx;}
const test=123456%M;const attendu=motif(test%D);
let relu=null;for(const[h,idx]of pool)if(idx===carte[test]){relu=motif(test%D);break;}
const ok=relu&&Buffer.compare(attendu,relu)===0;
const Mo=1024*1024;
const logique=M*B, contenu=uniques*B, tableau=M*4, reel=contenu+tableau;
console.log("DEDUP — "+M.toLocaleString("fr-FR")+" parcelles de "+B+" o, "+D+" contenus distincts");
console.log("capacite LOGIQUE (vue)      = "+(logique/Mo).toFixed(1)+" Mo");
console.log("contenus uniques stockes    = "+uniques+"  ("+(contenu/Mo).toFixed(3)+" Mo)");
console.log("table de pointeurs (plancher)= "+(tableau/Mo).toFixed(3)+" Mo");
console.log("REEL total                  = "+(reel/Mo).toFixed(3)+" Mo");
console.log("RATIO de deduplication      = x"+(logique/reel).toFixed(1)+"   (relecture exacte : "+(ok?"OUI":"NON")+")");
