#!/usr/bin/env node
'use strict';
const path=require('node:path'),fs=require('node:fs');
const {loadSnapshot,audit} = require('./lib/catalogue');
const {launch} = require('./lib/runtime');
const root=path.resolve(process.env.QNE_ROOT||path.join(__dirname,'..'));
const report=path.join(__dirname,'QNE_V11_3_INTEGRATION.json');
const args=process.argv.slice(2);const command=args.shift()||'audit';
function opt(name){const i=args.indexOf(name);return i>=0?args[i+1]:null;}
function flag(name){return args.includes(name);}
function write(data,name=report){fs.writeFileSync(name,JSON.stringify(data,null,2)+'\n');return name;}
function json(s){try{return JSON.parse(s)}catch{throw Error('Argument JSON invalide')}}
function assertExplicit(){if(!flag('--allow-exec'))throw Error('Chargement/execution non lance : ajouter --allow-exec pour autoriser explicitement');}
function matrix(){
  const api=require(path.join(root,'qne_v10','qne_v10_matrix.js'));
  const a=new Uint32Array(32);for(let i=0;i<32;i++)a[i]=((1<<((i+1)%32))>>>0);
  const copy=new Uint32Array(a);
  const result=api.power32(a,32);
  if(result.length!==32 || result.some((v,i)=>v!==((1<<i)>>>0)) || a.some((v,i)=>v!==copy[i]))throw Error('Controle matrice de rotation ^32 FAIL');
  return { status:'PASSED', operation:'GF2 rotation 32x32 ^32', engine:api.getSelection(), exact:'Uint32', unchanged:true };
}
function main(){
  if(command==='selftest') return require('./tests/selftest').main();
  const snapshot=loadSnapshot();
  if(command==='audit'){
    const result=audit(root,snapshot);write(result);
    console.log('QNE V11.3 | '+result.status+' | '+JSON.stringify(result.summary));
    console.log('Audit : '+report);
    if(result.status!=='INVENTORY_VERIFIED')process.exitCode=2;
    return;
  }
  if(command==='matrix') { const result=matrix();console.log(JSON.stringify(result,null,2));return; }
  if(['probe','call','run'].includes(command)){
    const alias=args[0];if(!alias)throw Error('Alias requis');assertExplicit();
    const mode=command==='run'?'script':command;
    const method=command==='call'?args[1]:null;
    if(command==='call'&&!method)throw Error('Chemin de fonction requis, par exemple GEO.distance');
    const input=command==='call'?json(args[2]||'[]'):[];
    if(!Array.isArray(input))throw Error('Arguments doivent etre un tableau JSON');
    const result=launch(root,snapshot,alias,mode,method,input,{ timeout: opt('--timeout')||5000,acceptDrift:flag('--accept-drift') });
    console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
    return;
  }
  if(command==='pipeline') {
    assertExplicit();const manifest=args[0];if(!manifest)throw Error('Manifeste JSON requis');
    const doc=json(fs.readFileSync(path.resolve(manifest),'utf8'));
    if(!Array.isArray(doc.stages)||doc.stages.length<1||doc.stages.length>16)throw Error('1..16 etapes requises');
    let value=doc.input;const trace=[];
    for(let i=0;i<doc.stages.length;i++){
      const st=doc.stages[i];if(typeof st.alias!=='string'||typeof st.method!=='string'||(st.args&&!Array.isArray(st.args)))throw Error('Etape '+i+' invalide');
      const callArgs=st.usePrevious===false?(st.args||[]):[value,...(st.args||[])];
      const start=process.hrtime.bigint();
      const r=launch(root,snapshot,st.alias,'call',st.method,callArgs,{timeout:st.timeout||5000,acceptDrift:flag('--accept-drift')});
      if(!r.ok)throw Error('Etape '+i+' a echoue : '+JSON.stringify(r.data||r.error));
      value=r.data.value;trace.push({alias:st.alias,method:st.method,elapsed_ms:Number(process.hrtime.bigint()-start)/1e6,sha256_match:r.hash_verified});
    }
    const result={status:'PASSED',stages:trace,value,scope:'Integrations explicites seulement; aucun benchmark global implicite'};
    write(result,path.join(__dirname,'QNE_V11_3_PIPELINE.json'));console.log(JSON.stringify(result,null,2));return;
  }
  throw Error('Commande inconnue : '+command);
}
try{main()}catch(e){console.error('QNE V11.3 : '+e.message);process.exitCode=1;}
