'use strict';
const fs=require('node:fs');const path=require('node:path');const cp=require('node:child_process');
const MAXTIME=30000,MAXOUTPUT=128*1024;
function checkedTime(value){const v=Number(value??15000);if(!Number.isInteger(v)||v<100||v>120000)throw Error('timeout doit etre entre 100 et 120000 ms');return v;}
function invoke(file,method,args,options={}){const full=path.resolve(file);if(!fs.existsSync(full)||!fs.statSync(full).isFile())throw Error('Module introuvable : '+full);
 const timeout=checkedTime(options.timeout);let result;
 if(method==='script'){
   result=cp.spawnSync(process.execPath,['--max-old-space-size=256',full,...(args||[]).map(String)],{cwd:options.cwd||path.dirname(full),encoding:'utf8',timeout,maxBuffer:MAXOUTPUT,env:process.env});
 }else{
   const runner=path.join(__dirname,'worker.js');
   result=cp.spawnSync(process.execPath,['--max-old-space-size=256',runner,full,method,JSON.stringify(args||[])],{cwd:options.cwd||path.dirname(full),encoding:'utf8',timeout,maxBuffer:MAXOUTPUT,env:process.env});
 }
 const outcome={ok:result.status===0&&!result.error,exit_code:result.status,timeout:result.error?.code==='ETIMEDOUT',stdout:(result.stdout||'').slice(0,MAXOUTPUT),stderr:(result.stderr||'').slice(0,MAXOUTPUT),error:result.error?.message||null};
 if(method!=='script'&&outcome.ok){try{outcome.result=JSON.parse(outcome.stdout);delete outcome.stdout;}catch(e){outcome.ok=false;outcome.error='Sortie JSON illisible : '+e.message;}}
 return outcome;
}
function resolveAlias(root,report,alias){const match=report.files.find(x=>x.alias===alias);if(!match)throw Error('Alias inconnu : '+alias);const home=path.resolve(root,'imports_20261104'),full=path.resolve(home,match.name);if(!full.startsWith(home+path.sep))throw Error('Chemin refuse');return {file:full,style:match.style,name:match.name};}
function run(root,report,alias,args=[],opts={}){const m=resolveAlias(root,report,alias);return invoke(m.file,'script',args,opts);}
function call(root,report,alias,method,args=[],opts={}){if(!/^[A-Za-z_$][\w$]*$/.test(method))throw Error('Methode invalide');const m=resolveAlias(root,report,alias);if(m.style==='script')throw Error('Script autonome sans exports; utiliser la commande run : '+alias);return invoke(m.file,method,args,opts);}
function matrix32(root,exp,words){if(!Array.isArray(words)||words.length!==32)throw Error('32 mots Uint32 requis');const fn=path.join(root,'qne_v10','qne_v10_matrix.js');if(!fs.existsSync(fn))throw Error('QNE V10 absent (qne_v10/qne_v10_matrix.js)');const x=new Uint32Array(words.map(n=>Number(n)>>>0));const api=require(fn);const y=api.power32(x,Number(exp));return {engine:api.getSelection(),result:Array.from(y),unchanged:words.every((n,i)=>(Number(n)>>>0)===x[i])};}
module.exports={invoke,run,call,resolveAlias,matrix32};
