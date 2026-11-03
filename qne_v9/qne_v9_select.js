#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const dir=__dirname;
const variants={v4:['qne_v4_ref',null,null],v7b1024t2T4:['qne_v7_1024',2,4],v7b1024t4T4:['qne_v7_1024',4,4],v8b1024t2T8:['qne_v8_1024',2,8],v8b1024t4T8:['qne_v8_1024',4,8],v8b2048t2T8:['qne_v8_2048',2,8],v8b2048t4T8:['qne_v8_2048',4,8]};
const [, ,mode,ns,steps,arg]=process.argv,N=Number(ns);
if(!['--bench','--state'].includes(mode)||!Number.isSafeInteger(N)||N<4||!steps||arg===undefined){
 console.error('Usage: node qne_v9_select.js --bench N steps repetitions');
 console.error('   ou: node qne_v9_select.js --state N steps seed > /tmp/etat.bin');process.exit(2);
}
let winner='v4';
try{
 const p=JSON.parse(fs.readFileSync(path.join(dir,'QNE_V9_PROFIL.json'),'utf8'));
 if(p.version!==9||!p.rows?.length)throw Error('profil incompatible');
 const row=p.rows.reduce((a,b)=>Math.abs(Math.log2(N/b.N))<Math.abs(Math.log2(N/a.N))?b:a);
 winner=row.winner_selected;
 if(row.gains?.[winner]===undefined)throw Error('profil incomplet');
}catch(e){console.error('QNE V9 : profil indisponible, V4 de secours : '+e.message);}
if(!variants[winner]){console.error('QNE V9 : selection inconnue, V4 de secours');winner='v4';}
const [exe,thr,T]=variants[winner],params=[mode,ns,steps,arg];
if(thr!==null)params.push(String(thr));if(T!==null)params.push(String(T));
console.error('QNE V9 : moteur choisi = '+winner);
const r=cp.spawnSync(path.join(dir,exe),params,{stdio:'inherit'});
if(r.error)throw r.error;
process.exit(r.status??2);
