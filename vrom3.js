








"use strict";
const fs=require("fs");
const GO=Math.max(1,parseFloat(process.argv[2])||21000);
const SIZE=Math.round(GO*1024*1024*1024);
const CAPGO=process.argv[3]?parseFloat(process.argv[3]):null;
const BASE=process.argv[4]||"vr";
function gen(addr){let x=(addr^0x9E3779B9)>>>0;x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;return x&0xFF;}
function sonde(cap){const p=BASE+"_probe.bin";const fd=fs.openSync(p,"w");let lo=1,hi=cap,ok=1;
 while(lo<=hi){const mid=Math.floor(lo+(hi-lo)/2);try{fs.ftruncateSync(fd,mid);ok=mid;lo=mid+1;}catch(e){if(e.code==="EFBIG")hi=mid-1;else{fs.closeSync(fd);fs.unlinkSync(p);throw e;}}}
 fs.closeSync(fd);fs.unlinkSync(p);return ok;}
const capProbe=CAPGO?Math.round(CAPGO*1024*1024*1024):SIZE;
const maxf=sonde(capProbe);
const shard=Math.min(maxf,SIZE),nSh=Math.ceil(SIZE/shard);
const fds=[];for(let k=0;k<nSh;k++){const sz=Math.min(shard,SIZE-k*shard);const f=BASE+"_"+k+".bin";if(!fs.existsSync(f))fs.closeSync(fs.openSync(f,"w"));const fd=fs.openSync(f,"r+");fs.ftruncateSync(fd,sz);fds.push({fd,f});}
function route(addr){return {fd:fds[Math.floor(addr/shard)].fd,off:addr%shard};}
function poke(addr,b){const r=route(addr);fs.writeSync(r.fd,Buffer.from([b&0xFF]),0,1,r.off);}
function peek(addr){const r=route(addr),buf=Buffer.alloc(1);fs.readSync(r.fd,buf,0,1,r.off);return buf[0];}
let reel=0;for(const o of fds)reel+=fs.statSync(o.f).blocks*512;
let libre=0;try{const sf=fs.statfsSync(".");libre=sf.bavail*sf.bsize;}catch(e){}
const Go=1024*1024*1024;
console.log("VROM3 — memoire virtuelle de "+GO.toLocaleString("fr-FR")+" Go  ("+(GO/7000).toFixed(1)+" x le socle 7 To)");
console.log("max par fichier (f2fs)      = "+(maxf/Go).toFixed(0)+" Go");
console.log("shards                      = "+nSh+"  ("+(shard/Go).toFixed(0)+" Go chacun)");
console.log("----- VIRTUEL (ce que le systeme croit) -----");
console.log("capacite LOGIQUE            = "+SIZE.toLocaleString("fr-FR")+" octets = "+(SIZE/Go/1024).toFixed(2)+" To");
console.log("----- REEL (le vrai plancher) -----");
console.log("deja pris sur le disque     = "+reel.toLocaleString("fr-FR")+" octets");
console.log("disque PHYSIQUE encore libre= "+(libre/Go).toFixed(1)+" Go  <= plafond reel si tu ecris pour de vrai");
console.log("--------------------------------------------------");
const coins=[1000,Math.floor(SIZE/2),SIZE-1000];
for(const a of coins)poke(a,0xC3);
for(const a of coins)console.log("  adr "+a.toLocaleString("fr-FR")+"  (shard "+Math.floor(a/shard)+")  relu 0x"+peek(a).toString(16).toUpperCase());
let reel2=0;for(const o of fds)reel2+=fs.statSync(o.f).blocks*512;
console.log("disque reel apres 3 ecritures = "+reel2.toLocaleString("fr-FR")+" octets");
for(const o of fds)fs.closeSync(o.fd);
