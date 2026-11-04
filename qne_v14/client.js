#!/usr/bin/env node
'use strict';
// Explicit V14 client with batch APIs. No general-purpose remote code execution.
if(!process.env.QNE_V12_URL)process.env.QNE_V12_URL='http://127.0.0.1:17859';
const {request}=require('../qne_v12/lib/common');
const {compute}=require('../qne_v12/lib/tasks');
const {isDeepStrictEqual}=require('node:util');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const action=process.argv[2]||'status';
 if(action==='status'){console.log(JSON.stringify(await request('GET','/v1/status'),null,2));return;}
 if(action!=='batch'){console.error('Usage: node qne_v14/client.js status | batch 30 repeated|unique');process.exitCode=2;return;}
 const count=Number(process.argv[3]||30),mode=process.argv[4]||'repeated';
 if(!Number.isInteger(count)||count<1||count>96||!['repeated','unique'].includes(mode))throw Error('batch nombre 1..96 repeated|unique');
 const prefix='manual-'+Date.now();
 const samples=[{op:'qne.sha256',payload:{text:'QNE14 manually benchmark '+'X'.repeat(500)}},
 {op:'qne.gcd',payload:{a:'1234567890123456789',b:'1987654321'}},
 {op:'qne.modpow',payload:{base:'314159',exp:'7777777777777',mod:'1000000007'}}];
 const jobs=Array.from({length:count},(_,i)=>{const r=samples[i%3],payload={...r.payload};if(mode==='unique'){
  if(i%3===0)payload.text+=':'+i;
  if(i%3===1)payload.a=String(BigInt(payload.a)+BigInt(i));
  if(i%3===2)payload.exp=String(BigInt(payload.exp)+BigInt(i));
 }
 return {op:r.op,payload,key:prefix+'-'+i};});
 const ids=[],start=process.hrtime.bigint();for(let i=0;i<jobs.length;i+=16){const r=await request('POST','/v1/tasks/batch',{tasks:jobs.slice(i,i+16)});ids.push(...r.tasks.map(x=>x.id));}
 const limit=Date.now()+30000;let outputs;
 while(Date.now()<limit){outputs=[];for(let i=0;i<ids.length;i+=32){const r=await request('POST','/v1/tasks/status',{ids:ids.slice(i,i+32)});outputs.push(...r.tasks);}
  if(outputs.every(t=>t&&t.status==='done'))break;
  if(outputs.some(t=>t?.status==='failed'))throw Error('Echec de calcul');
  await pause(80);
 }
 if(!outputs||!outputs.every(t=>t?.status==='done'))throw Error('Delai de traitement depasse');
 for(let i=0;i<jobs.length;i++)if(!isDeepStrictEqual(outputs[i].result,compute(jobs[i])))throw Error('Resultat divergent '+ids[i]);
 const ms=Number(process.hrtime.bigint()-start)/1e6,status=await request('GET','/v1/status');
 console.log(JSON.stringify({status:'PASSED',mode,requested:count,completed:outputs.length,verified:true,elapsed_ms:Number(ms.toFixed(2)),executed_by:[...new Set(outputs.map(x=>x.worker))],cooperation:status.cooperation,batch14:status.batch14},null,2));
}
main().catch(e=>{console.error('QNE V14 CLIENT FAILED: '+e.message);process.exitCode=1;});
