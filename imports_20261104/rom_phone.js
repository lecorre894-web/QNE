








"use strict";const fs=require("fs");
const W=parseInt(process.argv[2]||"30",10);
const M={28:0x9000000,29:0x10000002,30:0x20000029,31:0x40000004,32:0x80200003};
if(!M[W]){console.log("W doit etre 28..32");process.exit(1);}
const mask=M[W]>>>0,start=1>>>0,MAX=2**W-1,path="rom"+W+".bin";
const CH=1<<22,buf=Buffer.allocUnsafe(CH*4),view=new Uint32Array(buf.buffer,buf.byteOffset,CH);
const fd=fs.openSync(path,"w"),t0=Date.now();let s=start,period=0,fill=0;
do{view[fill++]=s;if(fill===CH){fs.writeSync(fd,buf,0,fill*4);fill=0;}const l=s&1;s=s>>>1;if(l)s=(s^mask)>>>0;period++;}while(s!==start&&period<=MAX);
if(fill)fs.writeSync(fd,buf,0,fill*4);fs.closeSync(fd);
const sec=(Date.now()-t0)/1e3;
const rf=fs.openSync(path,"r"),b=Buffer.allocUnsafe(4);
let M2=123456789,sv=start;for(let i=0;i<M2%period;i++){const l=sv&1;sv=sv>>>1;if(l)sv=(sv^mask)>>>0;}
fs.readSync(rf,b,0,4,(M2%period)*4);const ok=b.readUInt32LE(0)===sv;
const idx=Number(10n**15n%BigInt(period));fs.readSync(rf,b,0,4,idx*4);const e=b.readUInt32LE(0);fs.closeSync(rf);
console.log("W="+W+" periode="+period.toLocaleString("fr-FR")+(period===MAX?" (MAXIMALE)":" (non max)"));
console.log("fichier "+path+" = "+(period*4/1e6).toFixed(0)+" Mo en "+sec.toFixed(1)+" s");
console.log("verif disque: "+(ok?"EXACT":"ERREUR")+" | pas 10^15 = registre "+e+" (index "+idx+")");
