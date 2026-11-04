#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(process.env.QNE_ROOT||path.join(__dirname,'..'));
const sourceDir=path.join(root,'imports_20261104');
function digest(s){return crypto.createHash('sha256').update(s).digest('hex');}
function unique(a){return [...new Set(a)].sort();}
function names(re,text){return [...text.matchAll(re)].map(m=>m[1]);}
function alias(stem){if(stem==='noyau'||stem==='micronoyau')return 'core.'+stem;if(stem==='mathlib')return 'math.mathlib';if(stem==='bibliio'||stem==='biblio')return 'library.bibliio';if(stem.startsWith('dqiv')||stem==='patch_dqiv_hw')return 'dqiv.'+stem;return 'legacy.'+stem;}
function analyzeFile(file){const code=fs.readFileSync(file,'utf8');const stem=path.basename(file,'.js');
 const cjs=names(/\bexports\.([\w$]+)\s*=/g,code).concat(names(/\bmodule\.exports\.([\w$]+)\s*=/g,code));
 const objectMatch=code.match(/\bmodule\.exports\s*=\s*\{([^}]{0,3000})\}/);
 if(objectMatch){cjs.push(...names(/(?:^|,)\s*([\w$]+)\s*:/g,objectMatch[1]));cjs.push(...names(/(?:^|,)\s*([\w$]+)\s*(?:,|$)/g,objectMatch[1]));}
 const esm=names(/\bexport\s+(?:async\s+)?(?:function|class|const|let|var)\s+([\w$]+)/g,code);
 const exported=unique([...cjs,...esm]);
 const declared=unique([...names(/\b(?:async\s+)?function\s+([\w$]+)\s*\(/g,code),...names(/\b(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[\w$]+\s*=>)/g,code)]);
 const hasCjs=/\bmodule\.exports\b|\bexports\.[\w$]+/.test(code),hasEsm=/\bexport\s+(?:default|\{|async\s+function|function|class|const|let|var)\b/.test(code);
 const style=hasCjs&&hasEsm?'mixed':hasCjs?'cjs':hasEsm?'esm':'script';
 const check=cp.spawnSync(process.execPath,['--check',file],{encoding:'utf8',timeout:10000});
 return {name:path.basename(file),alias:alias(stem),style,syntax:check.status===0?'PASS':'FAIL',hash_sha256:digest(code),exported_candidates:exported,declared_not_exported:declared.filter(n=>!exported.includes(n)),exports_unknown:style!=='script'&&!exported.length,comment:'Analyse statique indicative, non preuve qu’une fonction est appelable.'};}
function audit(){if(!fs.existsSync(sourceDir))throw Error('Dossier imports_20261104 introuvable dans '+root);
 const files=fs.readdirSync(sourceDir).filter(n=>n.endsWith('.js')&&fs.statSync(path.join(sourceDir,n)).isFile()).sort().map(n=>analyzeFile(path.join(sourceDir,n)));
 const core=['core.noyau','core.micronoyau','math.mathlib','library.bibliio'];const missing=core.filter(a=>!files.some(f=>f.alias===a));
 const summary={modules:files.length,syntax_ok:files.filter(f=>f.syntax==='PASS').length,exports_detected:files.filter(f=>f.exported_candidates.length).length,script_only:files.filter(f=>f.style==='script').length,unresolved_core:missing,delta_qiv:files.filter(f=>f.alias.startsWith('dqiv.')).length};
 const out={schema:'qne.v11.2.interfaces/1',timestamp:new Date().toISOString(),source:'~/QNE/imports_20261104',status:summary.syntax_ok===files.length&&missing.length===0?'INTERFACES_AUDITED':'INCOMPLETE',summary,modules:files};
 fs.writeFileSync(path.join(__dirname,'QNE_V11_2_INTERFACES.json'),JSON.stringify(out,null,2)+'\n');return out;}
function invokePipeline(file){const bridge=require('../qne_v11/lib/bridge');const {audit:oldAudit}=require('../qne_v11/lib/inspect');const report=oldAudit(root);
 const doc=JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
 if(!Array.isArray(doc.stages)||doc.stages.length===0||doc.stages.length>32)throw Error('stages: tableau de 1..32 requis');
 let value=doc.input;const stages=[];
 for(const [i,step] of doc.stages.entries()){
  if(typeof step.alias!=='string'||typeof step.method!=='string')throw Error('Etape '+i+': alias/methode manquant');
  const args=step.usePrevious===false?(step.args||[]):[value,...(step.args||[])];if(!Array.isArray(args))throw Error('args doit etre un tableau');
  const timeout=Number(step.timeout??15000);
  const start=process.hrtime.bigint();const res=bridge.call(root,report,step.alias,step.method,args,{timeout});
  const elapsed=Number(process.hrtime.bigint()-start)/1e6;
  if(!res.ok)throw Error('Etape '+i+' ('+step.alias+'.'+step.method+') : '+(res.error||res.stderr||'Erreur'));
  value=res.result.value;stages.push({alias:step.alias,method:step.method,elapsed_ms:elapsed});
 }
 const out={status:'PASSED',source:'EXPLICIT_PIPELINE',stages,result:value};
 fs.writeFileSync(path.join(__dirname,'QNE_V11_2_PIPELINE_RESULTATS.json'),JSON.stringify(out,null,2)+'\n');return out;
}
function main(){const cmd=process.argv[2]||'audit';if(cmd==='audit'){const r=audit();console.log('QNE V11.2 | '+r.status+' | '+JSON.stringify(r.summary));console.log('Rapport: '+path.join(__dirname,'QNE_V11_2_INTERFACES.json'));}
 else if(cmd==='pipeline'){const file=process.argv[3];if(!file)throw Error('Passer le chemin du manifeste JSON');const r=invokePipeline(file);console.log(JSON.stringify(r,null,2));}
 else throw Error('Commande inconnue: '+cmd);
}
if(require.main===module)try{main()}catch(e){console.error('QNE V11.2 : '+e.message);process.exitCode=1;}
module.exports={audit,alias,invokePipeline};
