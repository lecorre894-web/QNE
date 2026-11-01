"use strict";
const fs=require("fs");
// ROM LFSR écrite en FLUX sur disque (jamais tout en RAM). Démonstration W=28.
const W=28, mask=0x9000000>>>0;      // taps {28,25} -> polynôme primitif
const start=1>>>0;
const path="rom28.bin";
const CHUNK=1<<22;                   // 4 Mi registres par écriture (16 Mo)
const buf=Buffer.allocUnsafe(CHUNK*4);
const view=new Uint32Array(buf.buffer,buf.byteOffset,CHUNK);
const fd=fs.openSync(path,"w");
const t0=process.hrtime.bigint();
let s=start, period=0, fill=0;
do{
  view[fill++]=s;
  if(fill===CHUNK){fs.writeSync(fd,buf,0,fill*4);fill=0;}
  const lsb=s&1; s>>=1; if(lsb)s^=mask; period++;
}while(s!==start);
if(fill)fs.writeSync(fd,buf,0,fill*4);
fs.closeSync(fd);
const sec=Number(process.hrtime.bigint()-t0)/1e9;
const bytes=period*4;
const maximal = period===((1<<W)>>>0)-1;
// vérif : pas direct M vs lecture disque
const M=123456789; let sv=start; for(let i=0;i<M%period;i++){const l=sv&1;sv>>=1;if(l)sv^=mask;}
const rf=fs.openSync(path,"r"); const b4=Buffer.allocUnsafe(4);
fs.readSync(rf,b4,0,4,(M%period)*4); const okV = b4.readUInt32LE(0)===sv;
// lecture O(1) au pas 10^15
const N=10n**15n, idx=Number(N%BigInt(period));
fs.readSync(rf,b4,0,4,idx*4); const etat=b4.readUInt32LE(0);
fs.closeSync(rf);
console.log("ROM disque W="+W+"  periode="+period.toLocaleString("fr-FR")+(maximal?" (MAXIMALE)":" (non max)"));
console.log("fichier "+path+" = "+(bytes/1e6).toFixed(0)+" Mo, ecrit en "+sec.toFixed(1)+" s ("+(period/sec/1e6).toFixed(0)+" M pas/s)");
console.log("verif pas "+M+" (direct vs disque) : "+(okV?"EXACT":"ERREUR"));
console.log("etat au pas 10^15 lu en O(1) sur disque = registre "+etat+" (index "+idx+")");
