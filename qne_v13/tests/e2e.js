#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),crypto=require('node:crypto'),http=require('node:http'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const {CooperativeStore}=require('../lib/cooperative_store');
const {compute}=require('../../qne_v12/lib/tasks');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){return new Promise((res,rej)=>{const s=net.createServer();s.once('error',rej);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});}
async function request(base,token,method,p,data){return new Promise((resolve,reject)=>{
 const raw=data?Buffer.from(JSON.stringify(data)):null;
 const req=http.request(new URL(p,base),{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(raw?{'Content-Length':raw.length}:{})}},response=>{
 let txt='';response.on('data',d=>txt+=d);response.on('end',()=>{try{const v=JSON.parse(txt);if(response.statusCode>=400){const e=Error(v.error);e.status=response.statusCode;reject(e);}else resolve(v);}catch(e){reject(e);}});
 });req.setTimeout(6000,()=>req.destroy(Error('timeout')));req.on('error',reject);if(raw)req.write(raw);req.end();
});}
async function stop(p){if(!p||p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([new Promise(r=>p.once('exit',r)),sleep(2000)]);if(p.exitCode===null)p.kill('SIGKILL');}
async function wait(promiseFn,ms=7000){const end=Date.now()+ms;while(Date.now()<end){try{const v=await promiseFn();if(v)return v;}catch{}await sleep(60);}throw Error('delai de test depasse');}
async function main(){let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'qne13-e2e-'));
 const testDir=path.join(scratch,'store');const s=new CooperativeStore(testDir,{leaseMs:1000,maxJobs:100,ttlMs:60000,maxCache:5});
 const first=s.submit('qne.gcd',{a:'84',b:'18'},'first'),following=s.submit('qne.gcd',{a:'84',b:'18'},'second');
 check(first.id!==following.id&&following.status==='waiting','fusion sans perdre les identifiants individuels');
 const l=s.lease('unit-worker',['qne.gcd']);check(l.id===first.id,'seul leader execute');
 check(s.complete('unit-worker',l.id,l.token,true,{decimal:'6'}),'resultat du leader accepte');
 check(s.get(following.id).status==='done'&&s.get(following.id).result.decimal==='6','resultat replique au suiveur');
 const hit=s.submit('qne.gcd',{a:'84',b:'18'},'third');check(hit.status==='done'&&hit.worker==='coordinator-cache','cache partage sur taches ulterieures');
 check(s.stats().cooperation.coalesced===1&&s.stats().cooperation.hits===1,'compteurs de cooperation exacts');
 const again=new CooperativeStore(testDir,{leaseMs:1000,maxJobs:100,ttlMs:60000,maxCache:5});
 check(again.submit('qne.gcd',{a:'84',b:'18'},'fourth').status==='done','cache persistant apres redemarrage');
 const bad=again.submit('qne.gcd',{a:'87',b:'15'},'bad'),rescue=again.submit('qne.gcd',{a:'87',b:'15'},'rescue');
 const claim=again.lease('crash',['qne.gcd']);check(claim.id===bad.id,'bail initial');
 check(again.complete('crash',claim.id,claim.token,false,null,'failed'),'echec pris en compte');
 const promotion=again.lease('repair',['qne.gcd']);check(promotion.id===rescue.id,'promotion du suiveur apres panne');
 check(again.complete('repair',promotion.id,promotion.token,true,{decimal:'3'}),'reprise reussie');
 check(again.stats().counts.waiting===0,'aucune attente orpheline');
 // Real two-worker loopback test. None of the legacy QNE scripts are executed.
 const portNum=await port(),token=crypto.randomBytes(48).toString('hex'),sf=path.join(scratch,'token');fs.writeFileSync(sf,token+'\n',{mode:0o600});
 const base='http://127.0.0.1:'+portNum;
 const env={...process.env,QNE_ROOT:root,QNE_V12_URL:base,QNE_V12_HOST:'127.0.0.1',QNE_V12_PORT:String(portNum),QNE_V12_SECRET_FILE:sf,QNE_V12_DATA:path.join(scratch,'network'),QNE_V12_POLL_MS:'65',QNE_V12_LEASE_MS:'3000'};
 const processes=[],logs=[];
 function start(rel,extras={}){let log='';const p=cp.spawn(process.execPath,[path.join(root,rel)],{env:{...env,...extras},stdio:['ignore','pipe','pipe']});p.stdout.on('data',d=>log+=d);p.stderr.on('data',d=>log+=d);processes.push(p);logs.push(()=>({rel,exit:p.exitCode,log:log.slice(-1500)}));return p;}
 try{
 start('qne_v13/coordinator.js');await wait(async()=> (await request(base,token,'GET','/v1/status')).ok);
 check((await request(base,token,'GET','/v1/status')).cooperation.enabled===true,'coordinator V13 disponible');
 let unauthorized=false;try{await request(base,'bad','GET','/v1/status');}catch(e){unauthorized=e.status===401;}check(unauthorized,'authentification refuse');
 start('qne_v12/worker.js',{QNE_V12_WORKER_ID:'worker-X'});
 start('qne_v13/worker.js',{QNE_V12_WORKER_ID:'worker-Y'});
 await wait(async()=> (await request(base,token,'GET','/v1/status')).workers.length>=2);
 const workers=(await request(base,token,'GET','/v1/status')).workers;check(workers.some(w=>w.id==='worker-X')&&workers.some(w=>w.id==='worker-Y'),'workers V12/V13 compatibles');
 const payload=[
 {op:'qne.gcd',payload:{a:'355687813',b:'111111'}},
 {op:'qne.sha256',payload:{text:'QNE V13 tests '+ 'P'.repeat(1000)}},
 {op:'qne.modpow',payload:{base:'873624',exp:'553421',mod:'1000000007'}}];
 const pairs=[];
 for(let i=0;i<24;i++){
   const task=payload[i%payload.length];const response=await request(base,token,'POST','/v1/tasks',{...task,key:'e2e-'+i});pairs.push({task,id:response.task.id});
 }
 const completed=await wait(async()=>{const jobs=await Promise.all(pairs.map(async x=>(await request(base,token,'GET','/v1/tasks/'+x.id)).task));return jobs.every(j=>j.status==='done')?jobs:null;},15000);
 check(completed.length===24,'24 taches terminees');
 check(completed.every((x,i)=>assert.deepEqual(x.result,compute(pairs[i].task))===undefined),'controle mathematique independant pour chaque tache');
 const status=(await request(base,token,'GET','/v1/status'));
 check(status.cooperation.coalesced+status.cooperation.hits>=20,'amplificateurs coordonnes actifs');
 check(status.counts.done===24,'compteurs de taches logiques');
 const remoteHit=(await request(base,token,'POST','/v1/tasks',{...payload[0],key:'later'})).task;
 check(remoteHit.provenance==='shared-cache'&&remoteHit.status==='done','cache de resultats reutilise');
 check(status.cooperation.executions<24,'moins de calculs que de taches');
 console.log('QNE V13 E2E PASS | '+checks+' controles | workers V12+V13 | 24 taches verifiees | dedup+cache+failover+persist');
 const out={schema:'qne.v13.e2e/1',status:'PASSED',checks,network:'loopback',workers:2,tasks_verified:24,cooperation:status.cooperation,originals_modified:false,scope:'Test local ; aucun datacenter physique.'};
 fs.writeFileSync(path.join(root,'qne_v13','QNE_V13_TESTS_LOCAL.json'),JSON.stringify(out,null,2)+'\n');
 }catch(e){console.error('QNE V13 E2E FAILED: '+e.stack);for(const x of logs)console.error(x());process.exitCode=1;}
 finally{for(const p of processes.reverse())await stop(p);fs.rmSync(scratch,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
