#!/usr/bin/env node
'use strict';
const fs=require('node:fs'), path=require('node:path'), cp=require('node:child_process');
const dir=__dirname;
const variants={
 v4:['qne_v4_ref',null,null],v6t2:['qne_v6_ref',2,null],v6t4:['qne_v6_ref',4,null],
 v7b512t2T2:['qne_v7_512',2,2],v7b512t2T4:['qne_v7_512',2,4],
 v7b1024t2T2:['qne_v7_1024',2,2],v7b1024t2T4:['qne_v7_1024',2,4],
 v7b1024t4T4:['qne_v7_1024',4,4]
};
const [, , mode,ns,steps,arg]=process.argv;
const N=Number(ns);
if(!['--state','--bench'].includes(mode)||!Number.isSafeInteger(N)||N<4||!steps||arg===undefined){
 console.error('Usage: node qne_v7_select.js --state N steps seed > etat.bin');
 console.error('   ou: node qne_v7_select.js --bench N steps repetitions');
 process.exit(2);
}
let winner=N<131072?'v4':'v6t2';
try{
 const rows=JSON.parse(fs.readFileSync(path.join(dir,'QNE_V7_PROFIL.json'),'utf8')).rows;
 if(rows.length){winner=rows.reduce((a,b)=>Math.abs(Math.log2(N/b.N))<Math.abs(Math.log2(N/a.N))?b:a).winner;}
}catch{}
// The small-system baseline is already faster on the target Motorola; avoid noisy microbenchmarks.
if(N<131072)winner='v4';
if(!variants[winner])throw Error('Profil non reconnu');
const [bin,threads,T]=variants[winner];
const params=[mode,ns,steps,arg];if(threads!==null)params.push(String(threads));if(T!==null)params.push(String(T));
console.error(`QNE V7 profil local: ${winner}`);
const result=cp.spawnSync(path.join(dir,bin),params,{stdio:['inherit','inherit','inherit']});
if(result.error)throw result.error;
process.exit(result.status??2);
