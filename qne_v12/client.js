#!/usr/bin/env node
'use strict';
const fs=require('node:fs');const {request,secret,secretFile}=require('./lib/common');
async function main(){const [cmd,...args]=process.argv.slice(2);
  if(cmd==='init'){secret(true);console.log('SECRET INITIALISE (mode 0600) : '+secretFile);return;}
  if(cmd==='status'){console.log(JSON.stringify(await request('GET','/v1/status'),null,2));return;}
  if(cmd==='get'){if(!/^[0-9a-f-]{36}$/.test(args[0]||''))throw Error('Identifiant invalide');console.log(JSON.stringify(await request('GET','/v1/tasks/'+args[0]),null,2));return;}
  if(cmd==='submit'){
    if(!args[0]||!args[1])throw Error('Usage : submit operation \'{"param":"valeur"}\' [cle-idempotente]');
    const body={op:args[0],payload:JSON.parse(args[1])};if(args[2])body.key=args[2];
    console.log(JSON.stringify(await request('POST','/v1/tasks',body),null,2));return;
  }
  if(cmd==='batch'){
    const count=Number(args[0]||12);if(!Number.isInteger(count)||count<1||count>100)throw Error('Batch 1..100 requis');
    const jobs=[];for(let i=0;i<count;i++){const x=await request('POST','/v1/tasks',{op:'qne.gcd',payload:{a:String((i+2)*42),b:'18'},key:'sample-'+process.pid+'-'+i});jobs.push(x.task.id);}
    const deadline=Date.now()+30000;let done=[];
    while(Date.now()<deadline){const all=await Promise.all(jobs.map(id=>request('GET','/v1/tasks/'+id)));done=all.map(x=>x.task);if(done.every(j=>['done','failed'].includes(j.status)))break;await new Promise(r=>setTimeout(r,200));}
    const workers=[...new Set(done.map(j=>j.worker).filter(Boolean))];const ok=done.filter(j=>j.status==='done').length;
    console.log(JSON.stringify({requested:jobs.length,completed:ok,workers,all_verified:ok===jobs.length,examples:done.slice(0,3)},null,2));if(ok!==jobs.length)process.exitCode=2;return;
  }
  throw Error('Commandes: init | status | get ID | submit OP JSON [CLE] | batch N');
}
main().catch(e=>{console.error('QNE V12 : '+e.message);process.exitCode=1;});
