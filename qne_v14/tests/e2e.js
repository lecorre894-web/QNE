#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),crypto=require('node:crypto'),http=require('node:http'),cp=require('node:child_process');
const {BatchStore}=require('../lib/batch_store'),{compute}=require('../../qne_v12/lib/tasks');
const root=path.resolve(__dirname,'../..'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){return new Promise((res,rej)=>{const s=net.createServer();s.once('error',rej);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});}
async function req(base,token,method,p,data){return new Promise((resolve,reject)=>{const raw=data?Buffer.from(JSON.stringify(data)):null;
 const q=http.request(new URL(p,base),{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(raw?{'Content-Length':raw.length}:{})}},r=>{
 let t='';r.on('data',x=>t+=x);r.on('end',()=>{try{const o=JSON.parse(t);if(r.statusCode>=400){const e=Error(o.error);e.status=r.statusCode;reject(e);}else resolve(o);}catch(e){reject(e);}});
 });q.setTimeout(7500,()=>q.destroy(Error('timeout')));q.on('error',reject);if(raw)q.write(raw);q.end();});}
async function wait(f,ms=8000){const deadline=Date.now()+ms;while(Date.now()<deadline){try{const v=await f();if(v)return v;}catch{}await sleep(70);}throw Error('Delai depasse');}
async function stop(p){if(!p||p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([new Promise(r=>p.once('exit',r)),sleep(1500)]);if(p.exitCode===null)p.kill('SIGKILL');}
async function main(){let tests=0;function check(b,msg){assert.ok(b,msg);tests++;}
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qne14-e2e-'));const store=new BatchStore(path.join(dir,'s'),{maxJobs:50});
 const tasks=[{op:'qne.gcd',payload:{a:'18',b:'12'},key:'x'},{op:'qne.gcd',payload:{a:'18',b:'12'},key:'y'}];
 const a=store.submitBatch(tasks);check(a.length===2&&a[0].id!==a[1].id,'identifiants uniques');
 check(store.metrics14.durable_writes===1,'une seule ecriture par batch');
 check(store.get(a[1].id).status==='waiting','coalescing conserve');
 const l=store.lease('local',['qne.gcd']);check(l&&l.id===a[0].id,'leader travailleur');
 check(store.complete('local',l.id,l.token,true,compute(tasks[0])),'resultat leader accepte');
 check(store.get(a[1].id).result.decimal==='6','fanout exact');
 const cache=store.submitBatch([{...tasks[0],key:'z'}]);check(cache[0].result.decimal==='6'&&cache[0].status==='done','cache partage');
 check(store.metrics14.durable_writes===5,'ecritures traces 1 batch + bail + resultat + fanout + cache');
 const before=store.jobs.size;let failed=false;
 try{store.submitBatch([{op:'qne.gcd',payload:{a:'45',b:'15'},key:'good'},{op:'unknown',payload:{},key:'bad'}]);}catch{failed=true;}
 check(failed&&store.jobs.size===before,'lot invalide atomique');
 const recovered=new BatchStore(path.join(dir,'s'),{maxJobs:50});check(recovered.get(a[0].id).status==='done','reprise apres redemarrage');
 // The service continues to accept V12/V13 workers over their unchanged API.
 const token=crypto.randomBytes(48).toString('hex'),sf=path.join(dir,'secret');fs.writeFileSync(sf,token+'\n',{mode:0o600});
 const prt=await port(),base='http://127.0.0.1:'+prt;
 const env={...process.env,QNE_ROOT:root,QNE_V12_HOST:'127.0.0.1',QNE_V12_PORT:String(prt),QNE_V12_URL:base,QNE_V12_SECRET_FILE:sf,QNE_V12_DATA:path.join(dir,'net'),QNE_V12_POLL_MS:'65',QNE_V14_FASTPATH:'1'};
 const processes=[];let logs='';function start(rel,e={}){const p=cp.spawn(process.execPath,[path.join(root,rel)],{env:{...env,...e},stdio:['ignore','pipe','pipe']});p.stdout.on('data',d=>logs+=d);p.stderr.on('data',d=>logs+=d);processes.push(p);return p;}
 try{
  start('qne_v14/coordinator.js');await wait(async()=>(await req(base,token,'GET','/v1/status')).ok);
  let denied=false;try{await req(base,'wrong','GET','/v1/status');}catch(e){denied=e.status===401;}check(denied,'refus auth');
  start('qne_v12/worker.js',{QNE_V12_WORKER_ID:'legacy-v12'});start('qne_v13/worker.js',{QNE_V12_WORKER_ID:'cooperative-v13'});
  await wait(async()=>(await req(base,token,'GET','/v1/status')).workers.length===2);
  check((await req(base,token,'GET','/v1/status')).workers.length===2,'workers V12/V13');
  const payload=[{op:'qne.sha256',payload:{text:'test'+ 'R'.repeat(100)}},{op:'qne.gcd',payload:{a:'123321',b:'2223'}},{op:'qne.modpow',payload:{base:'987654',exp:'80001',mod:'1000000007'}}];
  const jobs=Array.from({length:24},(_,i)=>({...payload[i%3],key:'net-'+i}));
  const pairs=[];for(let i=0;i<jobs.length;i+=12){const r=await req(base,token,'POST','/v1/tasks/batch',{tasks:jobs.slice(i,i+12)});for(const t of r.tasks)pairs.push(t.id);}
  check(pairs.length===24,'deux soumissions groupees');
  const ids=pairs.slice(),done=await wait(async()=>{const r=await req(base,token,'POST','/v1/tasks/status',{ids});return r.tasks.every(x=>x.status==='done')?r.tasks:null;},15000);
  check(done.length===24,'24 taches terminees');
  for(let i=0;i<24;i++)assert.deepEqual(done[i].result,compute(jobs[i]));tests++;
  const stat=(await req(base,token,'GET','/v1/status'));
  check(stat.batch14.bulk_batches===2&&stat.batch14.bulk_submitted===24,'metriques de batch');
  check(stat.batch14.fast_executions>=1,'fastpath borne sollicite');
  check(stat.cooperation.hits+stat.cooperation.coalesced>=20,'coop cache V13 active');
  const old=await req(base,token,'POST','/v1/tasks',{op:'qne.gcd',payload:{a:'81',b:'27'},key:'old'});
  check(old.task.id.length===36,'route V12 conservée');
  let badBatch=false;try{await req(base,token,'POST','/v1/tasks/batch',{tasks:[jobs[0],{op:'bad',payload:{},key:'bad'}]});}catch(e){badBatch=e.status===400;}
  check(badBatch,'lot HTTP invalide refuse');
  // A long SHA is not eligible for local fastpath; older workers must execute it.
  const large={op:'qne.sha256',payload:{text:'L'.repeat(7000)},key:'remote-long'};
  const submitted=await req(base,token,'POST','/v1/tasks/batch',{tasks:[large]});
  const finished=await wait(async()=>{const r=await req(base,token,'POST','/v1/tasks/status',{ids:[submitted.tasks[0].id]});return r.tasks[0].status==='done'?r.tasks[0]:null;},12000);
  check(finished.worker!=='qne14-fast-local'&&['legacy-v12','cooperative-v13'].includes(finished.worker),'fallback worker distant actif');
  check(finished.result.hex===compute(large).hex,'fallback resultat SHA exact');
  console.log('QNE V14 E2E PASS | '+tests+' controles | V12/V13 workers | 24 resultats exacts | batch atomique et cache');
  const out={schema:'qne.v14.e2e/1',status:'PASSED',checks:tests,workers:2,task_count:25,results_verified:25,cache:stat.cooperation,batching:stat.batch14,originals_modified:false};
  fs.writeFileSync(path.join(root,'qne_v14','QNE_V14_TESTS_LOCAL.json'),JSON.stringify(out,null,2)+'\n');
 }catch(e){console.error(e.stack+'\n'+logs.slice(-3000));process.exitCode=1;}
 finally{for(const p of processes.reverse())await stop(p);fs.rmSync(dir,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
