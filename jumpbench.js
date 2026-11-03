#!/usr/bin/env node
"use strict";
const {Worker,isMainThread,workerData,parentPort}=require("worker_threads");
const os=require("os");
const TOT=Math.max(1000,parseInt(process.argv[2],10)||2000000);
const W=Math.max(1,parseInt(process.argv[3],10)||os.cpus().length);
if(isMainThread){
 const per=Math.ceil(TOT/W);let done=0;const t0=process.hrtime.bigint();let acc=0;
 console.log("JUMP-BENCH — sauts Frobenius, coeurs="+W+" sauts="+(per*W).toLocaleString("fr-FR"));
 for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:{wid:w,per}});
  wk.on("message",m=>{acc^=m.acc;if(++done===W){const sec=Number(process.hrtime.bigint()-t0)/1e9,n=per*W;
   console.log("debit : "+Math.round(n/sec).toLocaleString("fr-FR")+" sauts/s   ("+n.toLocaleString("fr-FR")+" sauts en "+sec.toFixed(2)+"s)   acc="+(acc>>>0));process.exit(0);}});
  wk.on("error",e=>{console.error(e);process.exit(1);});}
}else{
 const LOW=0x87>>>0,per=workerData.per,wid=workerData.wid;
 function mulx(p){const c=(p[3]>>>31)&1;p[3]=((p[3]<<1)|(p[2]>>>31))>>>0;p[2]=((p[2]<<1)|(p[1]>>>31))>>>0;p[1]=((p[1]<<1)|(p[0]>>>31))>>>0;p[0]=(p[0]<<1)>>>0;if(c)p[0]^=LOW;return p;}
 const sp=new Uint16Array(256);for(let b=0;b<256;b++){let s=0;for(let k=0;k<8;k++)if((b>>k)&1)s|=(1<<(2*k));sp[b]=s;}
 const shl5=(a,n)=>{const o=new Uint32Array(5);o[0]=(a[0]<<n)>>>0;for(let i=1;i<4;i++)o[i]=((a[i]<<n)|(a[i-1]>>>(32-n)))>>>0;o[4]=a[3]>>>(32-n);return o;};
 function sqr(p){const w=new Uint32Array(8);for(let bi=0;bi<16;bi++){const by=(p[bi>>2]>>>((bi&3)*8))&0xFF;w[bi>>1]=(w[bi>>1]|(sp[by]<<((bi&1)*16)))>>>0;}
  const hi=[w[4],w[5],w[6],w[7]],f1=shl5(hi,1),f2=shl5(hi,2),f7=shl5(hi,7),fo=new Uint32Array(5);
  fo[0]=hi[0];fo[1]=hi[1];fo[2]=hi[2];fo[3]=hi[3];for(let i=0;i<5;i++)fo[i]=(fo[i]^f1[i]^f2[i]^f7[i])>>>0;
  const h2=fo[4]&0xFF,c=(h2^(h2<<1)^(h2<<2)^(h2<<7))>>>0;const r=new Uint32Array(4);r[0]=(w[0]^fo[0]^c)>>>0;r[1]=(w[1]^fo[1])>>>0;r[2]=(w[2]^fo[2])>>>0;r[3]=(w[3]^fo[3])>>>0;return r;}
 let acc=0,nlo=(wid*2654435761)>>>0,nhi=(wid*40503)>>>0;
 for(let j=0;j<per;j++){
  let R=new Uint32Array([1,0,0,0]);
  for(let bit=63;bit>=0;bit--){R=sqr(R);const w=bit<32?nlo:nhi,b=bit&31;if((w>>>b)&1)R=mulx(R);}
  acc^=R[0];nlo=(nlo+0x9E3779B1)>>>0;nhi=(nhi^(nhi<<13))>>>0;
 }
 parentPort.postMessage({acc:acc>>>0});
}
