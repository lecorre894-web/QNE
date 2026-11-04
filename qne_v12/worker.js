#!/usr/bin/env node
'use strict';
const {Worker}=require('node:worker_threads');const path=require('node:path');const os=require('node:os');const crypto=require('node:crypto');
const {request,url}=require('./lib/common');const {capabilities}=require('./lib/tasks');
const id=(process.env.QNE_V12_WORKER_ID || ('worker-'+os.hostname().replace(/[^\w-]/g,'_').slice(0,30)+'-'+process.pid));
const ops=capabilities();const pollMs=Number(process.env.QNE_V12_POLL_MS||300);const timeoutMs=Number(process.env.QNE_V12_TASK_MS||12000);
if(!Number.isInteger(pollMs)||pollMs<50||pollMs>60000||!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>600000)throw Error('Configuration de delai invalide');
let stopped=false;
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function execute(task){return new Promise(resolve=>{
  let finished=false;
  const w=new Worker(path.join(__dirname,'compute_thread.js'),{workerData:{op:task.op,payload:task.payload},resourceLimits:{maxOldGenerationSizeMb:128}});
  const timer=setTimeout(()=>finish({ok:false,error:'Timeout de calcul'}),timeoutMs);
  function finish(v){if(finished)return;finished=true;clearTimeout(timer);w.terminate();resolve(v);}
  w.on('message',finish);w.on('error',e=>finish({ok:false,error:e.message}));w.on('exit',c=>{if(!finished)finish({ok:false,error:'Worker thread exit '+c});});
});}
async function loop(){console.log('QNE V12 WORKER READY | '+id+' | '+ops.join(',')+' | '+url);
  while(!stopped){
    try{
      const poll=await request('POST','/v1/workers/lease',{worker_id:id,capabilities:ops});
      if(!poll.job){await sleep(pollMs);continue;}
      const j=poll.job;let extending=false;
      const heart=setInterval(async()=>{if(extending)return;extending=true;try{await request('POST','/v1/workers/heartbeat',{worker_id:id,id:j.id,token:j.token},3500);}catch(e){console.error('Heartbeat : '+e.message);}finally{extending=false;}},Math.max(250,Math.floor(j.leaseMs/3)));
      const result=await execute(j);clearInterval(heart);
      try{await request('POST','/v1/workers/result',{worker_id:id,id:j.id,token:j.token,...result});console.log('JOB '+j.id+' '+j.op+' '+(result.ok?'PASS':'FAIL'));}
      catch(e){console.error('Ack tache '+j.id+' : '+e.message);}
    }catch(e){console.error('Coordination : '+e.message);await sleep(Math.max(pollMs,500));}
  }
}
process.on('SIGTERM',()=>stopped=true);process.on('SIGINT',()=>stopped=true);
loop().catch(e=>{console.error(e);process.exitCode=1;});
