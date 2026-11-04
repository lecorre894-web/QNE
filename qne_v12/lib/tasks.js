'use strict';
// Only allowlisted, pure and bounded operations can be sent over the network.
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const cp = require('node:child_process');
const TASKS = ['qne.sha256', 'qne.gcd', 'qne.modpow', 'qne.matrix.rotate32', 'qne.mathlib.pgcd', 'qne.core.xor.checked'];
function uIntString(x, maxDigits=2000) {
  if (!(typeof x === 'string' && /^\d+$/.test(x) && x.length <= maxDigits)) throw Error('Entier decimal positif attendu');
  return BigInt(x);
}
function gcd(a,b){a=BigInt(a);b=BigInt(b);while(b){const r=a%b;a=b;b=r;}return a;}
function validTask(t) {
  if (!t || typeof t !== 'object' || Array.isArray(t) || !TASKS.includes(t.op) || !t.payload || typeof t.payload !== 'object' || Array.isArray(t.payload)) throw Error('Operation inconnue ou charge invalide');
  const p=t.payload;
  switch(t.op){
    case 'qne.sha256': if(typeof p.text!=='string'||Buffer.byteLength(p.text)>65536)throw Error('Texte trop long');break;
    case 'qne.gcd': uIntString(p.a);uIntString(p.b);break;
    case 'qne.modpow': uIntString(p.base,1024);uIntString(p.exp,1024);if(uIntString(p.mod,1024)<=0n)throw Error('Modulo invalide');break;
    case 'qne.matrix.rotate32': if(!Number.isSafeInteger(p.exp)||p.exp<0||p.exp>1000000)throw Error('Exposant 0..1000000 requis');break;
    case 'qne.mathlib.pgcd': if(!Number.isSafeInteger(p.a)||!Number.isSafeInteger(p.b)||p.a<0||p.b<0||p.a>1000000||p.b>1000000)throw Error('Petits entiers requis pour Mathlib');break;
    case 'qne.core.xor.checked': if(!Number.isInteger(p.a)||!Number.isInteger(p.b)||p.a<0||p.a>0x7fffffff||p.b<0||p.b>0x7fffffff)throw Error('Entiers non signes 31 bits requis');break;
  }
  return t;
}
function capabilities(){
  const ops=TASKS.slice(0,4);
  const root=process.env.QNE_ROOT||path.resolve(__dirname,'..','..');
  if(process.env.QNE_V12_ALLOW_LEGACY==='1' && fs.existsSync(path.join(root,'qne_v11_3','qne_v11_3.js'))){ops.push('qne.mathlib.pgcd','qne.core.xor.checked');}
  return ops;
}
function invokeLegacy(root,alias,method,args){
  const cli=path.join(root,'qne_v11_3','qne_v11_3.js');
  const r=cp.spawnSync(process.execPath,[cli,'call',alias,method,JSON.stringify(args),'--allow-exec'],{
    cwd:root,encoding:'utf8',timeout:4500,maxBuffer:100*1024,env:{...process.env,QNE_ROOT:root}});
  if(r.error)throw Error('QNE V11.3: '+r.error.message);
  if(r.status!==0)throw Error('Appel V11.3 refuse: '+(r.stderr||r.stdout).slice(0,300));
  let x;try{x=JSON.parse(r.stdout);}catch{throw Error('V11.3 retour non JSON');}
  if(!x.ok||!x.data||!x.data.ok)throw Error('V11.3 appel invalide');
  return x.data.value;
}
function compute(task) {
  validTask(task);const p=task.payload;
  if(task.op==='qne.sha256')return {hex:crypto.createHash('sha256').update(p.text).digest('hex')};
  if(task.op==='qne.gcd')return {decimal:gcd(uIntString(p.a),uIntString(p.b)).toString()};
  if(task.op==='qne.modpow'){
    let base=uIntString(p.base,1024),exp=uIntString(p.exp,1024),mod=uIntString(p.mod,1024),out=1n%mod;base%=mod;
    while(exp){if(exp&1n)out=out*base%mod;base=base*base%mod;exp>>=1n;}
    return {decimal:out.toString()};
  }
  if(task.op==='qne.matrix.rotate32'){
    const root=process.env.QNE_ROOT||path.resolve(__dirname,'..','..');
    const file=path.join(root,'qne_v10','qne_v10_matrix.js');
    if(!fs.existsSync(file))throw Error('QNE V10 manquant');
    const api=require(file);const m=new Uint32Array(32);
    for(let i=0;i<32;i++)m[i]=(1<<((i+1)%32))>>>0;
    const copy=Uint32Array.from(m);const res=api.power32(m,p.exp);
    if(!res||res.length!==32||res.some((x,i)=>x!==((1<<((i+p.exp)%32))>>>0)) || m.some((x,i)=>x!==copy[i]))throw Error('V10 resultat matriciel non conforme');
    return {verified:true,engine:api.getSelection(),digest:crypto.createHash('sha256').update(Buffer.from(res.buffer,res.byteOffset,res.byteLength)).digest('hex')};
  }
  const root=process.env.QNE_ROOT||path.resolve(__dirname,'..','..');
  if(process.env.QNE_V12_ALLOW_LEGACY!=='1')throw Error('Appels legacy desactives');
  if(task.op==='qne.mathlib.pgcd'){
    const got=invokeLegacy(root,'math.mathlib','ALG.pgcd',[p.a,p.b]);
    const expected=Number(gcd(BigInt(p.a),BigInt(p.b)));
    if(typeof got!=='number'||got!==expected)throw Error('Ecart Mathlib PGCD: '+JSON.stringify({got,expected}));
    return {value:got,independent_check:true};
  }
  if(task.op==='qne.core.xor.checked'){
    const got=invokeLegacy(root,'core.noyau','xor',[p.a,p.b]);
    const expected=(p.a^p.b)>>>0;
    if(typeof got!=='number'||got!==expected)throw Error('Ecart Noyau XOR: '+JSON.stringify({got,expected}));
    return {value:got,independent_check:true};
  }
  throw Error('Operation non prise en charge');
}
module.exports={TASKS,validTask,capabilities,compute,gcd};
