#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {audit}=require('./lib/inspect');const bridge=require('./lib/bridge');
const command=process.argv[2]||'audit';
const cp=require('node:child_process');
const root=path.resolve(process.env.QNE_ROOT||path.dirname(__dirname));const dir=__dirname;
function save(name,obj){const p=path.join(dir,name);fs.writeFileSync(p,JSON.stringify(obj,null,2)+'\n');return p;}
function readJson(s){try{return JSON.parse(s)}catch{throw Error('JSON invalide : '+s.slice(0,80))}}
function opts(xs){const ix=xs.indexOf('--timeout');return {timeout:ix>=0?Number(xs[ix+1]):15000};}
function main(){if(command==='selftest')return require('./tests/selftest').main();
 if(command==='matrix'){
  const exp=Number(process.argv[3]||'17');const words=Array.from({length:32},(_,i)=>(1<<i)>>>0);
  const out=bridge.matrix32(root,exp,words);
  if(!out.unchanged||out.result.some((x,i)=>x!==words[i]))throw Error('Echec identite matricielle');
  console.log('MATRICE 32x32 GF(2) : PASS | identite ^ '+exp+' | moteur='+out.engine);return;
 }
 if(command==='numeric'){
  const [N,steps,reps]=process.argv.slice(3).map(Number);
  if(!Number.isSafeInteger(N)||N<4||N>1048576||!Number.isInteger(steps)||steps<1||steps>1000||!Number.isInteger(reps)||reps<1||reps>100)throw Error('Usage: numeric N(4..1048576) pas(1..1000) repetitions(1..100)');
  const selector=path.join(root,'qne_v9','qne_v9_select.js');if(!fs.existsSync(selector))throw Error('Selecteur V9 introuvable');
  const p=cp.spawnSync(process.execPath,[selector,'--bench',String(N),String(steps),String(reps)],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:1000000});
  if(p.stdout)process.stdout.write(p.stdout);if(p.stderr)process.stderr.write(p.stderr);
  if(p.status!==0)throw Error('Moteur numerique termine avec code '+p.status+' ('+(p.error?.message||'')+')');
  return;
 }
 const r=audit(root);const auditFile=save('QNE_V11_AUDIT.json',r);
 const map=Object.fromEntries(r.files.map(f=>[f.alias,{file:'imports_20261104/'+f.name,style:f.style,syntax:f.syntax,sha256:f.sha256}]));
 save('QNE_V11_REGISTRE.json',{schema:'qne.v11.registry/1',generated_utc:r.generated_utc,modules:map});
 if(command==='audit'||command==='catalog'){
 console.log('QNE V11 | '+r.status+' | '+r.summary.total+' modules | syntaxe '+r.summary.syntax_ok+'/'+r.summary.total+' | DQIV '+r.summary.dqiv_modules);
 console.log('Cœurs : '+['core.noyau','core.micronoyau','math.mathlib','library.bibliio'].map(a=>a+(map[a]?' OK':' ABSENT')).join(' / '));
 console.log('Dependances relatives non resolues : '+r.summary.unresolved_relative);
 if(r.summary.possible_secret_files.length)console.log('ATTENTION : indices de secrets detectes dans : '+r.summary.possible_secret_files.join(', '));
 console.log('Rapport : '+auditFile);
 if(command==='catalog')for(const [a,o] of Object.entries(map))console.log(a+' -> '+o.file+' ['+o.style+']');
 if(r.summary.syntax_failed||r.summary.core_missing.length)process.exitCode=2;
 return;
 }
 if(command==='run'){
 const alias=process.argv[3];if(!alias)throw Error('run exige un alias');
 console.log('Execution volontaire du script '+alias+' dans un processus Node separe.');
 const raw=process.argv.slice(4),idx=raw.indexOf('--timeout');
 const argv=idx>=0?[...raw.slice(0,idx),...raw.slice(idx+2)]:raw;
 const ans=bridge.run(root,r,alias,argv,opts(raw));
 if(ans.stdout)process.stdout.write(ans.stdout);if(ans.stderr)process.stderr.write(ans.stderr);
 console.log('Termine : '+(ans.ok?'PASS':'FAIL')+(ans.timeout?' (delai depasse)':''));if(!ans.ok)process.exitCode=1;return;
 }
 if(command==='call'){
 const alias=process.argv[3],method=process.argv[4],args=readJson(process.argv[5]||'[]');
 if(!Array.isArray(args))throw Error('Les arguments doivent etre un tableau JSON');
 const out=bridge.call(root,r,alias,method,args,opts(process.argv.slice(6)));console.log(JSON.stringify(out,null,2));if(!out.ok)process.exitCode=1;return;
 }
 if(command==='pipeline'){
 const manifest=path.resolve(process.argv[3]||'');const pipeline=readJson(fs.readFileSync(manifest,'utf8'));
 if(!Array.isArray(pipeline.stages)||!pipeline.stages.length)throw Error('stages requis');
 let value=pipeline.input;let i=0;for(const st of pipeline.stages){
  if(!st.alias||!st.method)throw Error('Etape incomplete');
  const args=st.usePrevious===false?(st.args||[]):[value,...(st.args||[])];
  const out=bridge.call(root,r,st.alias,st.method,args,{timeout:st.timeout||15000});
  if(!out.ok)throw Error('Etape '+i+' '+st.alias+' : '+(out.stderr||out.error));value=out.result.value;i++;
 }console.log(JSON.stringify({ok:true,stages:i,value},null,2));return;
 }
 throw Error('Commande inconnue : '+command);
}
try{main()}catch(e){console.error('QNE V11 : '+e.message);process.exitCode=1;}
