#!/usr/bin/env node
'use strict';
/* QNE V9 - suite multispecialite ADDITIVE, sans modification des sources QNE V2-V8.
 * Comparaisons mathematiquement equivalentes, verifications et calibration Termux.
 * IMPORTANT: les implementations lentes DE REFERENCE ne sont pas les moteurs
 * canoniques du depot GitHub; le score de suite n'est pas un gain universel.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {squareFast,mulRef,jumpSeed2pow,at2pow}=require('./qne_v2.js');
const dir=__dirname, args=new Set(process.argv.slice(2));
const quick=args.has('--quick'),noSave=args.has('--no-save');
const onlyLinear=args.has('--linear-only'),onlyNumeric=args.has('--numerical-only');
const reps=quick?3:7;
const median=arr=>[...arr].sort((a,b)=>a-b)[Math.floor(arr.length/2)];
const hash=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const V={v4:['qne_v4_ref',null,null],v7b1024t2T4:['qne_v7_1024',2,4],v7b1024t4T4:['qne_v7_1024',4,4],v8b1024t2T8:['qne_v8_1024',2,8],v8b1024t4T8:['qne_v8_1024',4,8],v8b2048t2T8:['qne_v8_2048',2,8],v8b2048t4T8:['qne_v8_2048',4,8]};
const names=Object.keys(V);
let validations=0;
function assert(cond,msg){if(!cond)throw Error('VALIDATION ECHEC : '+msg);validations++;}
function xorshift(seed){let s=seed>>>0;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>0;};}
function paired(ref,opt,refRuns,optRuns,k=7){
 // alternance des phases pour reduire les biais de frequence/temperature
 for(let z=0;z<2;z++){ref(Math.min(refRuns,2));opt(Math.min(optRuns,2));}
 const a=[],b=[];
 for(let i=0;i<k;i++){
   if(i&1){let t=performance.now();opt(optRuns);b.push((performance.now()-t)/optRuns);t=performance.now();ref(refRuns);a.push((performance.now()-t)/refRuns);}
   else{let t=performance.now();ref(refRuns);a.push((performance.now()-t)/refRuns);t=performance.now();opt(optRuns);b.push((performance.now()-t)/optRuns);}
 }
 const baseline_ms=median(a),optimized_ms=median(b);
 return {baseline_ms,optimized_ms,speedup:baseline_ms/optimized_ms,reference_batch:refRuns,optimized_batch:optRuns,repetitions:k};
}
const rec={schema:'QNE-V9-general/1',date:new Date().toISOString(),host:{platform:process.platform,arch:process.arch,node:process.version,cpu:os.cpus()?.[0]?.model||'indisponible'},validation:'PENDING',verified_cases:0,categories:{},workload_score:null,limits:[
 'Le x100 global doit etre defini pour une batterie de taches et un systeme de reference fixes.',
 'Baselines GF128, LFSR et matrices : implementations independantes de reference, PAS le code originel GitHub.',
 'Cache LFSR preconstruit a l import et compilation native exclus des durees: gains pour appels repetes et taches amorties.',
 'Les sauts de grand exposant et les mises a jour RK4 sont des problemes distincts; ne jamais transferer un gain a un autre.',
 'Le profil est local au CPU, a la temperature et aux versions du code; validation binaire pour les cas testes seulement.'
]};
function uint128(words){return words.reduce((n,w,i)=>n|(BigInt(w)<<BigInt(32*i)),0n);}
function gf128(){
 console.log('=== FAMILLE 1 : GF(2^128) carre reference BigInt vs table LUT ===');
 const next=xorshift(0x13132026);
 const inputs=Array.from({length:128},()=>Uint32Array.from({length:4},()=>next()));
 const longs=inputs.map(uint128);
 const expected=longs.map(a=>mulRef(a,a));
 for(let i=0;i<inputs.length;i++)assert(uint128(squareFast(inputs[i]))===expected[i],'GF128 carre '+i);
 let checksum=0;
 const ref=n=>{let h=0;for(let i=0;i<n;i++)h^=Number(mulRef(longs[i%128],longs[i%128])&0xffffffffn);checksum^=h;};
 const opt=n=>{let h=0;for(let i=0;i<n;i++)h^=squareFast(inputs[i%128])[0];checksum^=h;};
 const result=paired(ref,opt,quick?128:512,quick?4096:8192,reps);
 result.work_units=8192;result.proven_equal=inputs.length;result.checksum=checksum>>>0;
 rec.categories.gf128=result;
 console.log('GF128 | x'+result.speedup.toFixed(2)+' | '+inputs.length+' cas egaux');
}
function lfsrStep(v){const lsb=v[0]&1;for(let i=0;i<4;i++)v[i]=((v[i]>>>1)|(i<3?((v[i+1]&1)<<31):0))>>>0;if(lsb){v[0]^=0x43;v[3]^=0x80000000;}return v;}
// right shift taps [128,7,2,1] => mask word0 = (1<<0)|(1<<1)|(1<<6) = 0x43
function lfsr(){
 console.log('=== FAMILLE 2 : saut LFSR 2^E, graine arbitraire ===');
 const E=quick?16:20, count=2**E;
 const seeds=[new Uint32Array([0x12345678,0xdeadbeef,0xabcdef01,0xa5a5a5a5]),new Uint32Array([123,456,789,987654321])];
 const direct=seed=>{const state=seed.slice();for(let i=0;i<count;i++)lfsrStep(state);return state;};
 const equal=(a,b)=>a.length===b.length&&a.every((w,i)=>w===b[i]);
 for(const seed of seeds)assert(equal(direct(seed),jumpSeed2pow(E,seed)),'LFSR arbitrary seed 2^'+E);
 assert(equal(at2pow(E),direct(new Uint32Array([1,0,0,0]))),'LFSR seed e0');
 let checksum=0;
 const ref=n=>{let h=0;for(let i=0;i<n;i++)h^=direct(seeds[i%2])[i%4];checksum^=h;};
 const opt=n=>{let h=0;for(let i=0;i<n;i++)h^=jumpSeed2pow(E,seeds[i%2])[i%4];checksum^=h;};
 const result=paired(ref,opt,quick?1:2,quick?128:512,reps);
 result.E=E;result.direct_steps_per_call=count;result.work_units=2;result.proven_equal=seeds.length+1;result.checksum=checksum>>>0;
 rec.categories.lfsr=result;
 const Edecimal='1'+'0'.repeat(100);
 assert(at2pow(Edecimal).every((v,i)=>v===at2pow(BigInt(Edecimal))[i]),'Decimal 10^100');
 console.log(`LFSR 2^${E} | x${result.speedup.toFixed(2)} | 2 graines | 10^100 exact (sans mesure comparative impossible)`);
}
const N=32;
function toDense(p){const A=new Uint8Array(N*N);for(let i=0;i<N;i++)for(let j=0;j<N;j++)A[i*N+j]=(p[i]>>>j)&1;return A;}
function toPacked(d){const p=new Uint32Array(N);for(let i=0;i<N;i++){let v=0;for(let j=0;j<N;j++)if(d[i*N+j])v|=1<<j;p[i]=v>>>0;}return p;}
function idDense(){const C=new Uint8Array(N*N);for(let i=0;i<N;i++)C[i*N+i]=1;return C;}
function idPacked(){const C=new Uint32Array(N);for(let i=0;i<N;i++)C[i]=(1<<i)>>>0;return C;}
function mulDense(A,B){const C=new Uint8Array(N*N);for(let i=0;i<N;i++){const base=i*N;for(let k=0;k<N;k++)if(A[base+k]){const row=k*N;for(let j=0;j<N;j++)C[base+j]^=B[row+j];}}return C;}
function mulPacked(A,B){const C=new Uint32Array(N);for(let i=0;i<N;i++){let bits=A[i]>>>0,acc=0;while(bits){const low=(bits&-bits)>>>0;const k=31-Math.clz32(low);acc^=B[k];bits=(bits&(bits-1))>>>0;}C[i]=acc>>>0;}return C;}
function power(base,exp,mul,identity){let result=identity(),b=base,e=exp;while(e>0){if(e%2)result=mul(result,b);e=Math.floor(e/2);if(e)b=mul(b,b);}return result;}
function matrices(){
 console.log('=== FAMILLE 3 : matrices 32x32 GF(2), puissance par dichotomie ===');
 const next=xorshift(0x09876543),p=Array.from({length:16},()=>Uint32Array.from({length:N},()=>next())),d=p.map(toDense);
 for(const exponent of [0,1,2,3,17,255,65537,1000000])for(let k=0;k<4;k++){
  const got=power(p[k],exponent,mulPacked,idPacked);
  const exp=toPacked(power(d[k],exponent,mulDense,idDense));
  assert(got.every((v,i)=>v===exp[i]),'GF2 matrices: seed '+k+' exponent '+exponent);
 }
 let checksum=0;
 const ref=n=>{let h=0;for(let i=0;i<n;i++)h^=power(d[i%16],1000000,mulDense,idDense)[0];checksum^=h;};
 const opt=n=>{let h=0;for(let i=0;i<n;i++)h^=power(p[i%16],1000000,mulPacked,idPacked)[0];checksum^=h;};
 const result=paired(ref,opt,quick?4:20,quick?128:400,reps);
 result.work_units=64;result.exponent=1000000;result.dimension=32;result.algorithm='binary exponentiation BOTH; dense 0/1 reference vs packed 32-bit';result.checksum=checksum>>>0;
 rec.categories.matrices=result;
 console.log('MATRICES GF2 32x32 | x'+result.speedup.toFixed(2)+' | 32 comparaisons exactes');
}
function native(name,mode,n,steps,arg){
 const [exe,thr,T]=V[name];
 const par=[mode,n,steps,arg];if(thr!==null)par.push(thr);if(T!==null)par.push(T);
 const data=cp.execFileSync(path.join(dir,exe),par.map(String),{encoding:mode==='--state'?null:'utf8',maxBuffer:mode==='--state'?Math.max(n*8+65536,1048576):65536,timeout:180000});
 if(mode==='--bench'){
  const ms=Number(data.trim());if(!Number.isFinite(ms)||ms<=0)throw Error('Chronometre invalide '+name);return ms;
 }
 return data;
}
function rk4(){
 console.log('=== FAMILLE 4 : Lorenz-96 RK4 Float64, V4/V7/V8 natifs ===');
 for(const [exe] of Object.values(V))if(!fs.existsSync(path.join(dir,exe)))throw Error('Binaire natif absent '+exe+' : lancer lancement_qne_v9.sh');
 const specs=quick?[[4,40],[7,40],[40,100],[4096,20],[131071,8],[131072,8],[131073,8],[262144,8]]:[[4,200],[5,200],[7,200],[40,200],[4096,40],[65536,8],[131071,8],[131072,8],[131073,8],[262144,8],[1048576,8]];
 for(const [n,steps] of specs){
  const seeds=n>262144?[0]:[0,305419896];
  for(const seed of seeds){
   const ref=native('v4','--state',n,steps,seed);
   for(const name of names.slice(1)){const b=native(name,'--state',n,steps,seed);assert(ref.equals(b),`RK4 ${name} N=${n} seed=${seed}`);}
  }
  console.log(`SHA256 OK | N=${n}, ${seeds.length} graines, ${names.length-1} variantes`);
 }
 const rows=[],points=quick?[[40,1000],[4096,300],[131072,20],[262144,16]]:[[40,4000],[4096,400],[65536,80],[131072,50],[262144,30],[1048576,12]];
 for(const [n,steps] of points){
  const candidates=n<131072?['v4','v7b1024t2T4','v8b1024t2T8']:names;
  const times=Object.fromEntries(candidates.map(name=>[name,[]]));
  // verification finale etat identique sur charge utilisee pour benchmark
  const benchmarkState=native('v4','--state',n,steps,0);
  for(const name of candidates.slice(1))assert(benchmarkState.equals(native(name,'--state',n,steps,0)),'Final RK4 '+name+' N='+n);
  for(let i=0;i<reps;i++)for(const name of i&1?[...candidates].reverse():candidates)times[name].push(native(name,'--bench',n,steps,1));
  const med=Object.fromEntries(candidates.map(name=>[name,median(times[name])]));
  const best=candidates.reduce((a,b)=>med[a]<=med[b]?a:b);
  // seuil de 5 % pour limiter l influence du bruit; jamais de seuil fixe en dimension
  const winner=med[best]<med.v4*0.95?best:'v4';
  const gains=Object.fromEntries(candidates.map(name=>[name,med.v4/med[name]]));
  rows.push({N:n,steps,repetitions:reps,median_ms:med,raw_times_ms:times,speed_M_updates_s:Object.fromEntries(candidates.map(x=>[x,n*steps/med[x]/1000])),winner_raw:best,winner_selected:winner,gains,sha256_common:hash(benchmarkState),fixed_work_units:steps});
  console.log(`RK4 N=${n} | V4 ${(n*steps/med.v4/1000).toFixed(2)} M/s | ${winner} ${(n*steps/med[winner]/1000).toFixed(2)} M/s | x${gains[winner].toFixed(2)}`);
 }
 rec.categories.rk4={baselines:'native V4',candidates:names,rows};
}
function aggregate(){
 const items=[];
 for(const key of ['gf128','lfsr','matrices'])if(rec.categories[key]){
  const r=rec.categories[key];items.push({category:key,work_units:r.work_units,baseline_total_ms:r.baseline_ms*r.work_units,optimized_total_ms:r.optimized_ms*r.work_units,speedup:r.speedup});
 }
 const rk=rec.categories.rk4?.rows||[];
 for(const r of rk)items.push({category:'rk4_N'+r.N,work_units:1,baseline_total_ms:r.median_ms.v4,optimized_total_ms:r.median_ms[r.winner_selected],speedup:r.gains[r.winner_selected]});
 if(items.length<1)return;
 const a=items.reduce((x,y)=>x+y.baseline_total_ms,0),b=items.reduce((x,y)=>x+y.optimized_total_ms,0);
 const families={};for(const r of items){const fam=r.category.split('_')[0];(families[fam]??=[]).push(r.speedup);}
 const per_family_geomean=Object.fromEntries(Object.entries(families).map(([name,s])=>[name,Math.exp(s.reduce((a,b)=>a+Math.log(b),0)/s.length)]));
 const values=Object.values(per_family_geomean);
 rec.workload_score={title:'Batterie QNE V9, non representatif de toutes les utilisations',method:'Ratio du temps estime pour les memes operations, charges fixes; sans compilation/pre-calcul; references distinctes par domaine',items,estimated_baseline_total_ms:a,estimated_optimized_total_ms:b,ratio_fixed_workload:a/b,per_family_geomean,balanced_geometric_mean:Math.exp(values.reduce((sum,v)=>sum+Math.log(v),0)/values.length),objective_x100_suite:a/b>=100?'OBSERVE SUR CETTE SUITE UNIQUEMENT':'NON ATTEINT'};
 console.log('=== SCORE GLOBAL DE LA BATTERIE (pas du logiciel universel) ===');
 console.log('Temps equivalent total ref: '+a.toFixed(3)+' ms; moteur: '+b.toFixed(3)+' ms');
 console.log('Ratio charges fixes : x'+(a/b).toFixed(2)+' ; moyenne geometrique par famille x'+rec.workload_score.balanced_geometric_mean.toFixed(2));
 console.log('LIMITATION : ces references ne sont PAS une comparaison globale directe avec GitHub/QNE original.');
}
function main(){
 if(args.has('--help')||args.has('-h')){console.log('bash qne_v9/lancement_qne_v9.sh [--quick|--linear-only|--numerical-only|--no-save]');return;}
 if(onlyLinear&&onlyNumeric)throw Error('choisir un mode unique');
 try{
  if(!onlyNumeric){gf128();lfsr();matrices();}
  if(!onlyLinear)rk4();
  rec.verified_cases=validations;aggregate();rec.validation='PASSED';
 }catch(e){rec.validation='FAILED';rec.error=String(e.stack||e);console.error(rec.error);process.exitCode=1;}
 if(!noSave){
  const target=path.join(dir,'QNE_V9_RESULTATS.json');fs.writeFileSync(target,JSON.stringify(rec,null,2)+'\n');console.log('Rapport : '+target);
  if(rec.validation==='PASSED'&&rec.categories.rk4?.rows?.length){
   const p={version:9,created:rec.date,selection:'profil apres 7 tests alternes et seuil >=5% vs V4; interpolation proche en log2 des tailles',rows:rec.categories.rk4.rows.map(r=>({N:r.N,winner_selected:r.winner_selected,gains:r.gains,sha256:r.sha256_common}))};
   const f=path.join(dir,'QNE_V9_PROFIL.json');fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');console.log('Profil : '+f);
  }
 }
 console.log('VALIDATION : '+rec.validation+' | Comparaisons : '+rec.verified_cases);
}
main();
