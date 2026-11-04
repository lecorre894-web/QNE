'use strict';
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const file=path.resolve(process.argv[2]||'');const method=process.argv[3];const args=JSON.parse(process.argv[4]||'[]');
 if(!Array.isArray(args))throw Error('Argument JSON attendu: tableau');
 const originalLog=console.log,originalWarn=console.warn,originalInfo=console.info;
 console.log=(...xs)=>process.stderr.write(xs.map(String).join(' ')+'\n');
 console.warn=console.info=console.log;
 try{
  let exports;const code=fs.readFileSync(file,'utf8');
  if(/\bmodule\.exports\b|\bexports\.[\w$]+/.test(code))exports=require(file);
  else exports=await import(pathToFileURL(file).href);
  const fn=exports?.[method];if(typeof fn!=='function')throw Error('Export non disponible : '+method);
  const value=await fn(...args);
  process.stdout.write(JSON.stringify({ok:true,value:value===undefined?null:value},(_,v)=>typeof v==='bigint'?{'__bigint__':v.toString()}:v)+'\n');
 }finally{console.log=originalLog;console.warn=originalWarn;console.info=originalInfo;}
})().catch(e=>{process.stderr.write('QNE_V11_ERREUR: '+e.message+'\n');process.exitCode=1;});
