'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const mod=require('node:module');
const builtins=new Set(mod.builtinModules.map(x=>x.replace(/^node:/,'')));
const CORE=new Set(['noyau','micronoyau']);
function alias(stem){if(CORE.has(stem))return 'core.'+stem;if(stem==='mathlib')return 'math.mathlib';if(stem==='bibliio'||stem==='biblio')return 'library.bibliio';if(/^dqiv(?:_|$)/.test(stem)||stem==='patch_dqiv_hw')return 'dqiv.'+stem;return 'legacy.'+stem;}
function safeRead(file){return fs.readFileSync(file,'utf8');}
function oneFile(dir,name){const file=path.resolve(dir,name);const text=safeRead(file), stem=name.slice(0,-3);
  const req=[...text.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)].map(x=>x[1]);
  const imports=[...text.matchAll(/\b(?:import\s+(?:[^;'"()]*?\s+from\s*)?|export\s+[^;'"()]*?\s+from\s*)['"]([^'"]+)['"]/g)].map(x=>x[1]);
  const dynamic=[...text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)].map(x=>x[1]);
  const cjs=/\bmodule\.exports\b|\bexports\.[a-zA-Z_$]/.test(text);
  const esm=/(?:^|\n)\s*(?:export\s+(?:default|const|let|function|class|\{|\*)|import\s+(?:\{|\*|[\w$]+\s+from|['"]))/m.test(text);
  const check=cp.spawnSync(process.execPath,['--check',file],{encoding:'utf8',timeout:10000,maxBuffer:500000});
  const err=check.error?.message||[check.stderr||'',check.stdout||''].join(' ').trim();
  const deps=[...new Set([...req,...imports,...dynamic])].map(dep=>({specifier:dep,kind:dep.startsWith('.')?'relative':builtins.has(dep.replace(/^node:/,''))?'builtin':'external'}));
  const tokenPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,/\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{20,}\b/,/\bgithub_pat_[a-zA-Z0-9_]{25,}\b/];
  const flags=tokenPatterns.some(r=>r.test(text))?['possible_secret']:[];
  return {name,alias:alias(stem),sha256:crypto.createHash('sha256').update(text).digest('hex'),bytes:Buffer.byteLength(text),syntax:check.status===0?'PASS':'FAIL',syntax_message:check.status===0?null:(err.slice(0,350)||'erreur syntaxique'),style:cjs&&esm?'mixed':esm?'esm':cjs?'commonjs':'script',dependencies:deps,flags};
}
function resolveRelative(dir,src,target){const base=path.resolve(dir,path.dirname(src),target);const choices=[base,base+'.js',base+'.json',path.join(base,'index.js')];const inDir=path.resolve(dir)+path.sep;return choices.filter(x=>x.startsWith(inDir)&&fs.existsSync(x)).map(x=>path.relative(dir,x));}
function audit(root){const dir=path.resolve(root,'imports_20261104');if(!fs.existsSync(dir))throw Error('Dossier absent : '+dir+' ; executer depuis ~/QNE apres importation des 72 modules.');
 const names=fs.readdirSync(dir).filter(x=>x.endsWith('.js')&&fs.statSync(path.join(dir,x)).isFile()).sort();
 const files=names.map(name=>oneFile(dir,name));
 for(const f of files){f.dependencies=f.dependencies.map(d=>({...d,resolved:d.kind==='relative'?resolveRelative(dir,f.name,d.specifier):[]}));}
 const unresolved=files.flatMap(f=>f.dependencies.filter(d=>d.kind==='relative'&&!d.resolved.length).map(d=>({from:f.name,target:d.specifier})));
 const byAlias=Object.fromEntries(files.map(f=>[f.alias,f.name]));
 const required=['core.noyau','core.micronoyau','math.mathlib','library.bibliio'];
 const dqiv=files.filter(f=>f.alias.startsWith('dqiv.'));
 const summary={total:files.length,syntax_ok:files.filter(x=>x.syntax==='PASS').length,syntax_failed:files.filter(x=>x.syntax==='FAIL').length,styles:Object.fromEntries(['script','commonjs','esm','mixed'].map(k=>[k,files.filter(x=>x.style===k).length])),dqiv_modules:dqiv.length,core_present:required.filter(a=>byAlias[a]),core_missing:required.filter(a=>!byAlias[a]),unresolved_relative:unresolved.length,possible_secret_files:files.filter(f=>f.flags.length).map(f=>f.name)};
 const report={schema:'qne.v11.audit/1',generated_utc:new Date().toISOString(),root,scope:'imports_20261104',summary,unresolved,files};
 const state=summary.syntax_failed?'SYNTAX_ERRORS':summary.core_missing.length?'INCOMPLETE':'CATALOG_VALID';
 report.status=state;
 return report;
}
module.exports={audit,alias};
