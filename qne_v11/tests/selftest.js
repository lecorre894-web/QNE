'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {audit}=require('../lib/inspect'),bridge=require('../lib/bridge');
function main(){const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'qne-v11-'));
 try{
  const imp=path.join(tmp,'imports_20261104');fs.mkdirSync(imp);
  fs.writeFileSync(path.join(imp,'noyau.js'),'module.exports={double:n=>n*2};\n');
  fs.writeFileSync(path.join(imp,'micronoyau.js'),'module.exports={plus:(n,m)=>n+m};\n');
  fs.writeFileSync(path.join(imp,'mathlib.js'),'module.exports={square:n=>n*n};\n');
  fs.writeFileSync(path.join(imp,'bibliio.js'),'module.exports={label:n=>"QNE:"+n};\n');
  fs.writeFileSync(path.join(imp,'dqiv_master.js'),'console.log("DQIV OK");\n');
  fs.writeFileSync(path.join(imp,'dqiv_bridge.js'),'const a=require("./dqiv_master.js");\n');
  const r=audit(tmp);assert.equal(r.status,'CATALOG_VALID');assert.equal(r.summary.syntax_ok,6);assert.equal(r.summary.dqiv_modules,2);assert.equal(r.summary.unresolved_relative,0);
  let x=bridge.call(tmp,r,'core.noyau','double',[7]);assert.equal(x.ok,true);assert.equal(x.result.value,14);
  x=bridge.call(tmp,r,'core.micronoyau','plus',[14,6]);assert.equal(x.result.value,20);
  x=bridge.call(tmp,r,'math.mathlib','square',[5]);assert.equal(x.result.value,25);
  x=bridge.call(tmp,r,'library.bibliio','label',['25']);assert.equal(x.result.value,'QNE:25');
  x=bridge.run(tmp,r,'dqiv.dqiv_master');assert.equal(x.ok,true);assert.match(x.stdout,/DQIV OK/);
  fs.writeFileSync(path.join(imp,'dqiv_bad.js'),'function ((( {');
  const bad=audit(tmp);assert.equal(bad.summary.syntax_failed,1);
  fs.writeFileSync(path.join(imp,'dqiv_bad.js'),'const x = require("./missing.js");\n');
  const missing=audit(tmp);assert.equal(missing.summary.unresolved_relative,1);
  console.log('QNE V11 SELFTEST : PASS | 13 controles | passage reel par processus isoles');return true;
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
module.exports={main};if(require.main===module)main();
