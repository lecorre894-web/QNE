"use strict";
const {Worker,isMainThread,parentPort,workerData}=require("worker_threads");
const os=require("os");
if(isMainThread){
 let n=0; try{n=os.availableParallelism();}catch(e){} if(!n){try{n=os.cpus().length;}catch(e){}} if(!n)n=8;
 const NW=Math.min(8,n), NB=200000000;
 console.log("coeurs detectes : "+n+" -> "+NW+" workers");
 const t0=Date.now(); let done=0,acc=0;
 for(let w=0;w<NW;w++){const wk=new Worker(__filename,{workerData:{NB,seed:(w*2654435761>>>0)||1}});
  wk.on("error",e=>console.log("worker err: "+e.message));
  wk.on("message",m=>{acc^=m.acc; if(++done===NW){const sec=(Date.now()-t0)/1e3,total=NW*NB;
   console.log(NW+" coeurs : "+(total/sec/1e6).toFixed(0)+" M pas/s  ("+total.toLocaleString("fr-FR")+" pas en "+sec.toFixed(2)+" s)  acc="+(acc>>>0));}});}
}else{
 const mask=0x80200003>>>0, NB=workerData.NB; let s=workerData.seed>>>0||1;
 for(let i=0;i<NB;i++){const l=s&1; s=s>>>1; if(l)s=(s^mask)>>>0;}
 parentPort.postMessage({acc:s>>>0});
}
