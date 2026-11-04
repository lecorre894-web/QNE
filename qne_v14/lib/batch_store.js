'use strict';
// Additive V14 transaction: one durable save per validated HTTP batch.
// Prior V12/V13 stores and workers remain untouched.
const {Store}=require('../../qne_v12/lib/store');
const {CooperativeStore,expose}=require('../../qne_v13/lib/cooperative_store');
const {validTask,compute}=require('../../qne_v12/lib/tasks');
const crypto=require('node:crypto');
function validKey(key){if(key!==undefined && (typeof key!=='string'|| !/^[A-Za-z0-9_.:-]{1,128}$/.test(key)))throw Error('Cle idempotente invalide');}
class BatchStore extends CooperativeStore{
 constructor(dir,opts){super(dir,opts);this._batched=false;this._dirty=false;this._cacheDirty=false;this.fastPath=opts?.fastPath===true;this.metrics14={bulk_batches:0,bulk_submitted:0,durable_writes:0,fast_executions:0};}
 save(){if(this._batched){this._dirty=true;return;}if(this.metrics14)this.metrics14.durable_writes++;return Store.prototype.save.call(this);}
 saveCache(){if(this._batched){this._cacheDirty=true;return;}return CooperativeStore.prototype.saveCache.call(this);}
 fastEligible(t){
  if(!this.fastPath || !t || !t.payload)return false;
  const p=t.payload;
  if(t.op==='qne.sha256')return Buffer.byteLength(p.text,'utf8')<=4096;
  if(t.op==='qne.gcd')return p.a.length<=40 && p.b.length<=40;
  if(t.op==='qne.modpow')return p.base.length<=20&&p.exp.length<=160&&p.mod.length<=20;
  return false;
 }
 accelerate(newJobs){
  const start=process.hrtime.bigint();
  for(const out of newJobs){
   if(Number(process.hrtime.bigint()-start)/1e6>15)break; // event-loop latency guard
   const j=this.jobs.get(out.id);
   if(!j||j.status!=='queued'||!this.fastEligible(j))continue;
   const worker='qne14-fast-local',token=crypto.randomBytes(24).toString('hex');
   j.status='leased';j.worker=worker;j.lease={token,until:Date.now()+this.leaseMs};j.attempts++;j.updated=Date.now();
   const result=compute(j);
   if(!this.complete(worker,j.id,token,true,result))throw Error('Fastpath commit refuse');
   this.metrics14.fast_executions++;
  }
 }

 submitBatch(tasks){
  if(!Array.isArray(tasks)||tasks.length<1||tasks.length>32)throw Error('Lot de 1 a 32 taches requis');
  for(const t of tasks){validTask(t);validKey(t.key);}
  if(this._batched)throw Error('Transaction imbriquee');
  // All operations are synchronous. No worker request can interleave a batch in the Node event loop.
  const checkpoint={jobs:structuredClone(this.jobs),keys:structuredClone(this.keys),leaders:structuredClone(this.leaders),cache:structuredClone(this.cache),metrics:structuredClone(this.metrics),fast:this.metrics14.fast_executions};
  this._batched=true;this._dirty=false;this._cacheDirty=false;
  let out;
  try{
   out=tasks.map(t=>this.submit(t.op,t.payload,t.key));
   if(this.fastPath)this.accelerate(out);
  }catch(e){
   this.jobs=checkpoint.jobs;this.keys=checkpoint.keys;this.leaders=checkpoint.leaders;this.cache=checkpoint.cache;this.metrics=checkpoint.metrics;this.metrics14.fast_executions=checkpoint.fast;
   this._batched=false;this._dirty=false;this._cacheDirty=false;throw e;
  }
  this._batched=false;
  if(this._dirty){
    try{Store.prototype.save.call(this);}catch(e){
      // Revert memory. An I/O failure is reported; no success acknowledgement is sent.
      this.jobs=checkpoint.jobs;this.keys=checkpoint.keys;this.leaders=checkpoint.leaders;this.cache=checkpoint.cache;this.metrics=checkpoint.metrics;this.metrics14.fast_executions=checkpoint.fast;
      this._dirty=false;this._cacheDirty=false;throw e;
    }
    this.metrics14.durable_writes++;
  }
  if(this._cacheDirty)CooperativeStore.prototype.saveCache.call(this);
  this._cacheDirty=false;this._dirty=false;this.metrics14.bulk_batches++;this.metrics14.bulk_submitted+=tasks.length;
  return out.map(expose);
 }
 stats(){return {...super.stats(),batch14:{...this.metrics14,max_batch:32,fast_path:this.fastPath}};}
}
module.exports={BatchStore};
