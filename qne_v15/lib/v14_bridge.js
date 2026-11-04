'use strict';
// Uses the unmodified V14 HTTP API and its allowlisted qne.sha256 workers.
// Hashes base64-encoded QNE chunks: no arbitrary scripts run on workers.
// This step verifies bounded reconstructed windows, NOT the huge symbolic space.
const crypto=require('node:crypto');
const {read,size,sha,nat}=require('./reconstruct');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function verifyV14(descriptor,{offset=0n,length=32768,chunkBytes=8192,timeoutMs=25000}={}){
 if(!Number.isSafeInteger(length)||length<1||length>131072)throw Error('Fenetre V14 1..131072 octets');
 if(!Number.isInteger(chunkBytes)||chunkBytes<4097||chunkBytes>16384)throw Error('Bloc V14 de 4097 a 16384 octets (hors chemin rapide)');
 const start=nat(offset);if(start+BigInt(length)>size(descriptor))throw Error('Fenetre hors espace logique');
 if(!process.env.QNE_V12_URL)process.env.QNE_V12_URL='http://127.0.0.1:17859';
 const {request}=require('../../qne_v12/lib/common');
 const session=crypto.randomBytes(8).toString('hex'),tasks=[],local=[];
 for(let at=0;at<length;at+=chunkBytes){const data=read(descriptor,start+BigInt(at),Math.min(chunkBytes,length-at));
  const text=data.toString('base64'); // explicit: worker hashes BASE64, not raw binary
  tasks.push({op:'qne.sha256',payload:{text},key:'qne15-'+session+'-'+tasks.length});
  local.push({offset:String(start+BigInt(at)),bytes:data.length,sha256_base64:sha(Buffer.from(text))});
 }
 const ids=[];for(let i=0;i<tasks.length;i+=16){const r=await request('POST','/v1/tasks/batch',{tasks:tasks.slice(i,i+16)});ids.push(...r.tasks.map(t=>t.id));}
 const deadline=Date.now()+timeoutMs;let jobs;
 while(Date.now()<deadline){const r=await request('POST','/v1/tasks/status',{ids});jobs=r.tasks;
  if(jobs.every(x=>x?.status==='done'))break;
  if(jobs.some(x=>x?.status==='failed'))throw Error('Worker V14 a echoue');
  await pause(75);
 }
 if(!jobs||!jobs.every(x=>x?.status==='done'))throw Error('Timeout travailleurs V14');
 for(let i=0;i<jobs.length;i++){if(jobs[i].result?.hex!==local[i].sha256_base64)throw Error('Verification de bloc divergent '+i);}
 return {status:'PASSED',mode:'V14-unmodified-qne.sha256',verified_chunks:jobs.length,verified_window_bytes:length,
    workers:[...new Set(jobs.map(x=>x.worker))],worker_calculated:jobs.filter(x=>x.worker!=='qne14-fast-local'&&x.provenance==='worker-execution').length,
    representations:'SHA-256 du texte base64, pas des octets sources',chunks:local};
}
module.exports={verifyV14};
