'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'qne-v11-2-'));
try{
 const dir=path.join(tmp,'imports_20261104');fs.mkdirSync(dir,{recursive:true});
 for(const [name,text] of Object.entries({
 'noyau.js':'module.exports={double:n=>n*2};\n',
 'micronoyau.js':'module.exports={plus:(a,b)=>a+b};\n',
 'mathlib.js':'module.exports={carre:n=>n*n};\n',
 'biblio.js':'module.exports={titre:n=>"QNE-"+n};\n',
 'dqiv_master.js':'function verifier(n){return n>0}\n',
 }))fs.writeFileSync(path.join(dir,name),text);
 const main=path.join(__dirname,'../qne_v11_2.js');const r=cp.spawnSync(process.execPath,[main,'audit'],{env:{...process.env,QNE_ROOT:tmp},encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/INTERFACES_AUDITED/);
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../QNE_V11_2_INTERFACES.json')));
 assert.equal(data.summary.modules,5);assert.equal(data.summary.syntax_ok,5);assert.equal(data.summary.delta_qiv,1);assert.deepEqual(data.summary.unresolved_core,[]);
 assert(data.modules.find(f=>f.name==='mathlib.js').exported_candidates.includes('carre'));
 assert(data.modules.find(f=>f.name==='dqiv_master.js').declared_not_exported.includes('verifier'));
 assert.equal(data.modules.find(f=>f.name==='biblio.js').alias,'library.bibliio');
 console.log('QNE V11.2 SELFTEST PASS : catalogue, alias, exports, scripts autonomes');
}finally{fs.rmSync(tmp,{recursive:true,force:true});fs.rmSync(path.join(__dirname,'../QNE_V11_2_INTERFACES.json'),{force:true});}
