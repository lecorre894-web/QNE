'use strict';
// Adaptive selection based on data structure and real task, not on declared logical size.
const crypto=require('node:crypto');const {read,size,xorAll,sha,nat,hex}=require('./reconstruct');
function choose(descriptor,operation,{offset=0n,length=0,allowNetwork=false,calibration=null}={}){
 const n=size(descriptor),off=nat(offset);
 if(operation==='xor_all'){
  if(n%16n)throw Error('XOR par cellules de 16 octets uniquement');
  return {operation,engine:descriptor.kind==='gf128'?'QNE-V2-GF128-algebraic':'QNE-V15-exact-composition',classes:1,
   reason:'Plusieurs paliers logiques ne garantissent pas un gain de temps ; reference algébrique directe retenue'};
 }
 if(!['read','verify'].includes(operation))throw Error('Operation inconnue');
 if(!Number.isSafeInteger(length)||length<0||length>131072||off+BigInt(length)>n)throw Error('Longueur/offset hors limites');
 if(operation==='verify'&&allowNetwork&&length>=8192)return {operation,engine:'V14-workers-sha256-base64',reason:'Verification de fenetre bornee ; workers existants ; pas de script arbitraire'};
 return {operation,engine:'QNE-V15-read-local',reason:'Lecture locale compacte pour eviter le cout des messages et des travailleurs'};
}
class Memo{
 constructor(maxBytes=262144){this.maxBytes=maxBytes;this.entries=new Map();this.bytes=0;this.hits=0;this.misses=0;}
 _key(desc,off,len){return sha(Buffer.from(JSON.stringify(desc)+'|'+off+'|'+len));}
 get(desc,off,len){const key=this._key(desc,off,len),hit=this.entries.get(key);if(hit){this.hits++;this.entries.delete(key);this.entries.set(key,hit);return Buffer.from(hit);}this.misses++;const b=read(desc,off,len);
  if(b.length<=this.maxBytes){while(this.bytes+b.length>this.maxBytes&&this.entries.size){const first=this.entries.keys().next().value;this.bytes-=this.entries.get(first).length;this.entries.delete(first);}this.entries.set(key,Buffer.from(b));this.bytes+=b.length;}
  return b;
 }
 stats(){return {entries:this.entries.size,bytes:this.bytes,hits:this.hits,misses:this.misses,max_bytes:this.maxBytes};}
}
function runLocal(descriptor,operation,opts={}){const plan=choose(descriptor,operation,opts);
 if(operation==='xor_all')return {plan,value:hex(xorAll(descriptor))};
 if(plan.engine!=='QNE-V15-read-local')throw Error('Plan distant : utiliser le pont V14');
 const bytes=read(descriptor,opts.offset??0n,opts.length??0);
 return {plan,value_base64:bytes.toString('base64'),sha256:sha(bytes)};
}
module.exports={choose,Memo,runLocal};
