#!/usr/bin/env node
'use strict';
// Same operations, same outputs and same total submitted jobs in each stage.
// V12-1 -> V12-4 -> V13-4: only these ratios may be telescopically multiplied.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),http=require('node:http'),net=require('node:net');
const {isDeepStrictEqual}=require('node:util');
const root=path.resolve(__dirname,'../..'),reps=Number(process.env.QNE_V13_REPS||2),jobs=Number(process.env.QNE_V13_JOBS||24);
if(!Number.isInteger(reps)||reps<1||reps>5||!Number.isInteger(jobs)||jobs<12||jobs>96)throw Error('QNE_V13_REPS 1..5 et QNE_V13_JOBS 12..96');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){return new Promise((res,rej)=>{const s=net.createServer();s.once('error',rej);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});}
async function close(p){if(!p||p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([new Promise(r=>p.once('exit',r)),pause(1600)]);if(p.exitCode===null)p.kill('SIGKILL');}
async function req(base,token,method,p,data){return new Promise((resolve,reject)=>{const b=data?Buffer.from(JSON.stringify(data)):null;
 const r=http.request(new URL(p,base),{method,headers:{Authorization:'Bearer '+token, 'Content-Type':'application/json',...(b?{'Content-Length':b.length}:{})}},s=>{let str='';s.on('data',d=>str+=d);s.on('end',()=>{try{const o=JSON.parse(str);s.statusCode>=400?reject(Error(o.error)):resolve(o);}catch(e){reject(e);}});});r.setTimeout(7000,()=>r.destroy(Error('HTTP timeout')));r.on('error',reject);if(b)r.write(b);r.end();});}
function median(a){a=[...a].sort((x,y)=>x-y);return a.length%2?a[a.length>>1]:(a[a.length/2-1]+a[a.length/2])/2;}
function fixed(n){return Number(n.toFixed(4));}
function build(mode,size=jobs){
 const base=Array.from({length:6},(_,i)=>{
   if(i%3===0)return {op:'qne.sha256',payload:{text:'QNE V13 duplication '+i+' '+'Q'.repeat(2000)}};
   if(i%3===1)return {op:'qne.gcd',payload:{a:String(100000000000000000000n+BigInt(i)*512078134225n),b:'9123456782341'}};
   return {op:'qne.modpow',payload:{base:String(325000+i),exp:'9'.repeat(210),mod:'1000000007'}};
 });
 return Array.from({length:size},(_,i)=>mode==='repeated'?base[i%6]:{
   ...base[i%6],payload: { ...base[i%6].payload, ...(i%3===0?{text:base[i%6].payload.text+'-'+i}:i%3===1?{a:String(BigInt(base[i%6].payload.a)+BigInt(i)*12343n)}:{exp:String(BigInt(base[i%6].payload.exp)+BigInt(i))}) }
 });
}
async function run(mode,variant,workers,repeat){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'qne13-bench-')),sf=path.join(directory,'token'),token=crypto.randomBytes(48).toString('hex');fs.writeFileSync(sf,token+'\n',{mode:0o600});
 const prt=await port(),base='http://127.0.0.1:'+prt;
 const env={...process.env,QNE_ROOT:root,QNE_V12_PORT:String(prt),QNE_V12_HOST:'127.0.0.1',QNE_V12_URL:base,QNE_V12_SECRET_FILE:sf,QNE_V12_DATA:path.join(directory,'state'),QNE_V12_POLL_MS:'55'};
 const processes=[];let logs='';
 function launch(rel,extras={}){const p=cp.spawn(process.execPath,[path.join(root,rel)],{env:{...env,...extras},stdio:['ignore','pipe','pipe']});p.stdout.on('data',d=>logs+=d.toString());p.stderr.on('data',d=>logs+=d.toString());processes.push(p);return p;}
 try{
   launch(variant==='v12'?'qne_v12/coordinator.js':'qne_v13/coordinator.js');
   const wait=async pred=>{const end=Date.now()+9000;while(Date.now()<end){try{if(await pred())return;}catch{}await pause(65);}throw Error('Service non pret');};
   await wait(async()=> (await req(base,token,'GET','/v1/status')).ok);
   for(let i=0;i<workers;i++)launch(variant==='v12'?'qne_v12/worker.js':'qne_v13/worker.js',{QNE_V12_WORKER_ID:variant+'-'+workers+'-'+i});
   await wait(async()=> (await req(base,token,'GET','/v1/status')).workers.length>=workers);
   const tasks=build(mode,mode==='unique'?2*jobs:jobs),ids=[],start=process.hrtime.bigint();
   for(let pass=0;pass<2;pass++){
     for(let i=0;i<jobs;i++){const task=mode==='unique'?tasks[pass*jobs+i]:tasks[i];const r=await req(base,token,'POST','/v1/tasks',{...task,key:mode+'-'+pass+'-'+i});ids.push({id:r.task.id,ref:task});}
     const deadline=Date.now()+30000;let completed=false;
     while(Date.now()<deadline){const rows=await Promise.all(ids.slice(pass*jobs).map(async i=>(await req(base,token,'GET','/v1/tasks/'+i.id)).task));if(rows.every(r=>r.status==='done')){completed=true;break;}await pause(75);}
     if(!completed)throw Error('Les taches ne sont pas toutes terminees');
   }
   const elapsed=Number(process.hrtime.bigint()-start)/1e6;
   const {compute}=require('../../qne_v12/lib/tasks');
   for(const item of ids){const out=(await req(base,token,'GET','/v1/tasks/'+item.id)).task;if(!isDeepStrictEqual(out.result,compute(item.ref)))throw Error('Divergence sur '+item.id);}
   const state=await req(base,token,'GET','/v1/status');
   if(variant==='v13'&&mode==='repeated'&&state.cooperation.hits<jobs)throw Error('Cache de second passage non sollicite');
   console.log('QNE V13 BENCH '+mode+' '+variant+' '+workers+'w pass='+repeat+' '+elapsed.toFixed(2)+'ms |  '+ids.length+' calculs logiques verifies');
   return {workload:mode,variant,workers,repeat,elapsed_ms:fixed(elapsed),tasks:ids.length,verified:true,cooperation:state.cooperation||null};
 }catch(e){console.error('BENCH FAILURE '+e.stack+'\n'+logs.slice(-2500));throw e;}
 finally{for(const p of processes.reverse())await close(p);fs.rmSync(directory,{recursive:true,force:true});}
}
async function main(){let rows=[];let status='PASSED';try{
 for(const mode of ['repeated','unique'])for(let r=1;r<=reps;r++)for(const [variant,workers] of (r%2===1?[['v12',1],['v12',4],['v13',1],['v13',2],['v13',4]]:[['v13',4],['v13',2],['v13',1],['v12',4],['v12',1]]))rows.push(await run(mode,variant,workers,r));
 }catch(e){status='FAILED';process.exitCode=1;console.error('QNE V13 BENCH STOPPED: '+e.message);}
 const summary={};for(const mode of ['repeated','unique']){
  const x=rows.filter(r=>r.workload===mode),get=(v,n)=>{const all=x.filter(z=>z.variant===v&&z.workers===n).map(z=>z.elapsed_ms);return all.length===reps?median(all):null;};
  const b1=get('v12',1),b4=get('v12',4),c1=get('v13',1),c2=get('v13',2),c4=get('v13',4);
  summary[mode]={baseline_v12_1_ms:b1,v12_4_ms:b4,v13_1_ms:c1,v13_2_ms:c2,v13_4_ms:c4,gain_distribution:b1&&b4?fixed(b1/b4):null,gain_cooperation_after_distribution:b4&&c4?fixed(b4/c4):null,gain_cumulatif_direct:b1&&c4?fixed(b1/c4):null,multiplication_compatible:b1&&b4&&c4?fixed((b1/b4)*(b4/c4)):null};
 }
 const report={schema:'qne.v13.cooperative_bench/1',status,machine:os.platform()+'/'+os.arch(),node:process.version,all_outputs_verified:status==='PASSED',repeat:reps,jobs_per_pass:jobs,passes_per_trial:2,workloads:['repeated','unique'],stages:['V12-1','V12-4','V13-1','V13-2','V13-4'],summary,measurements:rows,notes:['Ratios calcules sur la meme charge et les memes operations.','Gain cumulatif = rapport direct des temps; facteurs telescopiques non independants.','V13 peut ralentir sur charge unique, et n accelere pas les applications arbitraires.','Les temps incluent la soumission HTTP, l ordonnancement et le traitement des taches, mais pas le demarrage des services.','Aucune execution datacenter ou connexion distante ne fait partie du test.']};
 fs.writeFileSync(path.join(root,'qne_v13','QNE_V13_BENCH_LOCAL.json'),JSON.stringify(report,null,2)+'\n');
 console.log('QNE V13 BENCH '+status+' '+JSON.stringify(summary));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
