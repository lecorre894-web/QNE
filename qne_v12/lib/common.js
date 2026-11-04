'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
const ROOT = path.resolve(__dirname, '..', '..');
const dataDir = process.env.QNE_V12_DATA || path.join(os.homedir(), '.qne_v12_data');
const secretFile = process.env.QNE_V12_SECRET_FILE || path.join(os.homedir(), '.qne_v12_secret');
const url = process.env.QNE_V12_URL || 'http://127.0.0.1:17839';
function secret(init = false) {
  if (init && !fs.existsSync(secretFile)) {
    const fd = fs.openSync(secretFile, 'wx', 0o600);
    try { fs.writeSync(fd, crypto.randomBytes(48).toString('hex') + '\n'); } finally { fs.closeSync(fd); }
  }
  const s = fs.readFileSync(secretFile, 'utf8').trim();
  if (!/^[0-9a-f]{96}$/.test(s)) throw Error('Secret de cluster invalide: 96 caracteres hexadecimaux requis');
  return s;
}
function localHost(u) { return ['127.0.0.1','::1','[::1]','localhost'].includes(u.hostname); }
function assertTransport(u) {
  if (!['http:', 'https:'].includes(u.protocol)) throw Error('Protocole URL non autorise');
  if (u.protocol === 'http:' && !localHost(u)) throw Error('HTTP distant interdit : utiliser HTTPS avec certificat verifie');
}
function request(method, dest, body = null, timeout = 7000) {
  const u = new URL(dest, url); assertTransport(u);
  const bytes = body === null ? null : Buffer.from(JSON.stringify(body), 'utf8');
  if (bytes && bytes.length > 128*1024) return Promise.reject(Error('Requete trop volumineuse'));
  const lib = u.protocol === 'https:' ? https : http;
  const ca = process.env.QNE_V12_CA_FILE ? fs.readFileSync(process.env.QNE_V12_CA_FILE) : undefined;
  return new Promise((resolve, reject)=>{
    const q = lib.request(u, {method, ca, headers:{'Authorization':'Bearer '+secret(), 'Content-Type':'application/json', ...(bytes?{'Content-Length':bytes.length}:{})}}, (r)=>{
      const chunks = []; let n=0;
      r.on('data', c=>{n+=c.length; if(n>512*1024){r.destroy(Error('Reponse trop volumineuse'));return;} chunks.push(c);});
      r.on('end',()=>{let data; try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{reject(Error('Reponse non JSON'));return;}
        if(r.statusCode >= 400) {const e = Error(data.error || 'HTTP '+r.statusCode);e.status=r.statusCode;reject(e);}else resolve(data);
      });
      r.on('error',reject);
    });
    q.setTimeout(timeout,()=>q.destroy(Error('Timeout reseau')));q.on('error',reject);
    if (bytes) q.write(bytes);q.end();
  });
}
function sha(data){return crypto.createHash('sha256').update(data).digest('hex');}
function fail(message){throw Error(message);}
module.exports={ROOT,dataDir,secretFile,url,secret,assertTransport,localHost,request,sha,fail};
