








"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const NR=Math.max(8,parseInt(process.argv[2],10)||300);
const NPOP=Math.max(2,parseInt(process.argv[3],10)||64);
const STEPS=Math.max(2000,parseInt(process.argv[4],10)||20000);
const W=Math.max(1,parseInt(process.argv[5],10)||os.cpus().length);
const SEUIL=parseFloat(process.argv[6])||85;
const GENS=Math.max(1,parseInt(process.argv[7],10)||6);
const LEAK=0.95,WIN=0.5,H=Math.floor(NR/2),WARM=1200,ETA=0.3,SIG=0.05,PHI=0.25;
if(isMainThread){
 const mkrnd=(s)=>{let a=s>>>0;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};};
 const std=(arr)=>{const m=arr.reduce((a,b)=>a+b,0)/arr.length;return Math.sqrt(arr.reduce((a,b)=>a+(b-m)*(b-m),0)/arr.length);};
 const evalPop=(gains)=>new Promise(res=>{const fits=new Array(gains.length);let done=0;
  for(let w=0;w<W;w++){const lo=Math.floor(w*gains.length/W),hi=Math.floor((w+1)*gains.length/W);
   const wk=new Worker(__filename,{workerData:{gains:gains.slice(lo,hi),lo,NR,STEPS,LEAK,WIN,H,WARM,ETA}});
   wk.on("message",m=>{for(let i=0;i<m.fits.length;i++)fits[m.lo+i]=m.fits[i];if(++done===W)res(fits);});
   wk.on("error",e=>{console.error(e);process.exit(1);});}});
 const clamp=(g)=>Math.min(1,Math.max(0.05,g));
 function nextPop(rows,strat,rnd){const viv=rows.filter(r=>r.fit>=SEUIL),np=viv.map(r=>r.gain);
  if(strat===1){while(np.length<NPOP){if(viv.length){const p=viv[(rnd()*viv.length)|0].gain;np.push(clamp(p+(rnd()*2-1)*SIG));}else np.push(0.10+0.70*rnd());}}
  else{const tot=rows.reduce((a,b)=>a+b.fit,0)||1;const pick=()=>{let x=rnd()*tot;for(const r of rows){x-=r.fit;if(x<=0)return r.gain;}return rows[rows.length-1].gain;};
   while(np.length<NPOP){if(rnd()<PHI)np.push(0.05+0.90*rnd());else{const a=pick(),b=pick(),al=rnd();np.push(clamp(al*a+(1-al)*b+(rnd()*2-1)*SIG));}}}
  return np;}
 (async()=>{const init=Array.from({length:NPOP},(_,i)=>0.10+0.70*mkrnd(42+i*101)());
  for(const strat of [1,2]){console.log((strat===1?"STRAT 1 — exploitation (clone+mutation)":"STRAT 2 — alternative (roulette+croisement+immigrants)"));
   console.log("--------------------------------------------------");
   let pop=init.slice();const rnd=mkrnd(strat===1?111:222);
   for(let gen=1;gen<=GENS;gen++){const fits=await evalPop(pop);const rows=pop.map((g,i)=>({gain:g,fit:fits[i]}));
    const viv=rows.filter(r=>r.fit>=SEUIL),moy=rows.reduce((a,b)=>a+b.fit,0)/rows.length;
    const gv=viv.length?viv.reduce((a,b)=>a+b.gain,0)/viv.length:0;
    console.log("gen "+gen+" : coeff "+moy.toFixed(1)+"%  vivants "+viv.length+"/"+NPOP+"  gain "+gv.toFixed(3)+"  diversite(sigma) "+std(pop).toFixed(3));
    pop=nextPop(rows,strat,rnd);}
   console.log("");}
  process.exit(0);})();
}else{
 const {gains,lo,NR,STEPS,LEAK,WIN,H,WARM,ETA}=workerData;
 const NB0=new Int32Array(NR),NB1=new Int32Array(NR),NB2=new Int32Array(NR);
 for(let i=0;i<NR;i++){NB0[i]=(i+1)%NR;NB1[i]=(i-1+NR)%NR;NB2[i]=(i+H)%NR;}
 const TH=1/3,EV=Math.floor(STEPS*0.6),fits=[];
 for(let r=0;r<gains.length;r++){const gain=gains[r];let a=(777+lo*131+r*7919)>>>0;
  const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
  let x=new Float64Array(NR),nx=new Float64Array(NR),w=new Float64Array(NR);
  for(let i=0;i<NR;i++)x[i]=2*rnd()-1;let se=0,sy=0;
  for(let s=0;s<WARM+STEPS;s++){const u=Math.sin(s*0.017)+0.3*Math.sin(s*0.0031),unext=Math.sin((s+1)*0.017)+0.3*Math.sin((s+1)*0.0031);
   for(let i=0;i<NR;i++){const m=TH*(x[NB0[i]]+x[NB1[i]]+x[NB2[i]]);nx[i]=(1-LEAK)*x[i]+LEAK*Math.tanh(gain*3*m+WIN*u);}
   const t=x;x=nx;nx=t;
   if(s>=WARM){let yh=0,nrm=1;for(let i=0;i<NR;i++){yh+=w[i]*x[i];nrm+=x[i]*x[i];}const e=unext-yh,g=ETA*e/nrm;for(let i=0;i<NR;i++)w[i]+=g*x[i];if(s>=WARM+EV){se+=e*e;sy+=unext*unext;}}}
  fits.push(Math.max(0,100*(1-Math.sqrt(se/Math.max(sy,1e-12)))));}
 parentPort.postMessage({lo,fits});
}
