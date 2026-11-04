#!/usr/bin/env node
'use strict';
// V14 additive coordinator, V12/V13-compatible, batch submission and polling.
const fs=require('node:fs'),http=require('node:http'),https=require('node:https'),crypto=require('node:crypto');
const {secret,dataDir}=require('../qne_v12/lib/common');
const {validTask,TASKS}=require('../qne_v12/lib/tasks');
const {expose}=require('../qne_v13/lib/cooperative_store');
const {BatchStore}=require('./lib/batch_store');
function integer(name,def,min,max){const n=Number(process.env[name]||def);if(!Number.isInteger(n)||n<min||n>max)throw Error(name+' incorrect');return n;}
const port=integer('QNE_V12_PORT',17849,1,65535),host=process.env.QNE_V12_HOST||'127.0.0.1';
const cert=process.env.QNE_V12_TLS_CERT,key=process.env.QNE_V12_TLS_KEY;
if(Boolean(cert)!==Boolean(key))throw Error('TLS cert et key requis ensemble');
if(!['127.0.0.1','::1','localhost'].includes(host)&&!cert)throw Error('TLS obligatoire hors localhost');
const s=new BatchStore(dataDir,{maxJobs:integer('QNE_V12_MAX_JOBS',4000,1,100000),leaseMs:integer('QNE_V12_LEASE_MS',15000,1000,600000),cacheEnabled:process.env.QNE_V13_CACHE!=='0',coalesceEnabled:process.env.QNE_V13_COALESCE!=='0',maxCache:integer('QNE_V13_CACHE_SIZE',512,1,5000),ttlMs:integer('QNE_V13_CACHE_TTL_MS',86400000,1000,604800000),fastPath:process.env.QNE_V14_FASTPATH==='1'});
const auth=Buffer.from('Bearer '+secret());
function authorized(t){const b=Buffer.from(t||'');return b.length===auth.length&&crypto.timingSafeEqual(b,auth);}
function send(res,status,obj){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'Content-Type':'application/json','Content-Length':b.length,'Cache-Control':'no-store'});res.end(b);}
function read(req){return new Promise((resolve,reject)=>{let size=0,buf=[];req.on('data',x=>{size+=x.length;if(size>128*1024){reject(Object.assign(Error('Charge trop grande'),{status:413}));req.destroy();return;}buf.push(x);});req.on('end',()=>{try{resolve(buf.length?JSON.parse(Buffer.concat(buf)):{});}catch{reject(Object.assign(Error('JSON non valide'),{status:400}));}});req.on('error',reject);});}
function requireObj(x){if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Objet JSON requis');return x;}
function workerId(w){if(typeof w!=='string'||!/^[A-Za-z0-9_.-]{1,80}$/.test(w))throw Error('worker_id invalide');}
async function handler(req,res){try{
  if(!authorized(req.headers.authorization))return send(res,401,{error:'Authentification requise'});
  const url=new URL(req.url,'http://localhost').pathname;
  if(req.method==='GET'&&url==='/v1/status')return send(res,200,{ok:true,...s.stats(),operations:TASKS});
  if(req.method==='GET'&&/^\/v1\/tasks\/[0-9a-f-]{36}$/.test(url)){const j=s.get(url.split('/').at(-1));return j?send(res,200,{ok:true,task:expose(j)}):send(res,404,{error:'Tache inconnue'});}
  if(req.method!=='POST')return send(res,404,{error:'Route inconnue'});
  const x=requireObj(await read(req));
  if(url==='/v1/tasks/batch'){
    if(!Array.isArray(x.tasks))throw Error('Tableau tasks requis');
    // BatchStore validates the full batch before writing, preserving idempotence semantics.
    const tasks=s.submitBatch(x.tasks);
    return send(res,202,{ok:true,tasks});
  }
  if(url==='/v1/tasks/status'){
    if(!Array.isArray(x.ids)||x.ids.length<1||x.ids.length>64||x.ids.some(id=>typeof id!=='string'||!/^[0-9a-f-]{36}$/.test(id)))throw Error('Tableau ids invalide');
    const jobs=x.ids.map(id=>s.get(id));
    return send(res,200,{ok:true,tasks:jobs.map(j=>j?expose(j):null)});
  }
  if(url==='/v1/tasks'){
    validTask(x);
    if(x.key!==undefined && (typeof x.key!=='string'||!/^[A-Za-z0-9_.:-]{1,128}$/.test(x.key)))throw Error('Cle idempotence invalide');
    const j=s.submit(x.op,x.payload,x.key);return send(res,202,{ok:true,task:expose(j)});
  }
  if(url==='/v1/workers/lease'){
    workerId(x.worker_id);
    if(!Array.isArray(x.capabilities)||x.capabilities.length>32||x.capabilities.some(z=>!TASKS.includes(z)))throw Error('Capacites invalides');
    return send(res,200,{ok:true,job:s.lease(x.worker_id,x.capabilities)});
  }
  if(url==='/v1/workers/heartbeat'){
    workerId(x.worker_id);return s.heartbeat(x.worker_id,x.id,x.token)?send(res,200,{ok:true}):send(res,409,{error:'Bail obsolete'});
  }
  if(url==='/v1/workers/result'){
    workerId(x.worker_id);
    if(x.ok && Buffer.byteLength(JSON.stringify(x.result||{}))>64*1024)throw Object.assign(Error('Resultat trop grand'),{status:413});
    return s.complete(x.worker_id,x.id,x.token,x.ok===true,x.result,x.error)?send(res,200,{ok:true}):send(res,409,{error:'Resultat refuse'});
  }
  send(res,404,{error:'Route inconnue'});
}catch(e){if(!res.headersSent&&!res.destroyed)send(res,e.status||400,{error:String(e.message).slice(0,180)});}}
const srv=cert?https.createServer({cert:fs.readFileSync(cert),key:fs.readFileSync(key),minVersion:'TLSv1.2'},handler):http.createServer(handler);
srv.requestTimeout=20000;srv.headersTimeout=10000;
srv.listen(port,host,()=>console.log('QNE V14 COOPERATIVE READY | '+(cert?'https':'http')+'://'+host+':'+port+' | fastpath='+s.fastPath+' | cache='+s.enabled+' | coalescing='+s.coalesce+' | tasks='+s.jobs.size));
const ticker=setInterval(()=>s.sweep(),500);ticker.unref();
function shutdown(){srv.close(()=>process.exit(0));setTimeout(()=>process.exit(1),1700).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
