








'use strict';
// QNE DATACENTER AVANCE V2 — zettaoctet, yottaoctet et AU-DELA des prefixes nommes,
// + verification PARALLELE deleguee aux vrais workers V14 (reconstruction -> base64 -> qne.sha256).
// Couche strictement additive : ne modifie aucun moteur V2..V15. A lancer depuis ~/QNE.
const path=require('node:path'),fs=require('node:fs'),os=require('node:os'),net=require('node:net'),cp=require('node:child_process'),crypto=require('node:crypto');
const R=require('./qne_v15/lib/reconstruct.js');
const {verifyV14}=require('./qne_v15/lib/v14_bridge.js');
const {gf128,periodic,fill,patches,lorenz96,literal,size,read,xorAll,sha,hex,bufferToBigLE,QNE}=R;
const root=path.resolve(__dirname);
const pause=ms=>new Promise(r=>setTimeout(r,ms));

const SI={0:'o',3:'ko',6:'Mo',9:'Go',12:'To',15:'Po',18:'Eo',21:'Zo',24:'Yo',27:'Ro',30:'Qo'};
function humanD(n){n=BigInt(n);const s=n.toString(),exp=s.length-1;
 if(exp>30){const lead=s[0]+'.'+(s.slice(1,3)+'00').slice(0,2);return lead+' x 10^'+exp+' o (au-dela des prefixes nommes)';}
 const e3=Math.floor(exp/3)*3,div=10n**BigInt(e3),whole=n/div,frac=Number((n*100n/div)%100n);
 return (e3===0?n.toString():whole.toString()+'.'+String(frac).padStart(2,'0'))+' '+SI[e3];}
function descBytes(d){return Buffer.byteLength(JSON.stringify(d));}
function bruteXor(buf){const r=Buffer.alloc(16);for(let i=0;i<buf.length;i++)r[i%16]^=buf[i];return bufferToBigLE(r);}

class DataCenter{
 constructor(){this.regions=[];this.total=0n;this.store=new Map();}
 add(name,desc){if(size(desc)%16n!==0n)throw Error('Region '+name+' : taille doit etre multiple de 16');
  const key=sha(Buffer.from(JSON.stringify(desc)));let rec=this.store.get(key);
  if(!rec){rec={desc,bytes:descBytes(desc),refs:0};this.store.set(key,rec);}rec.refs++;const sz=size(desc);
  this.regions.push({name,key,off:this.total,size:sz,kind:desc.kind});this.total+=sz;return this;}
 read(g,len){g=BigInt(g);const r=this.regions.find(x=>g>=x.off&&g<x.off+x.size);if(!r)throw Error('Adresse hors du centre');
  const local=g-r.off;if(local+BigInt(len)>r.size)throw Error('Lecture a cheval');const buf=read(this.store.get(r.key).desc,local,len);return {region:r.name,bytes:buf,sha256:sha(buf)};}
 xorGlobal(){let acc=0n;for(const r of this.regions)acc^=xorAll(this.store.get(r.key).desc);return acc;}
 manifest(){let db=0n;for(const rec of this.store.values())db+=BigInt(rec.bytes);return {regions:this.regions.length,uniques:this.store.size,logical:this.total,descBytes:db};}
}

const dc=new DataCenter();
dc.add('coffre-GF128-1Zo', gf128(0x9e3779b97f4a7c15f39cc0605cedc835n, 10n**21n));
dc.add('coffre-GF128-1Yo', gf128(0xc2b2ae3d27d4eb4f1656667213edc835n, 10n**24n));
dc.add('coffre-GF128-1Ro', gf128(0x2545f4914f6cdd1dabcdef0123456789n, 10n**27n));
dc.add('coffre-GF128-1Qo', gf128(0xff51afd7ed558ccd9e3779b97f4a7c15n, 10n**30n));
dc.add('coffre-GF128-au-dela', gf128(0x0123456789abcdeffedcba9876543210n, 10n**40n));
dc.add('archive-periodique-1Po', periodic(Buffer.from('QNE-RENE-'), 10n**15n));
dc.add('disque-patches-1Go', patches(fill(0x00,10n**9n), [
  {at:0,        data:Buffer.from('ENTETE-QNE-V16!!').toString('base64')},
  {at:500000000,data:Buffer.from('SECTEUR-MILIEU!!').toString('base64')},
  {at:999999984,data:Buffer.from('FIN-DE-VOLUME-!!').toString('base64')}]));
(function(){const N=64,steps=9;const e=QNE.optimized(N);for(let i=0;i<steps;i++)e.step();
 const out=Buffer.alloc(N*8);for(let i=0;i<N;i++)out.writeDoubleLE(e.x[i],i*8);
 dc.add('jumeau-L96-nonlineaire', lorenz96(N,steps,sha(out)));})();
dc.add('bloc-litteral-128o', literal(Buffer.from(Array.from({length:128},(_,i)=>(i*131+7)&255))));
dc.add('echantillon-GF128-4Kio', gf128(0x0123456789abcdeffedcba9876543210n, 4096n));

function rapport(){
 const m=dc.manifest();
 console.log('========== QNE DATACENTER AVANCE V2 ==========');
 console.log('Regions declarees      : '+m.regions+'  (descripteurs uniques : '+m.uniques+')');
 console.log('Capacite LOGIQUE totale : '+humanD(m.logical));
 console.log('                          ('+m.logical.toString().length+' chiffres, '+m.logical+' octets)');
 console.log('Poids reel descripteurs : '+m.descBytes+' octets');
 const amp=m.logical/m.descBytes;
 console.log('Amplification           : ~10^'+(amp.toString().length-1)+' octets generables par octet stocke');
 console.log('----------------------------------------------');
 for(const r of dc.regions){const rec=dc.store.get(r.key);
  console.log('  '+r.name.padEnd(24)+r.kind.padEnd(9)+humanD(r.size).padStart(30)+'  | descr '+rec.bytes+' o');}
 const t=process.hrtime.bigint(),gx=dc.xorGlobal(),ms=Number(process.hrtime.bigint()-t)/1e6;
 console.log('----------------------------------------------');
 console.log('XOR GLOBAL (exact algebrique) : '+hex(gx));
 console.log('  calcule en '+ms.toFixed(2)+' ms, SANS materialiser un octet de '+humanD(m.logical)+'.');
 console.log('----------------------------------------------');
 console.log('VERIF LOCALE (algebre vs force brute, regions <= 64 Kio) :');
 let allok=true;
 for(const r of dc.regions)if(r.size<=65536n){const desc=dc.store.get(r.key).desc;
  const ok=bruteXor(read(desc,0n,Number(r.size)))===xorAll(desc);allok=allok&&ok;
  console.log('  '+r.name.padEnd(24)+(ok?'EXACT':'ERREUR'));}
 return allok;
}

async function freePort(){return new Promise((res,rej)=>{const s=net.createServer();s.on('error',rej);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});}
async function withWorkers(fn){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qnedc-'));
 const port=await freePort(),token=crypto.randomBytes(48).toString('hex'),secretFile=path.join(temp,'secret');
 fs.writeFileSync(secretFile,token+'\n',{mode:0o600});
 const base='http://127.0.0.1:'+port;
 const env={...process.env,QNE_ROOT:root,QNE_V12_URL:base,QNE_V12_HOST:'127.0.0.1',QNE_V12_PORT:String(port),QNE_V12_SECRET_FILE:secretFile,QNE_V12_DATA:path.join(temp,'jobs'),QNE_V12_POLL_MS:'60',QNE_V14_FASTPATH:'0',QNE_V13_CACHE:'1',QNE_V13_COALESCE:'1',QNE_V12_TASK_MS:'12000'};
 process.env.QNE_V12_URL=base;process.env.QNE_V12_SECRET_FILE=secretFile;
 const procs=[];let logs='';
 const spawn=(rel,extra={})=>{const pr=cp.spawn(process.execPath,[path.join(root,rel)],{env:{...env,...extra},stdio:['ignore','pipe','pipe']});pr.stdout.on('data',x=>logs+=x);pr.stderr.on('data',x=>logs+=x);procs.push(pr);return pr;};
 try{
  spawn('qne_v14/coordinator.js');
  const {request}=require('./qne_v12/lib/common');
  let ready=false;const dl=Date.now()+12000;while(Date.now()<dl){try{const s=await request('GET','/v1/status',null,2000);if(s.ok){ready=true;break;}}catch{}await pause(80);}
  if(!ready)throw Error('coordinateur non pret');
  spawn('qne_v13/worker.js',{QNE_V12_WORKER_ID:'dc-worker-1'});
  spawn('qne_v13/worker.js',{QNE_V12_WORKER_ID:'dc-worker-2'});
  let reg=false;const lim=Date.now()+12000;while(Date.now()<lim){const st=await request('GET','/v1/status',null,2000);if(st.workers.length>=2){reg=true;break;}await pause(75);}
  if(!reg)throw Error('workers non inscrits');
  return await fn();
 }catch(e){throw Error('Pont V14: '+e.message+' ; logs: '+logs.slice(-700));}
 finally{for(const pr of procs.reverse()){if(pr.exitCode===null){pr.kill('SIGTERM');await Promise.race([new Promise(r=>pr.once('exit',r)),pause(1800)]);if(pr.exitCode===null)pr.kill('SIGKILL');}}fs.rmSync(temp,{recursive:true,force:true});}
}

(async function(){
 const localOk=rapport();
 console.log('----------------------------------------------');
 console.log('VERIFICATION PARALLELE par les vrais workers V14 (fenetres reconstruites -> base64 -> qne.sha256) :');
 const ok=await withWorkers(async()=>{
  const targets=dc.regions.filter(r=>r.size>=131072n);
  const t=Date.now();
  const results=await Promise.all(targets.map(async r=>{
   const res=await verifyV14(dc.store.get(r.key).desc,{offset:1024n,length:32768,chunkBytes:8192,timeoutMs:30000});
   return {name:r.name,...res};}));
  const ms=Date.now()-t;let chunks=0;const workers=new Set();let pass=true;
  for(const x of results){chunks+=x.verified_chunks;x.workers.forEach(w=>workers.add(w));pass=pass&&x.status==='PASSED';
   console.log('  '+x.name.padEnd(24)+x.status+'  '+x.verified_chunks+' blocs  ['+x.workers.join(',')+']');}
  console.log('  -> '+chunks+' blocs verifies EN PARALLELE par '+workers.size+' workers, en '+ms+' ms');
  return pass;});
 console.log('==============================================');
 console.log((localOk&&ok)?'TOUT VERIFIE : zettaoctet-et-au-dela coherent, workers V14 en parallele OK.':'ECHEC DE VERIFICATION.');
})().catch(e=>{console.error('ECHEC: '+(e.stack||e));process.exitCode=1;});
