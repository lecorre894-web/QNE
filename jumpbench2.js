#!/usr/bin/env node
"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const TOT=Math.max(1000,parseInt(process.argv[2],10)||2000000);
const W=Math.max(1,parseInt(process.argv[3],10)||os.cpus().length);
const LOW=0x87>>>0;
const sp=new Uint16Array(256);for(let b=0;b<256;b++){let s=0;for(let k=0;k<8;k++)if((b>>k)&1)s|=(1<<(2*k));sp[b]=s;}
function mulx(R){const c=(R[3]>>>31)&1;R[3]=((R[3]<<1)|(R[2]>>>31))>>>0;R[2]=((R[2]<<1)|(R[1]>>>31))>>>0;R[1]=((R[1]<<1)|(R[0]>>>31))>>>0;R[0]=(R[0]<<1)>>>0;if(c)R[0]^=LOW;}
function sqr(R,wide){
 wide[0]=0;wide[1]=0;wide[2]=0;wide[3]=0;wide[4]=0;wide[5]=0;wide[6]=0;wide[7]=0;
 for(let bi=0;bi<16;bi++){const by=(R[bi>>2]>>>((bi&3)*8))&0xFF;wide[bi>>1]=(wide[bi>>1]|(sp[by]<<((bi&1)*16)))>>>0;}
 const h0=wide[4],h1=wide[5],h2=wide[6],h3=wide[7];
 let f0=h0,f1=h1,f2=h2,f3=h3,f4=0;
 f0^=(h0<<1)>>>0;f1^=((h1<<1)|(h0>>>31))>>>0;f2^=((h2<<1)|(h1>>>31))>>>0;f3^=((h3<<1)|(h2>>>31))>>>0;f4^=(h3>>>31);
 f0^=(h0<<2)>>>0;f1^=((h1<<2)|(h0>>>30))>>>0;f2^=((h2<<2)|(h1>>>30))>>>0;f3^=((h3<<2)|(h2>>>30))>>>0;f4^=(h3>>>30);
 f0^=(h0<<7)>>>0;f1^=((h1<<7)|(h0>>>25))>>>0;f2^=((h2<<7)|(h1>>>25))>>>0;f3^=((h3<<7)|(h2>>>25))>>>0;f4^=(h3>>>25);
 const hh=f4&0xFF,c=(hh^(hh<<1)^(hh<<2)^(hh<<7))>>>0;
 R[0]=(wide[0]^f0^c)>>>0;R[1]=(wide[1]^f1)>>>0;R[2]=(wide[2]^f2)>>>0;R[3]=(wide[3]^f3)>>>0;
}
if(isMainThread){
 const per=Math.ceil(TOT/W);let done=0;const t0=process.hrtime.bigint();let acc=0;
 console.log("JUMP-BENCH2 (sans alloc) — coeurs="+W+" sauts="+(per*W).toLocaleString("fr-FR"));
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:{wid:w,per}});
  wk.on("message",m=>{acc^=m.acc;if(++done===W){const sec=Number(process.hrtime.bigint()-t0)/1e9,N=per*W;console.log("debit : "+Math.round(N/sec).toLocaleString("fr-FR")+" sauts/s   ("+sec.toFixed(2)+"s)");process.exit(0);}});
  wk.on("error",e=>{console.error(e);process.exit(1);});}
}else{
 const per=workerData.per,wid=workerData.wid;const R=new Uint32Array(4),wide=new Uint32Array(8);
 let acc=0,nlo=(wid*2654435761)>>>0,nhi=(wid*40503)>>>0;
 for(let j=0;j<per;j++){R[0]=1;R[1]=0;R[2]=0;R[3]=0;
  for(let bit=63;bit>=0;bit--){sqr(R,wide);const w=bit<32?nlo:nhi,b=bit&31;if((w>>>b)&1)mulx(R);}
  acc^=R[0];nlo=(nlo+0x9E3779B1)>>>0;nhi=(nhi^(nhi<<13))>>>0;}
 parentPort.postMessage({acc:acc>>>0});
}
