'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {audit,sha256,entry}=require('../lib/catalogue');
const {launch}=require('../lib/runtime');
function main(){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'qne-v113-'));let checks=0;
 const check=(x,msg)=>{assert.ok(x,msg);checks++;};
 try{
  const folder=path.join(tmp,'imports_20261104');fs.mkdirSync(folder);
  const sources={
   'noyau.js': 'module.exports = { passage(n){return n+1} };\n',
   'mathlib.js': 'exports.GEO={ triple(n){return 3*n}, incBig(n){return n+1n} };exports.VAR={ carre(n){return n*n} };\n',
   'micronoyau.js':'function flot(n){return n+1;}\nconsole.log("MICRONOYAU",flot(2));\n',
   'biblio.js':'console.log("BIBLIO",2+3);\n',
   'dqiv_bridge.js':'console.log("DQIV", 4 + 4);\n',
  };
  const aliases={'noyau.js':'core.noyau','mathlib.js':'math.mathlib','micronoyau.js':'core.micronoyau','biblio.js':'library.bibliio','dqiv_bridge.js':'dqiv.dqiv_bridge'};
  const modules=[];
  for(const [name,src] of Object.entries(sources)){
   fs.writeFileSync(path.join(folder,name),src);
   modules.push({name,alias:aliases[name],style:name==='mathlib.js'||name==='noyau.js'?'cjs':'script',hash_sha256:sha256(Buffer.from(src)),exported_candidates:[],declared_not_exported:[],exports_unknown:false});
  }
  const snapshot={schema:'qne.v11.2.interfaces/1',timestamp:'fixture',modules};
  const a=audit(tmp,snapshot);check(a.status==='INVENTORY_VERIFIED','inventaire');check(a.summary.syntax_pass===5,'syntaxe');check(a.summary.sha256_match===5,'hachages');
  let r=launch(tmp,snapshot,'math.mathlib','probe');check(r.ok,'probe');check(r.data.exports.keys.GEO==='object','GEO');check(r.data.nested.GEO.keys.triple==='function','triple');
  r=launch(tmp,snapshot,'math.mathlib','call','GEO.triple',[7]);check(r.ok&&r.data.value===21,'appel GEO');
  r=launch(tmp,snapshot,'math.mathlib','call','GEO.incBig',[{type:'BigInt',decimal:'12345678901234567890'}]);check(r.ok&&r.data.value.type==='BigInt'&&r.data.value.decimal==='12345678901234567891','appel BigInt');
  r=launch(tmp,snapshot,'core.noyau','call','passage',[8]);check(r.ok&&r.data.value===9,'appel noyau');
  r=launch(tmp,snapshot,'dqiv.dqiv_bridge','script');check(r.ok&&r.stdout.includes('DQIV 8'),'script DQIV');
  r=launch(tmp,snapshot,'core.micronoyau','script');check(r.ok&&r.stdout.includes('MICRONOYAU 3'),'script micro');
  try{launch(tmp,snapshot,'core.micronoyau','call','flot',[3]);check(false,'interdiction script')}catch(e){check(e.message.includes('script autonome'),'interdiction script')}
  fs.appendFileSync(path.join(folder,'mathlib.js'),'// altered\n');
  try{entry(snapshot,tmp,'math.mathlib');check(false,'drift')}catch(e){check(e.message.includes('Empreinte'),'drift refuse')}
  const drift=entry(snapshot,tmp,'math.mathlib',true);check(!drift.matched,'drift visible');
  const b=audit(tmp,snapshot);check(b.status==='REVIEW_REQUIRED','drift audit');
  const other=launch(tmp,snapshot,'core.noyau','probe');check(other.ok,'process independant');
  console.log('QNE V11.3 SELFTEST : PASSED | '+checks+' controles | modules factices uniquement');
 } finally {fs.rmSync(tmp,{recursive:true,force:true});}
}
if(require.main===module)main();module.exports={main};
