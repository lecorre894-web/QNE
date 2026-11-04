'use strict';
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
class Store{
  constructor(dir,{maxJobs=4000,leaseMs=15000,maxAttempts=3}={}){
    this.dir=dir;this.file=path.join(dir,'tasks.json');this.maxJobs=maxJobs;this.leaseMs=leaseMs;this.maxAttempts=maxAttempts;
    fs.mkdirSync(dir,{recursive:true,mode:0o700});
    this.jobs=new Map();this.keys=new Map();this.workers=new Map();
    if(fs.existsSync(this.file)){
      const s=JSON.parse(fs.readFileSync(this.file,'utf8'));
      for(const x of s.jobs||[]){
        if(x.status==='leased'){x.status='queued';x.lease=null;}
        this.jobs.set(x.id,x);if(x.key)this.keys.set(x.key,x.id);
      }
      this.save();
    }
  }
  save(){
    const tmp=this.file+'.'+process.pid+'.tmp';const data=JSON.stringify({schema:1,jobs:[...this.jobs.values()]});
    fs.writeFileSync(tmp,data,{encoding:'utf8',mode:0o600});fs.renameSync(tmp,this.file);
  }
  submit(op,payload,key){
    const signature=crypto.createHash('sha256').update(JSON.stringify({op,payload})).digest('hex');
    if(key&&this.keys.has(key)){
      const prev=this.jobs.get(this.keys.get(key));if(prev.signature!==signature){const e=Error('Cle idempotente associee a une autre tache');e.status=409;throw e;}return prev;
    }
    if(this.jobs.size>=this.maxJobs){const e=Error('Capacite locale atteinte');e.status=429;throw e;}
    const now=Date.now(),j={id:crypto.randomUUID(),op,payload,key:key||null,signature,status:'queued',attempts:0,created:now,updated:now,lease:null,worker:null,result:null,error:null};
    this.jobs.set(j.id,j);if(key)this.keys.set(key,j.id);this.save();return j;
  }
  sweep(){let changed=false,now=Date.now();for(const j of this.jobs.values())if(j.status==='leased'&&j.lease&&j.lease.until<now){j.lease=null;j.status=j.attempts>=this.maxAttempts?'failed':'queued';j.error=j.status==='failed'?'Nombre maximal de tentatives atteint':'Expiration du bail';j.updated=now;changed=true;}if(changed)this.save();}
  lease(worker,ops){this.sweep();this.workers.set(worker,{lastSeen:Date.now(),ops});const j=[...this.jobs.values()].find(j=>j.status==='queued'&&ops.includes(j.op));if(!j)return null;
    const token=crypto.randomBytes(24).toString('hex');j.status='leased';j.worker=worker;j.lease={token,until:Date.now()+this.leaseMs};j.attempts++;j.updated=Date.now();this.save();return {id:j.id,op:j.op,payload:j.payload,token,leaseMs:this.leaseMs,attempt:j.attempts};
  }
  heartbeat(worker,id,token){const j=this.jobs.get(id);if(!j||j.status!=='leased'||j.worker!==worker||j.lease.token!==token)return false;j.lease.until=Date.now()+this.leaseMs;this.workers.set(worker,{...this.workers.get(worker),lastSeen:Date.now()});return true;}
  complete(worker,id,token,ok,result,error){const j=this.jobs.get(id);if(!j||j.status!=='leased'||j.worker!==worker||!j.lease||j.lease.token!==token)return false;
    j.status=ok?'done':'failed';j.result=ok?result:null;j.error=ok?null:String(error||'Erreur').slice(0,300);j.lease=null;j.updated=Date.now();this.save();return true;}
  get(id){return this.jobs.get(id);}
  stats(){this.sweep();const counts={queued:0,leased:0,done:0,failed:0};for(const j of this.jobs.values())counts[j.status]++;
    return {counts,total:this.jobs.size,workers:[...this.workers.entries()].map(([id,w])=>({id,lastSeen:w.lastSeen,capabilities:w.ops})),mode:'single-coordinator/at-least-once',lease_ms:this.leaseMs};}
}
function publicJob(j){if(!j)return null;return {id:j.id,op:j.op,status:j.status,attempts:j.attempts,worker:j.worker,created:j.created,updated:j.updated,result:j.result,error:j.error};}
module.exports={Store,publicJob};
