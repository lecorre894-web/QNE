#!/usr/bin/env node
'use strict';
// End-to-end staircase: identical submitted work, independently validated results.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),http=require('node:http'),net=require('node:net');
const {isDeepStrictEqual}=require('node:util');
const root=path.resolve(__dirname,'../..'),reps=Number(process.env.QNE_V14_REPS||2),jobs=Number(process.env.QNE_V14_JOBS||24);
if(!Number.isInteger(reps)||reps<1||reps>5||!Number.isInteger(jobs)||jobs<12||jobs>64)throw Error('QNE_V14_REPS 1..5 et QNE_V14_JOBS 12..64');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function median(a){const b=[...a].sort((x,y)=>x-y);return b.length%2?b[b.length>>1]:(b[b.length/2-1]+b[b.length/2])/2;}
const fix=n=>Number(n.toFixed(4));
async function port(){return new Promise((res,rej)=>{const s=net.createServer();s.once('error',rej);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});}
async function stop(p){if(!p||p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([new Promise(r=>p.once('exit',r)),pause(1200)]);if(p.exitCode===null)p.kill('SIGKILL');}
async function req(base,token,method,p,data){return new Promise((resolve,reject)=>{
 const bytes=data?Buffer.from(JSON.stringify(data)):null;
 const rq=http.request(new URL(p,base),{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(bytes?{'Content-Length':bytes.length}:{})}},r=>{
 let txt='';r.on('data',b=>txt+=b);r.on('end',()=>{try{const v=JSON.parse(txt);r.statusCode>=400?reject(Error(v.error||'HTTP '+r.statusCode)):resolve(v);}catch(e){reject(e);}});
 });rq.setTimeout(9000,()=>rq.destroy(Error('Delai HTTP')));rq.on('error',reject);if(bytes)rq.write(bytes);rq.end();
 });}
function workload(mode){
 const originals=Array.from({length:6},(_,i)=>{
  if(i%3===0)return {op:'qne.sha256',payload:{text:'V14 '+i+' '+ 'G'.repeat(1500)}};
  if(i%3===1)return {op:'qne.gcd',payload:{a:String(1234567890123456789n+BigInt(i)*1234567n),b:'129876543212345'}};
  return {op:'qne.modpow',payload:{base:String(120001+i),exp:'8'.repeat(130),mod:'1000000007'}};
 });
 return Array.from({length:jobs*2},(_,i)=>{
  const b=originals[i%6];if(mode==='repeated')return b;
  const p={...b.payload};if(b.op==='qne.sha256')p.text+='-'+i;
  else if(b.op==='qne.gcd')p.a=String(BigInt(p.a)+BigInt(i)*10101n);
  else p.exp=String(BigInt(p.exp)+BigInt(i));
  return {op:b.op,payload:p};
 });
}
const STAGES=[{id:'P0',v:'v12',workers:1,send:'single',poll:'single'},{id:'P1',v:'v12',workers:4,send:'single',poll:'single'},
{id:'P2',v:'v13',workers:4,send:'single',poll:'single'},{id:'P3',v:'v14',workers:4,send:'batch',poll:'single'},
{id:'P4',v:'v14',workers:4,send:'batch',poll:'batch'},
{id:'P5',v:'v14',workers:4,send:'batch',poll:'batch',fast:true}];
async function run(mode,stage,repeat){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qne14-bench-')),secret=crypto.randomBytes(48).toString('hex'),sf=path.join(dir,'token');fs.writeFileSync(sf,secret+'\n',{mode:0o600});
 const p=await port(),base='http://127.0.0.1:'+p;
 const env={...process.env,QNE_ROOT:root,QNE_V12_URL:base,QNE_V12_PORT:String(p),QNE_V12_HOST:'127.0.0.1',QNE_V12_SECRET_FILE:sf,QNE_V12_DATA:path.join(dir,'store'),QNE_V12_POLL_MS:'55'};
 const procs=[];let errors='';
 function start(file,extra={}){const child=cp.spawn(process.execPath,[path.join(root,file)],{env:{...env,...extra},stdio:['ignore','pipe','pipe']});child.stdout.on('data',x=>errors+=x);child.stderr.on('data',x=>errors+=x);procs.push(child);return child;}
 async function until(fn,limit=8500){const end=Date.now()+limit;while(Date.now()<end){try{const v=await fn();if(v)return v;}catch{}await pause(55);}throw Error('Service indisponible');}
 try{
  start('qne_'+stage.v+'/coordinator.js',stage.fast?{QNE_V14_FASTPATH:'1'}:{QNE_V14_FASTPATH:'0'});await until(async()=>(await req(base,secret,'GET','/v1/status')).ok);
  for(let w=0;w<stage.workers;w++)start(stage.v==='v12'?'qne_v12/worker.js':'qne_v13/worker.js',{QNE_V12_WORKER_ID:stage.id+'-'+w});
  await until(async()=> (await req(base,secret,'GET','/v1/status')).workers.length>=stage.workers);
  const tasks=workload(mode),records=[];
  const begin=process.hrtime.bigint();
  for(let pass=0;pass<2;pass++){
   const selected=tasks.slice(pass*jobs,(pass+1)*jobs).map((task,i)=>({...task,key:mode+'-'+pass+'-'+i}));
   if(stage.send==='batch'){
    for(let i=0;i<selected.length;i+=16){const r=await req(base,secret,'POST','/v1/tasks/batch',{tasks:selected.slice(i,i+16)});
     r.tasks.forEach((t,j)=>records.push({id:t.id,reference:selected[i+j]}));}
   }else for(const task of selected){const r=await req(base,secret,'POST','/v1/tasks',task);records.push({id:r.task.id,reference:task});}
   const current=records.slice(pass*jobs),finish=Date.now()+25000;
   while(true){
    let rows;
    if(stage.poll==='batch'){
      rows=[];for(let i=0;i<current.length;i+=32){const r=await req(base,secret,'POST','/v1/tasks/status',{ids:current.slice(i,i+32).map(x=>x.id)});rows.push(...r.tasks);}
    }else rows=await Promise.all(current.map(async x=>(await req(base,secret,'GET','/v1/tasks/'+x.id)).task));
    if(rows.every(x=>x&&x.status==='done'))break;
    if(rows.some(x=>x&&x.status==='failed'))throw Error('Job echec');
    if(Date.now()>finish)throw Error('Taches non terminees');
    await pause(55);
   }
  }
  const ms=Number(process.hrtime.bigint()-begin)/1e6;
  const {compute}=require('../../qne_v12/lib/tasks');
  const full=await Promise.all(records.map(async x=>(await req(base,secret,'GET','/v1/tasks/'+x.id)).task));
  for(let i=0;i<records.length;i++)if(!isDeepStrictEqual(full[i].result,compute(records[i].reference)))throw Error('Resultat incompatible '+records[i].id);
  const status=(await req(base,secret,'GET','/v1/status'));
  if(stage.v==='v14'&&status.batch14.bulk_submitted!==jobs*2)throw Error('Lots non comptabilises');
  console.log('QNE V14 STAIR '+mode+' '+stage.id+' rep='+repeat+' '+ms.toFixed(1)+'ms |  '+full.length+' exact | workers='+stage.workers);
  return {workload:mode,stage:stage.id,workers:stage.workers,repeat,elapsed_ms:fix(ms),verified:true,logical_tasks:full.length,cooperation:status.cooperation||null,batch14:status.batch14||null};
 }catch(e){console.error('BENCH '+mode+' '+stage.id+' FAILED '+e.stack+'\n'+errors.slice(-2500));throw e;}
 finally{for(const pr of procs.reverse())await stop(pr);fs.rmSync(dir,{recursive:true,force:true});}
}
async function main(){let rows=[],status='PASSED';
 try{for(const mode of ['repeated','unique'])for(let r=1;r<=reps;r++){
  const order=r%2?STAGES:[...STAGES].reverse();for(const s of order)rows.push(await run(mode,s,r));
 }}catch(e){status='FAILED';process.exitCode=1;console.error('QNE V14 BENCH STOPPED '+e.message);}
 const summary={};for(const mode of ['repeated','unique']){
  const series=rows.filter(x=>x.workload===mode),times={};
  for(const s of STAGES){const z=series.filter(x=>x.stage===s.id).map(x=>x.elapsed_ms);times[s.id]=z.length===reps?median(z):null;}
  const stages=STAGES.map((s,i)=>{
   const t=times[s.id],prev=i?times[STAGES[i-1].id]:t,base=times.P0;
   return {id:s.id,workers:s.workers,elapsed_ms:t,gain_incremental:t&&prev?fix(prev/t):null,gain_cumule_direct:t&&base?fix(base/t):null};
  });
  const complete=stages.every(s=>s.elapsed_ms);
  let best=stages[2];for(const s of stages.slice(3))if(s.elapsed_ms&&s.elapsed_ms<best.elapsed_ms)best=s;
  const telescoping=complete?STAGES.slice(1).reduce((acc,s,i)=>acc*(times[STAGES[i].id]/times[s.id]),1):null;
  summary[mode]={stages,recommended_amplifier:best.id,verified_telescopic:complete&&Math.abs(telescoping-(times.P0/times.P5))<0.0009,direct_gain_P0_P5:complete?fix(times.P0/times.P5):null,selected_gain_P0:best.elapsed_ms&&times.P0?fix(times.P0/best.elapsed_ms):null};
 }
 const result={schema:'qne.v14.staircase/1',status,machine:os.platform()+'/'+os.arch(),node:process.version,repetitions:reps,jobs_per_pass:jobs,passes:2,all_results_verified:status==='PASSED',stages:STAGES,summary,measurements:rows,notes:[
  'P0 V12/1, P1 V12/4, P2 V13/4, P3 V14/4 batch envoi, P4 V14/4 batch envoi et lecture, P5 fastpath local borne en plus.',
  'Les facteurs par palier sont des rapports de temps sur la MEME charge ; pas de multiplication avec V10. Le palier P5 execute certaines taches sur le coordinateur et non sur les workers.',
  'La selection privilegie le plus rapide des paliers P2/P3/P4 pour ne pas imposer une regression.',
  'Tests localhost uniquement ; pas de datacenter physique ni de preuve de x100 universel.',
  'Mesures incluant soumission HTTP, coordination, calcul et recuperation de fin de taches ; hors lancement du serveur.',
  'Resultats controles localement avec le calcul de reference avant validation.'
 ]};
 const dest=path.join(root,'qne_v14','QNE_V14_BENCH_LOCAL.json');fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 console.log('QNE V14 BENCH '+status+' '+JSON.stringify(summary));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
