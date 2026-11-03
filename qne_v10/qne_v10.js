#!/usr/bin/env node
'use strict';
// QNE V10 : correction matricielle native et recomposition de la batterie V9.
// Ne modifie aucun moteur V2-V9. Le x100 reste une cible, pas un resultat garanti.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const dir=__dirname,argv=new Set(process.argv.slice(2));
const quick=argv.has('--quick');const repetitions=quick?3:7;
const napi=require('./qne_matrix_napi.node');
const api=require('./qne_v10_matrix.js');
const rng=(seed)=>()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
const rnd=rng(0x09876543),N=32;
const inputs=Array.from({length:16},()=>Uint32Array.from({length:N},()=>rnd()));
const med=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const equals=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
function toDense(p){const a=new Uint8Array(N*N);for(let i=0;i<N;i++)for(let j=0;j<N;j++)a[i*N+j]=(p[i]>>>j)&1;return a;}
function toPacked(d){const a=new Uint32Array(N);for(let i=0;i<N;i++){let v=0;for(let j=0;j<N;j++)if(d[i*N+j])v|=(1<<j);a[i]=v>>>0;}return a;}
const dense=inputs.map(toDense);
function idDense(){const a=new Uint8Array(N*N);for(let i=0;i<N;i++)a[i*N+i]=1;return a;}
function idPacked(){const a=new Uint32Array(N);for(let i=0;i<N;i++)a[i]=(1<<i)>>>0;return a;}
function mulDense(a,b){const c=new Uint8Array(N*N);for(let i=0;i<N;i++)for(let k=0;k<N;k++)if(a[i*N+k])for(let j=0;j<N;j++)c[i*N+j]^=b[k*N+j];return c;}
function mulPacked(a,b){const c=new Uint32Array(N);for(let i=0;i<N;i++){let bits=a[i]>>>0,v=0;while(bits){const bit=(bits&-bits)>>>0;v^=b[31-Math.clz32(bit)];bits=(bits&(bits-1))>>>0;}c[i]=v>>>0;}return c;}
function pow(a,e,mul,identity){let r=identity(),b=a;while(e>0){if(e%2)r=mul(r,b);e=Math.floor(e/2);if(e)b=mul(b,b);}return r;}
const funcs={dense:(k,e)=>toPacked(pow(dense[k],e,mulDense,idDense)),packed:(k,e)=>pow(inputs[k],e,mulPacked,idPacked),native:(k,e)=>napi.power32(inputs[k],e)};
const report={schema:'QNE-V10-matrix/1',timestamp:new Date().toISOString(),runtime:{node:process.version,arch:process.arch,cpu:os.cpus()?.[0]?.model},validation:'PENDING',cases:0,comparisons:{},matrix:{},score:null,limitations:[
 'La batterie V9 utilise des references heterogenes; le score V10 ne prouve pas une acceleration universelle du depot GitHub.',
 'Le module natif est compare sur des appels repetes de puissance 32x32; la compilation et son chargement initial sont hors chronometrage.',
 'Le score reconstruit reprend les mesures V9 du meme appareil mais pas necessairement de la meme temperature que le test V10.',
 'LFSR sauts exacts et RK4 sont des problemes distincts. Le gain d un seul ne s extrapole pas aux autres.',
 'Operations matricielles uniquement en GF(2), 32x32, exposant non negatif <= Number.MAX_SAFE_INTEGER.'
]};
function verify(){console.log('=== QNE V10 : validation croisee, matrices GF(2) ===');
 for(const e of [0,1,2,3,17,255,65537,1000000])for(let k=0;k<16;k++){
  const a=funcs.dense(k,e),b=funcs.packed(k,e),c=funcs.native(k,e),d=api.power32(inputs[k],e);
  if(!equals(a,b)||!equals(a,c)||!equals(a,d))throw Error(`ERREUR k=${k} e=${e}`);
  report.cases+=3;
 }
 const invalid=[-1,1.25,Number.MAX_SAFE_INTEGER+1,NaN,Infinity];for(const e of invalid){let thrown=false;try{napi.power32(inputs[0],e)}catch{thrown=true;}if(!thrown)throw Error('Exposant invalide accepte: '+e);report.cases++;}
 const id=funcs.native(0,0);if(!equals(id,idPacked()))throw Error('Matrice identite invalide');report.cases++;
 console.log(`VALIDATION OK | ${report.cases} comparaisons et tests de plage`);
}
function measure(fn,count,offset){let check=0;const start=performance.now();for(let i=0;i<count;i++){let result=fn((i+offset)%16,1000000);check^=result[(i+offset)%32];}return {elapsed:performance.now()-start,check};}
function bench(){console.log('=== QNE V10 : mesures alternees sur 3 moteurs (7 repetitions par defaut) ===');
 const runs=quick?{dense:8,packed:32,native:1024}:{dense:32,packed:128,native:4096};
 const timings={dense:[],packed:[],native:[]};let sideEffect=0;
 // Echauffement identique en nombre d'operations avant chaque mesure
 for(const name of Object.keys(funcs)){let r=measure(funcs[name],Math.min(runs[name],8),0);sideEffect^=r.check;}
 for(let z=0;z<repetitions;z++){
  const order=(z%2)?['native','packed','dense']:['dense','packed','native'];
  for(const name of order){const m=measure(funcs[name],runs[name],z);timings[name].push(m.elapsed/runs[name]);sideEffect^=m.check;}
 }
 const per=Object.fromEntries(Object.entries(timings).map(([k,v])=>[k,med(v)]));
 const fastest=Object.keys(per).reduce((a,b)=>per[a]<per[b]?a:b);
 // Une amelioration de moins de 5 % sur la reference conserve le moteur dense;
 // une variante matricielle lente n'est donc jamais selectionnee.
 const selected=per[fastest]<per.dense*0.95?fastest:'dense';
 const result={method:'median de temps par appel; boucles proportionnelles pour la precision des chronometres',exponent:1000000,dimension:32,repetitions,run_counts:runs,ms_per_power:per,raw_ms_per_power:timings,speedup_vs_dense:Object.fromEntries(Object.entries(per).map(([k,v])=>[k,per.dense/v])),fastest,selected,selected_speedup:per.dense/per[selected],work_units:64,checksum:sideEffect>>>0};
 report.matrix=result;
 for(const name of Object.keys(per))console.log(`${name}: ${per[name].toFixed(6)} ms / puissance | x${(per.dense/per[name]).toFixed(2)}`);
 console.log('MATRICES GF(2) | choisi='+selected+' | gain='+result.selected_speedup.toFixed(2));
}
function recompute(){const v9Path=path.resolve(dir,'../qne_v9/QNE_V9_RESULTATS.json');
 if(!fs.existsSync(v9Path)){console.log('Aucun rapport V9 trouve; score global non calcule.');return;}
 const v9=JSON.parse(fs.readFileSync(v9Path,'utf8'));
 if(v9.validation!=='PASSED'||!Array.isArray(v9.workload_score?.items))throw Error('Rapport V9 invalide ou incomplet');
 const items=v9.workload_score.items.map(x=>Object.assign({},x));
 const old=items.find(x=>x.category==='matrices');if(!old)throw Error('Categorie matrices absente de V9');
 old.baseline_total_ms=report.matrix.ms_per_power.dense*64;
 old.optimized_total_ms=report.matrix.ms_per_power[report.matrix.selected]*64;
 old.speedup=report.matrix.selected_speedup;
 old.reference_note='V10 native/dense: mesure locale; V9 autres familles reutilisees';
 const a=items.reduce((s,x)=>s+x.baseline_total_ms,0);
 const b=items.reduce((s,x)=>s+x.optimized_total_ms,0);
 const fam={};for(const v of items){const f=v.category.split('_')[0];(fam[f]??=[]).push(v.speedup);}
 const gm=Object.fromEntries(Object.entries(fam).map(([k,v])=>[k,Math.exp(v.reduce((s,x)=>s+Math.log(x),0)/v.length)]));
 const ratio=Math.exp(Object.values(gm).reduce((s,x)=>s+Math.log(x),0)/Object.keys(gm).length);
 report.score={name:'batterie synthétique V9, correction matricielle native V10',baseline:'non universelle, fonctions de reference distinctes',source:v9Path,v9_date:v9.date,
  points:items,total_baseline_estimated_ms:a,total_optimized_estimated_ms:b,ratio_fixed_workload:a/b,balanced_geometric_mean:ratio,per_family_geomean:gm,
  objective_x100:a/b>=100?'sur cette batterie uniquement':'NON ATTEINT'};
 console.log('=== SCORE MULTIFAMILLE (V9 + correction V10) ===');
 console.log(`temps estime reference : ${a.toFixed(3)} ms | optimise : ${b.toFixed(3)} ms | ratio x${(a/b).toFixed(2)}`);
 console.log('Ce ratio ne mesure PAS une acceleration x100 du logiciel entier.');
}
function main(){try{verify();bench();recompute();report.validation='PASSED';}catch(e){report.validation='FAILED';report.error=String(e.stack||e);console.error(report.error);process.exitCode=1;}
 const file=path.join(dir,'QNE_V10_RESULTATS.json');fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log('Rapport : '+file);console.log('STATUT : '+report.validation);}
main();
