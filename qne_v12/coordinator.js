#!/usr/bin/env node
'use strict';
const fs=require('node:fs');const path=require('node:path');const http=require('node:http');const https=require('node:https');const crypto=require('node:crypto');
const {secret,dataDir,localHost}=require('./lib/common');const {Store,publicJob}=require('./lib/store');const {validTask,TASKS}=require('./lib/tasks');
function envInt(name,def,min,max){const n=Number(process.env[name]||def);if(!Number.isInteger(n)||n<min||n>max)throw Error(name+' hors limites');return n;}
const port=envInt('QNE_V12_PORT',17839,1,65535),host=process.env.QNE_V12_HOST||'127.0.0.1';
const tlsCert=process.env.QNE_V12_TLS_CERT,tlsKey=process.env.QNE_V12_TLS_KEY;
if((tlsCert&&!tlsKey)||(tlsKey&&!tlsCert))throw Error('Certificat et cle TLS requis ensemble');
if(!['127.0.0.1','::1','localhost'].includes(host)&&!tlsCert)throw Error('Ecoute distante refusee sans TLS');
const store=new Store(dataDir,{maxJobs:envInt('QNE_V12_MAX_JOBS',4000,1,100000),leaseMs:envInt('QNE_V12_LEASE_MS',15000,1000,600000)});
const token=secret();
function unauthorized(value){const expected=Buffer.from('Bearer '+token),actual=Buffer.from(value||'');return actual.length!==expected.length||!crypto.timingSafeEqual(expected,actual);}
function send(res,status,obj){const buf=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':buf.length,'Cache-Control':'no-store'});res.end(buf);}
function readJSON(req){return new Promise((resolve,reject)=>{
  let n=0,chunks=[];req.on('data',b=>{n+=b.length;if(n>128*1024){reject(Object.assign(Error('Corps trop grand'),{status:413}));req.destroy();return;}chunks.push(b);});
  req.on('end',()=>{try{resolve(chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{});}catch{reject(Object.assign(Error('JSON invalide'),{status:400}));}});
  req.on('error',reject);
});}
function required(obj){if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Object.assign(Error('Objet requis'),{status:400});return obj;}
function workerId(id){if(typeof id!=='string'||!(/^[A-Za-z0-9_.-]{1,80}$/).test(id))throw Object.assign(Error('worker_id invalide'),{status:400});return id;}
const handler=async(req,res)=>{
  try{
    if(unauthorized(req.headers.authorization)){send(res,401,{error:'Authentification requise'});return;}
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(req.method==='GET'&&pathname==='/v1/status'){send(res,200,{ok:true,...store.stats(),operations:TASKS});return;}
    if(req.method==='GET'&&/^\/v1\/tasks\/[0-9a-f-]{36}$/.test(pathname)){
      const j=store.get(pathname.slice('/v1/tasks/'.length));if(!j){send(res,404,{error:'Tache inconnue'});return;}send(res,200,{ok:true,task:publicJob(j)});return;
    }
    if(req.method!=='POST'){send(res,404,{error:'Chemin ou methode inconnue'});return;}
    const x=required(await readJSON(req));
    if(pathname==='/v1/tasks'){
      validTask(x);
      const key=x.key;if(key!==undefined&&(typeof key!=='string'||!(/^[A-Za-z0-9_.:-]{1,128}$/).test(key)))throw Object.assign(Error('Cle idempotence invalide'),{status:400});
      const j=store.submit(x.op,x.payload,key);send(res,202,{ok:true,task:publicJob(j)});return;
    }
    if(pathname==='/v1/workers/lease'){
      workerId(x.worker_id);if(!Array.isArray(x.capabilities)||x.capabilities.length>32||x.capabilities.some(z=>!TASKS.includes(z)))throw Object.assign(Error('Capacites invalides'),{status:400});
      const job=store.lease(x.worker_id,x.capabilities);send(res,200,{ok:true,job});return;
    }
    if(pathname==='/v1/workers/heartbeat'){
      workerId(x.worker_id);if(!store.heartbeat(x.worker_id,x.id,x.token)){send(res,409,{error:'Bail obsolete'});return;}
      send(res,200,{ok:true});return;
    }
    if(pathname==='/v1/workers/result'){
      workerId(x.worker_id);
      if(x.ok&&Buffer.byteLength(JSON.stringify(x.result||{}))>64*1024)throw Object.assign(Error('Resultat trop long'),{status:413});
      if(!store.complete(x.worker_id,x.id,x.token,x.ok===true,x.result,x.error)){send(res,409,{error:'Resultat obsolete ou non autorise'});return;}
      send(res,200,{ok:true});return;
    }
    send(res,404,{error:'Chemin inconnu'});
  }catch(e){if(!res.headersSent&&!res.destroyed)send(res,e.status||400,{error:String(e.message).slice(0,200)});}
};
const server=tlsCert?https.createServer({cert:fs.readFileSync(tlsCert),key:fs.readFileSync(tlsKey),minVersion:'TLSv1.2'},handler):http.createServer(handler);
server.headersTimeout=10000;server.requestTimeout=20000;
server.listen(port,host,()=>console.log('QNE V12 COORDINATOR READY | '+(tlsCert?'https':'http')+'://'+host+':'+port+' | local-durable | tasks='+store.jobs.size));
const sweep=setInterval(()=>store.sweep(),500);sweep.unref();
function shutdown(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),1500).unref();}process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
