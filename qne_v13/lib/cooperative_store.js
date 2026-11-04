'use strict';
// QNE V13: additive cooperative layer, reuses QNE V12's transactional local task store.
// Shared cache applies only to bounded deterministic results, not arbitrary scripts.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {Store,publicJob}=require('../../qne_v12/lib/store');
const SAFE_CACHE_OPS=new Set(['qne.sha256','qne.gcd','qne.modpow']);
function hash(op,payload){return crypto.createHash('sha256').update(JSON.stringify({op,payload})).digest('hex');}
class CooperativeStore extends Store{
  constructor(dir,opts={}){
    super(dir,opts);
    this.enabled=opts.cacheEnabled!==false;
    this.coalesce=opts.coalesceEnabled!==false;
    this.maxCache=opts.maxCache??512;
    this.ttlMs=opts.ttlMs??86400000;
    this.cacheFile=path.join(dir,'cooperative_cache.json');
    this.cache=new Map();this.leaders=new Map();
    this.metrics={hits:0,coalesced:0,misses:0,fanout:0,executions:0,expired:0};
    if(this.enabled && fs.existsSync(this.cacheFile)){
      try{
        const content=JSON.parse(fs.readFileSync(this.cacheFile,'utf8'));
        if(content.schema===1 && Array.isArray(content.entries)){
          for(const entry of content.entries.slice(-this.maxCache)){
            if(typeof entry.sig==='string' && Number.isFinite(entry.time) && Date.now()-entry.time<this.ttlMs && entry.result!==undefined){this.cache.set(entry.sig,{time:entry.time,result:entry.result});}
          }
        }
      }catch(e){throw Error('Cache illisible: '+e.message+'; ne pas ignorer la corruption');}
    }
    this.recover();
  }
  saveCache(){
    if(!this.enabled)return;
    const tmp=this.cacheFile+'.'+process.pid+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify({schema:1,entries:[...this.cache.entries()].map(([sig,v])=>({sig,...v}))}),{mode:0o600});
    fs.renameSync(tmp,this.cacheFile);
  }
  lookup(sig){
    const found=this.cache.get(sig);if(!found)return null;
    if(Date.now()-found.time>this.ttlMs){this.cache.delete(sig);this.metrics.expired++;this.saveCache();return null;}
    // LRU: move recently accessed result to the end.
    this.cache.delete(sig);this.cache.set(sig,found);return found;
  }
  put(sig,result){
    if(!this.enabled)return;
    this.cache.delete(sig);this.cache.set(sig,{time:Date.now(),result:JSON.parse(JSON.stringify(result))});
    while(this.cache.size>this.maxCache)this.cache.delete(this.cache.keys().next().value);
    this.saveCache();
  }
  recover(){
    // Following a crash, resume a queued leader and all its dependents. Never drop an orphan.
    this.leaders.clear();let changed=false;
    for(const j of this.jobs.values()){
      if(j.status==='waiting' || j.status==='queued'){
        if(this.enabled&&SAFE_CACHE_OPS.has(j.op)){
          const c=this.lookup(j.signature);
          if(c){j.status='done';j.worker='coordinator-cache';j.result=c.result;j.error=null;j.lease=null;j.updated=Date.now();j.provenance='persistent-cache';changed=true;continue;}
        }
        if(!this.coalesce || !SAFE_CACHE_OPS.has(j.op)){
          if(j.status==='waiting'){j.status='queued';j.waiting_for=null;changed=true;}
          continue;
        }
        if(!this.leaders.has(j.signature)){
          this.leaders.set(j.signature,j.id);
          if(j.status==='waiting'){j.status='queued';j.waiting_for=null;changed=true;}
        }else{
          const leader=this.leaders.get(j.signature);
          if(j.status!=='waiting'||j.waiting_for!==leader){j.status='waiting';j.waiting_for=leader;changed=true;}
        }
      }
    }
    if(changed)this.save();
  }
  submit(op,payload,key){
    const sig=hash(op,payload);
    if(key && this.keys.has(key))return super.submit(op,payload,key); // preserves strict V12 idempotence
    const c=this.enabled&&SAFE_CACHE_OPS.has(op)?this.lookup(sig):null;
    const previous=this.coalesce&&SAFE_CACHE_OPS.has(op)?this.leaders.get(sig):null;
    const j=super.submit(op,payload,key);
    if(c){
      j.status='done';j.result=JSON.parse(JSON.stringify(c.result));j.worker='coordinator-cache';j.provenance='shared-cache';j.updated=Date.now();this.metrics.hits++;this.save();
    }else if(previous && this.jobs.get(previous) && ['queued','leased'].includes(this.jobs.get(previous).status)){
      j.status='waiting';j.waiting_for=previous;j.provenance='inflight-coalescing';j.updated=Date.now();this.metrics.coalesced++;this.save();
    }else{
      if(this.coalesce && SAFE_CACHE_OPS.has(op))this.leaders.set(sig,j.id);
      this.metrics.misses++;
    }
    return j;
  }
  complete(worker,id,token,ok,result,error){
    const j=this.jobs.get(id),sig=j?.signature;
    const accepted=super.complete(worker,id,token,ok,result,error);
    if(!accepted)return false;
    if(j && SAFE_CACHE_OPS.has(j.op)){
      if(ok){
        this.metrics.executions++;
        if(this.enabled)this.put(sig,result);
        for(const follower of this.jobs.values())if(follower.status==='waiting'&&follower.waiting_for===id){
          follower.status='done';follower.result=JSON.parse(JSON.stringify(result));follower.error=null;follower.worker=worker;follower.updated=Date.now();follower.lease=null;this.metrics.fanout++;
        }
        this.leaders.delete(sig);this.save();
      }else this.promote(sig,id);
    }else if(ok)this.metrics.executions++;
    return true;
  }
  promote(sig,failedId){
    const followers=[...this.jobs.values()].filter(j=>j.status==='waiting'&&j.signature===sig&&j.waiting_for===failedId);
    if(followers.length){
      const newLeader=followers.shift();newLeader.status='queued';newLeader.waiting_for=null;newLeader.updated=Date.now();
      this.leaders.set(sig,newLeader.id);
      for(const f of followers)f.waiting_for=newLeader.id;
      this.save();
    }else this.leaders.delete(sig);
  }
  sweep(){
    super.sweep();
    for(const [sig,id] of [...(this.leaders||new Map()).entries()]){
      const j=this.jobs.get(id);
      if(!j || j.status==='failed')this.promote(sig,id);
    }
  }
  stats(){
    this.sweep();const counts={queued:0,leased:0,waiting:0,done:0,failed:0};
    for(const j of this.jobs.values())if(Object.hasOwn(counts,j.status))counts[j.status]++;
    return {counts,total:this.jobs.size,workers:[...this.workers.entries()].map(([id,w])=>({id,lastSeen:w.lastSeen,capabilities:w.ops})),mode:'v13-cooperative/at-least-once',lease_ms:this.leaseMs,cooperation:{enabled:this.enabled,coalescing:this.coalesce,cache_entries:this.cache.size,...this.metrics}};
  }
}
function expose(job){return {...publicJob(job),provenance:job.provenance||'worker-execution'};}
module.exports={CooperativeStore,expose,SAFE_CACHE_OPS,hash};
