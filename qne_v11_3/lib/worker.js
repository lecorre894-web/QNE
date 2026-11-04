'use strict';
// Executes a single EXPLICITLY requested CommonJS inspection or call in a disposable process.
// This is NOT a general-purpose security sandbox. Never load untrusted code.
const fs = require('node:fs');
const PREFIX = 'QNE_V113_RESULT=';
function plain(value, depth = 0, seen = new WeakSet()) {
  if (depth > 8) return { truncated: true };
  if (typeof value === 'bigint') return { type: 'BigInt', decimal: value.toString() };
  if (typeof value === 'undefined') return { type: 'undefined' };
  if (typeof value === 'function') return { type: 'function', name: value.name || null };
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return { type: 'circular' };
  seen.add(value);
  if (ArrayBuffer.isView(value)) return { type: value.constructor.name, length: value.length, truncated: value.length > 4096, data: Array.from(value.slice(0,4096), v => plain(v, depth+1, seen)) };
  if (Array.isArray(value)) return value.slice(0, 4096).map(v=>plain(v,depth+1,seen));
  const out = {};for (const key of Object.keys(value).slice(0, 128)) out[key] = plain(value[key], depth + 1, seen);return out;
}
function signature(value) {
  if (value === null) return { type: 'null' };
  if (typeof value === 'function') return { type: 'function', arity: value.length };
  if (typeof value !== 'object') return { type: typeof value };
  const keys = Object.keys(value).slice(0, 128);
  return { type: Array.isArray(value) ? 'array' : 'object', keys: Object.fromEntries(keys.map(k=>[k, typeof value[k]])) };
}
function decode(value, depth = 0) {
  if (depth > 8) throw Error('Arguments imbriques trop profondement');
  if (Array.isArray(value)) return value.map(v => decode(v, depth+1));
  if (value === null || typeof value !== 'object') return value;
  if (value.type === 'BigInt') {
    if (typeof value.decimal !== 'string' || !/^-?\d{1,10000}$/.test(value.decimal)) throw Error('BigInt invalide');
    return BigInt(value.decimal);
  }
  if (value.type === 'Uint32Array') {
    if (!Array.isArray(value.data) || value.data.length > 4096 || !value.data.every(n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff)) throw Error('Uint32Array invalide');
    return Uint32Array.from(value.data);
  }
  const out={};for(const [k,v] of Object.entries(value)) {if (['__proto__','constructor','prototype'].includes(k)) throw Error('Cle d argument interdite');out[k]=decode(v,depth+1);}return out;
}
function resolveMethod(module, method) {
  if (method === 'default' && typeof module === 'function') return {target:module,receiver:null};
  let target = module, receiver = null;
  const parts = method.split('.');
  if (!parts.length || parts.length > 4 || parts.some(p => !/^[A-Za-z_$][\w$]*$/.test(p) || ['constructor','prototype','__proto__'].includes(p))) throw Error('Chemin fonction interdit');
  for (const part of parts) {
    if (target == null || !Object.prototype.hasOwnProperty.call(target, part)) throw Error('Export absent : ' + method);
    receiver = target;target = target[part];
  }
  return { target, receiver };
}
function main() {
  const request = JSON.parse(fs.readFileSync(0, 'utf8'));
  const exported = require(request.file);
  if (request.mode === 'probe') {
    const top = signature(exported), children = {};
    if (exported && typeof exported === 'object') for (const k of Object.keys(exported).slice(0, 64)) if (exported[k] && typeof exported[k] === 'object') children[k] = signature(exported[k]);
    return { status: 'PROBED', exports: top, nested: children };
  }
  if (request.mode === 'call') {
    const { target, receiver } = resolveMethod(exported, request.method);
    if (typeof target !== 'function') throw Error('Export non appelable : ' + request.method);
    if (!Array.isArray(request.args) || request.args.length > 32) throw Error('Arguments JSON non conformes');
    const result = target.apply(receiver, request.args.map(v => decode(v)));
    if (result && typeof result.then === 'function') throw Error('Fonction asynchrone non prise en charge dans V11.3');
    return { status:'CALLED', value:plain(result) };
  }
  throw Error('Mode inconnu');
}
try { const result = main();process.stdout.write(PREFIX+JSON.stringify({ok:true,...result})+'\n'); }
catch (e) { process.stdout.write(PREFIX+JSON.stringify({ok:false,error:e.message})+'\n');process.exitCode = 1; }
