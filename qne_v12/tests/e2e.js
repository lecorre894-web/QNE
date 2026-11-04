#!/usr/bin/env node
'use strict';
// Multi-process end-to-end checks. Runs on loopback only, never changes QNE originals.
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const crypto=require('node:crypto');
const net=require('node:net');const http=require('node:http');const cp=require('node:child_process');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','..');const here=path.resolve(__dirname,'..');
function pause(ms){return new Promise(r=>setTimeout(r,ms));}
async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
function alive(proc){return proc.exitCode===null&&!proc.killed;}
function spawn(cmd,vars,logs){let out='';const p=cp.spawn(process.execPath,[path.join(here,cmd)],{env:vars,stdio:['ignore','pipe','pipe']});
  p.stdout.on('data',d=>{out+=d.toString();if(out.length>20000)out=out.slice(-20000);});p.stderr.on('data',d=>{out+=d.toString();if(out.length>20000)out=out.slice(-20000);});
  logs.push(()=>({cmd,pid:p.pid,exit:p.exitCode,tail:out.slice(-1200)}));return p;
}
async function stop(p){if(!p||p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([new Promise(r=>p.once('exit',r)),pause(2000)]);if(p.exitCode===null)p.kill('SIGKILL');}
async function main(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qne-v12-test-'));const sec=path.join(dir,'secret');fs.writeFileSync(sec,crypto.randomBytes(48).toString('hex')+'\n',{mode:0o600});
  const port=await freePort();const env={...process.env,QNE_ROOT:root,QNE_V12_PORT:String(port),QNE_V12_URL:'http://127.0.0.1:'+port,QNE_V12_HOST:'127.0.0.1',QNE_V12_SECRET_FILE:sec,QNE_V12_DATA:path.join(dir,'state'),QNE_V12_LEASE_MS:'1000',QNE_V12_POLL_MS:'70',QNE_V12_TASK_MS:'5000'};
  Object.assign(process.env,env);const {request,assertTransport}=require('../lib/common');
  const logs=[],procs=[];let checks=0,report={schema:'qne.v12.e2e/1',status:'FAILED',workers:0,checks:0,transport:'localhost',distributed_speedup:'NOT_MEASURED',notes:[]};
  function check(value,message){assert.ok(value,message);checks++;}
  async function waitFor(f,deadline=7000){const until=Date.now()+deadline;while(Date.now()<until){try{const r=await f();if(r)return r;}catch{}await pause(75);}throw Error('Attente expiree');}
  try{
    let coordinator=spawn('coordinator.js',env,logs);procs.push(coordinator);
    await waitFor(async()=> (await request('GET','/v1/status')).ok);
    check((await request('GET','/v1/status')).counts.done===0,'coordinateur disponible');
    assert.throws(()=>assertTransport(new URL('http://192.0.2.1:1234')),/HTTP distant interdit/);checks++;
    const authResponse=await new Promise((resolve,reject)=>http.get({hostname:'127.0.0.1',port,path:'/v1/status'},r=>{r.resume();r.on('end',()=>resolve(r.statusCode));}).on('error',reject));
    check(authResponse===401,'authentification obligatoire');
    let rejected=false;try{await request('POST','/v1/tasks',{op:'exec.shell',payload:{command:'id'}});}catch(e){rejected=e.status===400;}
    check(rejected,'exec distante interdite');
    const item=await request('POST','/v1/tasks',{op:'qne.gcd',payload:{a:'252',b:'105'},key:'failover-key'});
    check(item.task.status==='queued','file initiale');
    const dupe=await request('POST','/v1/tasks',{op:'qne.gcd',payload:{a:'252',b:'105'},key:'failover-key'});
    check(dupe.task.id===item.task.id,'idempotence');
    let conflict=false;try{await request('POST','/v1/tasks',{op:'qne.gcd',payload:{a:'8',b:'4'},key:'failover-key'});}catch(e){conflict=e.status===409;}
    check(conflict,'conflit idempotence detecte');
    const ghost=await request('POST','/v1/workers/lease',{worker_id:'ghost-worker',capabilities:['qne.gcd']});
    check(ghost.job.id===item.task.id&&ghost.job.attempt===1,'bail reserve');
    await pause(1150);
    const a=spawn('worker.js',{...env,QNE_V12_WORKER_ID:'node-A'},logs),b=spawn('worker.js',{...env,QNE_V12_WORKER_ID:'node-B'},logs);procs.push(a,b);
    await waitFor(async()=> (await request('GET','/v1/status')).workers.length>=2);
    const resumed=await waitFor(async()=>{const x=(await request('GET','/v1/tasks/'+item.task.id)).task;return x.status==='done'?x:null;});
    check(resumed.attempts>=2&&resumed.result.decimal==='21','reprise apres expiration et resultat juste');
    let stale=false;try{await request('POST','/v1/workers/result',{worker_id:'ghost-worker',id:item.task.id,token:ghost.job.token,ok:true,result:{decimal:'21'}});}catch(e){stale=e.status===409;}
    check(stale,'accuse obsolete refuse');
    const ops=[
      {op:'qne.sha256',payload:{text:'QNE V12 distribue'}},
      {op:'qne.gcd',payload:{a:'1999998',b:'54'}},
      {op:'qne.modpow',payload:{base:'7',exp:'12345',mod:'97'}}
    ];
    if(fs.existsSync(path.join(root,'qne_v10','qne_v10_matrix.js')))ops.push({op:'qne.matrix.rotate32',payload:{exp:12345}});
    const ids=[];const t0=process.hrtime.bigint();
    for(let i=0;i<30;i++){const t=ops[i%ops.length];const x=await request('POST','/v1/tasks',t);ids.push(x.task.id);}
    const completed=await waitFor(async()=>{const jobs=await Promise.all(ids.map(async id=>(await request('GET','/v1/tasks/'+id)).task));return jobs.every(j=>j.status==='done'||j.status==='failed')?jobs:null;},12000);
    const elapsedMs=Number(process.hrtime.bigint()-t0)/1e6;
    check(completed.every(x=>x.status==='done'),'30 taches terminees');
    const unique=new Set(completed.map(x=>x.worker));check(unique.has('node-A')&&unique.has('node-B'),'deux travailleurs ont execute des taches');
    const sha=crypto.createHash('sha256').update('QNE V12 distribue').digest('hex');
    check(completed.filter(x=>x.op==='qne.sha256').every(x=>x.result.hex===sha),'SHA256 independently confirmed');
    check(completed.filter(x=>x.op==='qne.gcd').every(x=>x.result.decimal==='54'),'PGCD independently confirmed');
    let v=1n;for(let k=0;k<12345;k++)v=v*7n%97n;
    check(completed.filter(x=>x.op==='qne.modpow').every(x=>x.result.decimal===v.toString()),'modpow independently confirmed');
    if(ops.length===4)check(completed.filter(x=>x.op==='qne.matrix.rotate32').every(x=>x.result.verified===true),'QNE V10 GF2 verifie');
    // Persistent tasks survive a coordinator process restart, even when workers remain alive.
    await stop(a);await stop(b);await stop(coordinator);
    coordinator=spawn('coordinator.js',env,logs);procs.push(coordinator);
    await waitFor(async()=> (await request('GET','/v1/status')).ok);
    const persistent=(await request('GET','/v1/tasks/'+item.task.id)).task;
    check(persistent.status==='done'&&persistent.result.decimal==='21','persistance apres redemarrage');
    const identical=await request('POST','/v1/tasks',{op:'qne.gcd',payload:{a:'252',b:'105'},key:'failover-key'});
    check(identical.task.id===item.task.id,'idempotence conservee sur disque');
    report={schema:'qne.v12.e2e/1',status:'PASSED',checks,workers:2,parallel_jobs:30,elapsed_ms:Number(elapsedMs.toFixed(2)),workers_used:[...unique],persistence:'PASSED',failover:'PASSED',idempotency:'PASSED',auth:'PASSED',math:'PASSED',matrix_v10:ops.length===4?'PASSED':'NOT_INSTALLED',transport:'loopback HTTP; remote requires verified TLS',distributed_speedup:'NOT_MEASURED',notes:['Tests de services locaux en processus distincts; aucun datacenter reel implique','Les taches sont au-moins-une-fois, et non exactement-une-fois']};
    console.log('QNE V12 E2E PASSED | '+checks+' checks | 2 workers | 30 jobs | '+elapsedMs.toFixed(1)+' ms | failover + persistence + auth OK');
  }catch(e){report.error=e.stack;report.checks=checks;console.error('QNE V12 E2E FAILED: '+e.stack);for(const get of logs)console.error(get());process.exitCode=1;}
  finally{
    for(const p of procs.reverse())await stop(p);
    try{fs.writeFileSync(path.join(here,'QNE_V12_TESTS_LOCAL.json'),JSON.stringify(report,null,2)+'\n');}catch(e){console.error('Resultats: '+e.message);}
    fs.rmSync(dir,{recursive:true,force:true});
  }
}
main();
