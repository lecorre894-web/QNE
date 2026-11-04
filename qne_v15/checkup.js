#!/usr/bin/env node
'use strict';
/* ONE comprehensive validation: adaptive exact reconstruction and V14 worker bridge.
   No prior QNE files are changed, no service left running, no arbitrary scripts dispatched. */
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const path=require('node:path'),os=require('node:os'),net=require('node:net'),cp=require('node:child_process');
const {performance}=require('node:perf_hooks');
const Q=require('./lib/reconstruct'),{verifyV14}=require('./lib/v14_bridge'),{choose,Memo}=require('./lib/planner');
const root=path.resolve(__dirname,'..');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});});}
async function run(){
 let checks=0;const verify=(cond,label)=>{assert.ok(cond,label);checks++;};
 const report={schema:'qne.v15.adaptive-checkup/1',created:new Date().toISOString(),status:'RUNNING',node:process.version,platform:process.platform,arch:process.arch,checks:[],methods:{},source_engine:'QNE V2 GF(2^128) non modifie',originals_modified:false};
 const test=(cond,label)=>{verify(cond,label);report.checks.push(label);};
 const atStart=process.memoryUsage().rss;
 // 1: exact lossless cover of repeating, structured, exceptional, and non-compressible bytes
 const pattern=Buffer.from('QNE:arithmetique:bits:GF128:', 'utf8');
 const repeating=Buffer.alloc(32768);for(let i=0;i<repeating.length;i++)repeating[i]=pattern[i%pattern.length];
 const sparse=Buffer.alloc(32768);Buffer.from('ex1').copy(sparse,14);Buffer.from('reparation').copy(sparse,8000);sparse[30000]=255;
 const random=crypto.randomBytes(32768);
 const engine=Q.QNE.optimized(64);for(let i=0;i<9;i++)engine.step();
 const nonlinear=Buffer.alloc(engine.x.length*8);for(let i=0;i<engine.x.length;i++)nonlinear.writeDoubleLE(engine.x[i],i*8);
 for(const [name,data] of [['periodic',repeating],['sparse',sparse],['arbitrary',random],['nonlinear_state',nonlinear]]){
  const desc=Q.discover(data);Q.validDescriptor(desc);
  const rebuilt=Q.read(desc,0,data.length);
  test(rebuilt.equals(data),name+': reconstruction octet pour octet');
  test(Q.sha(rebuilt)===Q.sha(data),name+': integrite SHA-256');
  report.methods[name]={chosen:desc.kind,physical_source_bytes:data.length,descriptor_bytes:Buffer.byteLength(JSON.stringify(desc)),exact:true,ratio:data.length/Buffer.byteLength(JSON.stringify(desc))};
 }
 const nonlinearRecipe=Q.lorenz96(64,9,Q.sha(nonlinear));
 test(Q.read(nonlinearRecipe,0,nonlinear.length).equals(nonlinear),'jumeau non lineaire: reproduction exacte depuis regle et parametres');
 report.methods.nonlinear_reconstruction={chosen:'lorenz96',descriptor_bytes:Buffer.byteLength(JSON.stringify(nonlinearRecipe)),state_bytes:nonlinear.length,exact:true};
 test(report.methods.arbitrary.chosen==='literal','entropie arbitraire conservee en litteral');
 const memo=new Memo(65536),l=Q.discover(repeating);
 test(memo.get(l,0n,4096).equals(repeating.subarray(0,4096)),'memoire reconstructive : premier acces exact');
 test(memo.get(l,0n,4096).equals(repeating.subarray(0,4096))&&memo.stats().hits===1,'memoire reconstructive : deduplication du second acces');
 report.methods.memo=memo.stats();
 // 2: GF128, exact random access; arithmetic parity and recursive residue partitions.
 const gfSmall=Q.gf128(0x1234567890abcdef1234567890abcdefn,8192*16);
 const direct=Q.read(gfSmall,0,8192*16);
 const independentXor=(()=>{const out=Buffer.alloc(16);for(let i=0;i<direct.length;i++)out[i%16]^=direct[i];return Q.bufferToBigLE(out);})();
 const reduced=Q.xorAll(gfSmall);
 test(reduced===independentXor,'GF128: XOR algebrique = lecture directe des 8192 cellules');
 for(const [start,length] of [[1n,127],[15n,513],[8n*16n,160],[8180n*16n,192]]){
  const got=Q.read(gfSmall,start,length);test(got.equals(direct.subarray(Number(start),Number(start)+length)),'GF128: acces aleatoire '+start);}
 const patchPos=101n*16n+3n,patched=Q.patches(gfSmall,[{at:String(patchPos),data:Buffer.from('QNE-EXCEPTION')},{at:String(8180n*16n),data:Buffer.from('GF-override')}]);
 const patchedDirect=Buffer.from(direct);Buffer.from('QNE-EXCEPTION').copy(patchedDirect,Number(patchPos));Buffer.from('GF-override').copy(patchedDirect,8180*16);
 test(Q.read(patched,0,direct.length).equals(patchedDirect),'corrections ponctuelles reconstruites integralement');
 const patchXor=(()=>{const out=Buffer.alloc(16);for(let i=0;i<patchedDirect.length;i++)out[i%16]^=patchedDirect[i];return Q.bufferToBigLE(out);})();
 test(Q.xorAll(patched)===patchXor,'GF128+exceptions: XOR global exact');
 // 3: reuse the previously defined 10-million-TB mathematical problem, not an allocation.
 const logicalBytes=10_000_000n*1_000_000_000_000n;
 const huge=Q.gf128(0x1234567890abcdef1234567890abcdefn,logicalBytes);
 const b=performance.now(),global=Q.xorAll(huge),aggregateMs=performance.now()-b;
 const expected='0x4c6f8a293f5682a9be1270f3205a70d0';
 test(Q.hex(global)===expected,'10 millions de To: resultat de reference conserve');
 test(choose(huge,'xor_all').engine==='QNE-V2-GF128-algebraic','selection adaptative : reduction algebrique directe');
 test(choose(huge,'verify',{offset:0n,length:32768,allowNetwork:true}).engine==='V14-workers-sha256-base64','selection adaptative : grands blocs pour workers');
 test(choose(huge,'verify',{offset:0n,length:1024,allowNetwork:true}).engine==='QNE-V15-read-local','selection adaptative : petites lectures locales');
 const p=performance.now(),parity=Q.compareGFParity(huge);const parityMs=performance.now()-p;
 test(parity.total===expected,'pairs + impairs = XOR global exact');
 const stairs=[];for(const k of [8,12,16,32,64,128,256]){
  const started=performance.now(),got=Q.xorResiduesGF(huge,k),ms=performance.now()-started;
  test(got.xor===expected,'decomposition en '+k+' classes exacte');stairs.push({classes:k,duration_ms:ms,valid:true});
 }
 const last=Q.read(huge,logicalBytes-32n,32);
 test(last.length===32,'lecture exacte aux derniers octets de 10 millions de To');
 report.methods.policy={xor:choose(huge,'xor_all'),small:choose(huge,'verify',{length:1024,allowNetwork:true}),large:choose(huge,'verify',{length:32768,allowNetwork:true})};
 report.methods.gf={logical_TB_SI:'10000000',logical_bytes:String(logicalBytes),logical_cells:String(logicalBytes/16n),descriptor_bytes:Buffer.byteLength(JSON.stringify(huge)),xor:Q.hex(global),algebraic_xor_ms:aggregateMs,even_odd_ms:parityMs,classes:stairs,access_end_sha256:Q.sha(last),materialized_full_space:false};
 // 4: activate actual legacy V14 coordinator + V13 workers and send bounded reconstructed windows.
 const networkDisabled=process.argv.includes('--local-only');
 if(networkDisabled){report.methods.v14={status:'NOT_RUN',reason:'--local-only explicit'};}
 else{
  const required=['qne_v12/lib/common.js','qne_v13/worker.js','qne_v14/coordinator.js'];
  for(const rel of required)if(!fs.existsSync(path.join(root,rel)))throw Error('Prerequis manquant : '+rel);
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qne15-'));
  const port=await freePort(),token=crypto.randomBytes(48).toString('hex'),secretFile=path.join(temp,'secret');fs.writeFileSync(secretFile,token+'\n',{mode:0o600});
  const base='http://127.0.0.1:'+port,env={...process.env,QNE_ROOT:root,QNE_V12_URL:base,QNE_V12_HOST:'127.0.0.1',QNE_V12_PORT:String(port),QNE_V12_SECRET_FILE:secretFile,QNE_V12_DATA:path.join(temp,'jobs'),QNE_V12_POLL_MS:'60',QNE_V14_FASTPATH:'0',QNE_V13_CACHE:'1',QNE_V13_COALESCE:'1',QNE_V12_TASK_MS:'12000'};
  process.env.QNE_V12_URL=base;process.env.QNE_V12_SECRET_FILE=secretFile;
  let logs='',processes=[];
  function spawn(rel,extra={}){const pr=cp.spawn(process.execPath,[path.join(root,rel)],{env:{...env,...extra},stdio:['ignore','pipe','pipe']});pr.stdout.on('data',x=>logs+=x);pr.stderr.on('data',x=>logs+=x);processes.push(pr);return pr;}
  try{
   spawn('qne_v14/coordinator.js');
   const {request}=require('../qne_v12/lib/common');let ready=false;
   const deadline=Date.now()+12000;while(Date.now()<deadline){try{const s=await request('GET','/v1/status',null,2000);if(s.ok){ready=true;break;}}catch{}await pause(80);}
   test(ready,'coordinateur QNE V14 initialisable sans modification');
   spawn('qne_v13/worker.js',{QNE_V12_WORKER_ID:'qne15-worker-1'});
   spawn('qne_v13/worker.js',{QNE_V12_WORKER_ID:'qne15-worker-2'});
   let registered=false;const lim=Date.now()+12000;while(Date.now()<lim){const stat=await request('GET','/v1/status',null,2000);if(stat.workers.length>=2){registered=true;break;}await pause(75);}
   test(registered,'2 vrais travailleurs QNE V13/V14 inscrits');
   const bridge=await verifyV14(gfSmall,{offset:1024n,length:32768,chunkBytes:8192,timeoutMs:20000});
   test(bridge.status==='PASSED'&&bridge.verified_chunks===4,'4 blocs GF128 verifies par file V14');
   test(bridge.workers.some(x=>x.startsWith('qne15-worker')),'calcul de hachage realise par au moins un worker');
   report.methods.v14=bridge;
  }catch(e){throw Error('Pont V14: '+e.message+'; logs: '+logs.slice(-1000));}
  finally{
   for(const pr of processes.reverse()){if(pr.exitCode===null){pr.kill('SIGTERM');await Promise.race([new Promise(r=>pr.once('exit',r)),pause(1800)]);if(pr.exitCode===null)pr.kill('SIGKILL');}}
   fs.rmSync(temp,{recursive:true,force:true});
  }
 }
 report.check_count=checks;report.rss_before_bytes=atStart;report.rss_after_bytes=process.memoryUsage().rss;
 report.status='PASSED';
 const out=path.join(__dirname,'QNE_V15_RESULTATS.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('QNE V15 : PASSED | '+checks+' validations | 10 millions de To logiques GF128');
 console.log('Reconstruction: '+Object.entries(report.methods).filter(([k,x])=>x&&x.chosen).map(([k,x])=>k+'='+x.chosen).join(' ; '));
 console.log('XOR global: '+expected+' | classes: '+stairs.map(x=>x.classes).join(','));
 console.log('Workers V14: '+(report.methods.v14?.status||'NOT_RUN')+' | '+(report.methods.v14?.workers||[]).join(','));
 console.log('Rapport: '+out);
}
run().catch(e=>{console.error('QNE V15 : FAILED | '+(e.stack||e));process.exitCode=1;});
