








"use strict";
const fs=require("fs");
const GO=Math.max(1,parseFloat(process.argv[2])||7000);
const SIZE=Math.round(GO*1024*1024*1024);
const FICH=process.argv[3]||"vrom.bin";
function gen(addr){let x=(addr^0x9E3779B9)>>>0;x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;return x&0xFF;}
if(!fs.existsSync(FICH)){const fd=fs.openSync(FICH,"w");fs.ftruncateSync(fd,SIZE);fs.closeSync(fd);}
const fd=fs.openSync(FICH,"r+");
function poke(addr,byte){fs.writeSync(fd,Buffer.from([byte&0xFF]),0,1,addr);}
function peek(addr){const r=Buffer.alloc(1);fs.readSync(fd,r,0,1,addr);return r[0];}
function peekG(addr){const v=peek(addr);return v!==0?v:gen(addr);}
const st=fs.statSync(FICH),reel=st.blocks*512;
console.log("VROM — memoire virtuelle de "+GO.toLocaleString("fr-FR")+" Go");
console.log("taille LOGIQUE (ce que le systeme croit) = "+SIZE.toLocaleString("fr-FR")+" octets");
console.log("taille REELLE sur le disque               = "+reel.toLocaleString("fr-FR")+" octets");
console.log("--------------------------------------------------");
const coins=[1000,Math.floor(SIZE/2),SIZE-1000];
for(const a of coins)poke(a,0xC3);
console.log("ecrit 0xC3 a 3 adresses (debut / milieu / fin de 7 To) :");
for(const a of coins)console.log("  adr "+a.toLocaleString("fr-FR")+"  relu 0x"+peek(a).toString(16).toUpperCase());
console.log("adresse jamais ecrite, mode QNE (valeur calculee) :");
for(const a of [42,123456789,5000000000000])console.log("  adr "+a.toLocaleString("fr-FR")+"  -> "+peekG(a));
const st2=fs.statSync(FICH);
console.log("--------------------------------------------------");
console.log("disque reel apres 3 ecritures = "+(st2.blocks*512).toLocaleString("fr-FR")+" octets");
fs.closeSync(fd);
