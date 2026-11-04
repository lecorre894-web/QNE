








"use strict";
const FOIS=Math.max(1,parseInt(process.argv[2],10)||20);
const MEMCAP=1.3*1024*1024*1024;
const TCAP=15;
console.log("PHASES QUI DOUBLENT — cube LxLxL, "+FOIS+" fois par phase");
console.log("--------------------------------------------------");
console.log("  L   |   cellules   |  temps   |   debit (maj/s)");
let L=8;
while(true){
 const N=L*L*L, besoin=N*8*2;
 if(besoin>MEMCAP){console.log("  "+String(L).padStart(3)+"   |  "+N.toLocaleString("fr-FR")+" cellules -> MUR MEMOIRE ("+(besoin/1e9).toFixed(1)+" Go), phase non lancee");break;}
 let a,b;
 try{a=new Float64Array(N);b=new Float64Array(N);}catch(e){console.log("  "+String(L).padStart(3)+"   | allocation refusee -> MUR MEMOIRE");break;}
 for(let i=0;i<N;i++)a[i]=Math.sin(i*0.001);
 const L2=L*L,t0=process.hrtime.bigint();
 for(let s=0;s<FOIS;s++){
  for(let z=0;z<L;z++)for(let y=0;y<L;y++)for(let x=0;x<L;x++){
   const i=x+L*y+L2*z;
   const xp=(x+1)%L,xm=(x-1+L)%L,yp=(y+1)%L,ym=(y-1+L)%L,zp=(z+1)%L,zm=(z-1+L)%L;
   const sum=a[xp+L*y+L2*z]+a[xm+L*y+L2*z]+a[x+L*yp+L2*z]+a[x+L*ym+L2*z]+a[x+L*y+L2*zp]+a[x+L*y+L2*zm];
   b[i]=Math.tanh(sum/6);
  }
  const t=a;a=b;b=t;
 }
 const el=Number(process.hrtime.bigint()-t0)/1e9, maj=N*FOIS;
 console.log("  "+String(L).padStart(3)+"   |  "+N.toLocaleString("fr-FR").padStart(11)+" |  "+el.toFixed(2)+"s   |  "+Math.round(maj/el).toLocaleString("fr-FR"));
 if(el>TCAP){console.log("  -> phase trop longue : les suivantes (x8 chaque fois) ne finiraient pas. STOP.");break;}
 L*=2;
}
