#!/usr/bin/env node
'use strict';
// Controlled comparison of 1/2/4 local processes. Never extrapolate to a datacenter.
const cp=require('node:child_process'),crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net');
const {isDeepStrictEqual}=require('node:util');
const here=path.resolve(__dirname,'..'),root=path.resolve(here,'..');
const repeats=Number(process.env.QNE_V12_BENCH_REPS||2),count=Number(process.env.QNE_V12_BENCH_JOBS||36);
if(!Number.isInteger(repeats)||repeats<1||repeats>7||!Number.isInteger(count)||count<4||count>200)throw Error('Limites des repetitions/taches');
function pause(ms){return new Promise(r=>setTimeout(r,ms));}
// Port helper must read bound address before closing (not after).
async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function terminate(p){if(!p||p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([new Promise(r=>p.once('exit',r)),pause(1500)]);if(p.exitCode===null)p.kill('SIGKILL');}
const payloads=Array.from({length:count},(_,i)=>{
 if(i%3===0)return {op:'qne.sha256',payload:{text:'QNE V12 workload '+i+' '+'R'.repeat(1000)}};
 if(i%3===1)return {op:'qne.gcd',payload:{a:String(10000000000000000n+BigInt(i)*23895435894723n),b:'1234567890'}};
 return {op:'qne.modpow',payload:{base:String(1000007+i),exp:'1'.repeat(180),mod:'1000000007'}};
});
async function main(){const results=[];
 for(const n of [1,2,4]){
  for(let rep=0;rep<repeats;rep++){
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qne12-bench-')),secretFile=path.join(dir,'secret');fs.writeFileSync(secretFile,crypto.randomBytes(48).toString('hex')+'\n',{mode:0o600});
    const prt=await freePort(),env={...process.env,QNE_ROOT:root,QNE_V12_SECRET_FILE:secretFile,QNE_V12_DATA:path.join(dir,'store'),QNE_V12_PORT:String(prt),QNE_V12_URL:'http://127.0.0.1:'+prt,QNE_V12_HOST:'127.0.0.1',QNE_V12_POLL_MS:'80'};
    const processes=[];let errLog='';
    const launch=(name,extras={})=>{
      const p=cp.spawn(process.execPath,[path.join(here,name)],{env:{...env,...extras},stdio:['ignore','pipe','pipe']});
      p.stdout.on('data',d=>{errLog+=d.toString().slice(-600);});p.stderr.on('data',d=>{errLog+=d.toString().slice(-600);});processes.push(p);return p;
    };
    try{
      launch('coordinator.js');const common=path.join(here,'lib','common.js');
      // This module captures URL on import: clear cache and install environment per trial.
      Object.assign(process.env,env);delete require.cache[require.resolve(common)];const {request}=require(common);
      const until=Date.now()+7000;while(Date.now()<until){try{if((await request('GET','/v1/status')).ok)break;}catch{}await pause(80);}
      for(let i=0;i<n;i++)launch('worker.js',{QNE_V12_WORKER_ID:'bench-'+n+'-'+i});
      let ready=false;const deadline=Date.now()+7000;while(Date.now()<deadline){try{ready=(await request('GET','/v1/status')).workers.length>=n;if(ready)break;}catch{}await pause(60);}if(!ready)throw Error('Workers non enregistres');
      const start=process.hrtime.bigint(),ids=[];
      for(const task of payloads)ids.push((await request('POST','/v1/tasks',task)).task.id);
      let done=[];let all=false;const maxWait=Date.now()+30000;
      while(Date.now()<maxWait){done=await Promise.all(ids.map(async id=>(await request('GET','/v1/tasks/'+id)).task));all=done.every(j=>j.status==='done'||j.status==='failed');if(all)break;await pause(70);}if(!all)throw Error('Timeout batch');
      const ms=Number(process.hrtime.bigint()-start)/1e6;
      const {compute}=require('../lib/tasks');
      for(let i=0;i<done.length;i++){
        const t=done[i];if(t.status!=='done'||!isDeepStrictEqual(t.result,compute(payloads[i])))throw Error('Sortie incorrecte #'+i+' '+JSON.stringify(t));
      }
      results.push({workers:n,repeat:rep+1,tasks:count,elapsed_ms:Number(ms.toFixed(3)),throughput_per_s:Number((1000*count/ms).toFixed(2)),correct:true});
      console.log('QNE V12 BENCH | workers='+n+' rep='+ (rep+1)+' jobs='+count+' '+ms.toFixed(1)+' ms | VERIFIED');
    }catch(e){console.error('QNE V12 BENCH FAILED '+e.stack+'\n'+errLog.slice(-2000));process.exitCode=1;break;}
    finally{for(const p of processes.reverse())await terminate(p);fs.rmSync(dir,{recursive:true,force:true});}
  }if(process.exitCode)break;
 }
 const med=a=>{const b=a.slice().sort((x,y)=>x-y);return b.length%2?b[b.length>>1]:(b[b.length/2-1]+b[b.length/2])/2;};
 const summary=[1,2,4].map(n=>{const x=results.filter(r=>r.workers===n).map(r=>r.elapsed_ms);return {workers:n,median_ms:x.length?Number(med(x).toFixed(3)):null,measurements:x.length};});
 const base=summary[0].median_ms;
 for(const x of summary)x.ratio_vs_1=base&&x.median_ms?Number((base/x.median_ms).toFixed(3)):null;
 const report={schema:'qne.v12.scale/1',status:results.length===3*repeats&&!process.exitCode?'PASSED':'INCOMPLETE',machine:os.platform()+'/'+os.arch(),node:process.version,reference:'local loopback, sha256/gcd/modpow reference tasks',repetitions:repeats,jobs_per_run:count,summary,raw:results,scope:'Includes HTTP/task queue/thread overhead; NOT a QNE global speedup nor a datacenter benchmark'};
 fs.writeFileSync(path.join(here,'QNE_V12_BENCH_LOCAL.json'),JSON.stringify(report,null,2)+'\n');
 console.log('QNE V12 SCALE: '+report.status+' '+summary.map(x=>x.workers+'w '+x.median_ms+'ms x'+x.ratio_vs_1).join(' | '));
 if(report.status!=='PASSED')process.exitCode=1;
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
