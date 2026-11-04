#!/usr/bin/env node
'use strict';
// Compatible with V12's compute thread, but advertises only capabilities actually present.
const {Worker}=require('node:worker_threads'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const {request,url}=require('../qne_v12/lib/common');
const {capabilities}=require('../qne_v12/lib/tasks');
const root=process.env.QNE_ROOT||path.resolve(__dirname,'..');
const ops=capabilities().filter(x=>x!=='qne.matrix.rotate32'||fs.existsSync(path.join(root,'qne_v10','qne_v10_matrix.js')));
const id=process.env.QNE_V12_WORKER_ID||('qne13-'+os.hostname().replace(/[^\w-]/g,'_').slice(0,30)+'-'+process.pid);
const pollMs=Number(process.env.QNE_V12_POLL_MS||250),taskMs=Number(process.env.QNE_V12_TASK_MS||12000);
if(!Number.isInteger(pollMs)||pollMs<50||pollMs>60000||!Number.isInteger(taskMs)||taskMs<100||taskMs>600000)throw Error('Delais hors limites');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let stopping=false;
function compute(j){return new Promise(resolve=>{let done=false;
 const w=new Worker(path.join(root,'qne_v12','compute_thread.js'),{workerData:{op:j.op,payload:j.payload},resourceLimits:{maxOldGenerationSizeMb:128}});
 const timer=setTimeout(()=>finish({ok:false,error:'Delai calcul depasse'}),taskMs);
 function finish(x){if(done)return;done=true;clearTimeout(timer);w.terminate();resolve(x);}
 w.on('message',finish);w.on('error',e=>finish({ok:false,error:e.message}));w.on('exit',c=>{if(!done)finish({ok:false,error:'Calcul interrompu '+c});});
 });}
async function loop(){console.log('QNE V13 WORKER | '+id+' | '+ops.join(',')+' | '+url);
 while(!stopping){try{
   const r=await request('POST','/v1/workers/lease',{worker_id:id,capabilities:ops});
   if(!r.job){await sleep(pollMs);continue;}
   const j=r.job;let busy=false;
   const h=setInterval(async()=>{if(busy)return;busy=true;try{await request('POST','/v1/workers/heartbeat',{worker_id:id,id:j.id,token:j.token},3500);}catch(e){console.error('Heartbeat: '+e.message);}finally{busy=false;}},Math.max(250,Math.floor(j.leaseMs/3)));
   const output=await compute(j);clearInterval(h);
   try{await request('POST','/v1/workers/result',{worker_id:id,id:j.id,token:j.token,...output});console.log('JOB '+j.id+' '+j.op+' '+(output.ok?'PASS':'FAIL'));}
   catch(e){console.error('Resultat non accepte: '+e.message);}
 }catch(e){console.error('Coordination: '+e.message);await sleep(Math.max(pollMs,500));}}
}
process.on('SIGINT',()=>stopping=true);process.on('SIGTERM',()=>stopping=true);
loop().catch(e=>{console.error(e.stack);process.exitCode=1;});
