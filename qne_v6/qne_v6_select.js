#!/usr/bin/env node
'use strict';
// Dispatch of a complete run to the best measured backend for the closest N.
const fs=require('node:fs'), path=require('node:path');
const {spawnSync}=require('node:child_process');
const dir=__dirname;
const names={v4:['qne_v4_ref'],v5:['qne_v5_ref'],v6t1:['qne_v6_native','1'],v6t2:['qne_v6_native','2'],v6t4:['qne_v6_native','4']};
function main(){
 const [mode,nArg,stepsArg,arg]=process.argv.slice(2);
 if(!['--bench','--state'].includes(mode)||!nArg||!stepsArg||arg===undefined){
  console.error('Usage: node qne_v6_select.js --state N pas graine | --bench N pas repetitions');process.exitCode=2;return;}
 const N=Number(nArg);
 if(!Number.isSafeInteger(N)||N<4||N>10000000){console.error('Dimension invalide');process.exitCode=2;return;}
 let selected=N<131072?'v4':'v5',matched='seuil initial';
 const profilePath=path.join(dir,'QNE_V6_PROFIL.json');
 if(fs.existsSync(profilePath)){
  const prof=JSON.parse(fs.readFileSync(profilePath,'utf8'));
  if(prof.version===1&&Array.isArray(prof.rows)&&prof.rows.length){
   const near=prof.rows.reduce((a,b)=>Math.abs(Math.log2(b.N/N))<Math.abs(Math.log2(a.N/N))?b:a);
   if(names[near.winner]){selected=near.winner;matched=`profil mesure a N=${near.N}`;}
  }
 }
 console.error(`QNE V6 SELECT: ${selected} (${matched})`);
 const item=names[selected];
 const argv=[mode,nArg,stepsArg,arg,...item.slice(1)];
 const r=spawnSync(path.join(dir,item[0]),argv,{stdio:'inherit'});
 if(r.error)throw r.error;
 process.exitCode=r.status??1;
}
main();
