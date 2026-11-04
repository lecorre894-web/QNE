'use strict';
const cp = require('node:child_process');
const path = require('node:path');
const {entry} = require('./catalogue');
const PREFIX = 'QNE_V113_RESULT=';
function launch(root, snapshot, alias, mode, method = null, args = [], options = {}) {
  const src = entry(snapshot,root,alias,options.acceptDrift===true);
  if (mode !== 'script' && !['cjs','mixed'].includes(src.style)) throw Error('Le module est un script autonome sans export verifie : '+alias);
  let timeout = Number(options.timeout ?? 5000);
  if (!Number.isInteger(timeout) || timeout < 100 || timeout > 30000) throw Error('Timeout 100..30000 ms');
  let out;
  if (mode === 'script') {
    out = cp.spawnSync(process.execPath,['--max-old-space-size=256',src.file],{
      cwd:path.dirname(src.file),encoding:'utf8',timeout,maxBuffer:128*1024,env:{...process.env,QNE_V113:'1'}
    });
    return { ok:out.status===0&&!out.error, mode, alias, exit_code:out.status, timeout:out.error?.code==='ETIMEDOUT', stdout:(out.stdout||'').slice(0,12000), stderr:(out.stderr||'').slice(0,12000), error:out.error?.message||null, hash_verified:src.matched };
  }
  const payload = JSON.stringify({file:src.file,mode,method,args});
  if (Buffer.byteLength(payload)>64000) throw Error('Requete trop volumineuse');
  out = cp.spawnSync(process.execPath,['--max-old-space-size=256',path.join(__dirname,'worker.js')],{
    input:payload,cwd:path.dirname(src.file),encoding:'utf8',timeout,maxBuffer:128*1024,env:{...process.env,QNE_V113:'1'}
  });
  const lines=(out.stdout||'').split('\n').filter(line=>line.startsWith(PREFIX));
  let parsed = null;
  if (lines.length) try{parsed=JSON.parse(lines.at(-1).slice(PREFIX.length));}catch{}
  return {ok:out.status===0&&!out.error&&parsed?.ok===true,mode,alias,hash_verified:src.matched,exit_code:out.status,timeout:out.error?.code==='ETIMEDOUT',data:parsed,logs:(out.stdout||'').split('\n').filter(line=>!line.startsWith(PREFIX)).join('\n').slice(0,2000),stderr:(out.stderr||'').slice(0,3000),error:out.error?.message||(!parsed?'Reponse de worker absente':null)};
}
module.exports={launch};
