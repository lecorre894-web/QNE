"use strict";
const Fc=8,dt=0.01;
// RK4 bas-memoire : 4 buffers reutilises (x, acc, tmp, k), zero allocation par pas
function makeInt(N){const x=new Float64Array(N),acc=new Float64Array(N),tmp=new Float64Array(N),k=new Float64Array(N);
 for(let i=0;i<N;i++)x[i]=Fc+(i%7-3)*0.001;
 const deriv=(a,out)=>{for(let i=0;i<N;i++){const ip1=i+1<N?i+1:0,im1=i>0?i-1:N-1,im2=i>1?i-2:(i+N-2);out[i]=(a[ip1]-a[im2%N])*a[im1]-a[i]+Fc;}};
 return ()=>{ // un pas RK4
  deriv(x,k);for(let i=0;i<N;i++){acc[i]=k[i];tmp[i]=x[i]+dt/2*k[i];}
  deriv(tmp,k);for(let i=0;i<N;i++){acc[i]+=2*k[i];tmp[i]=x[i]+dt/2*k[i];}
  deriv(tmp,k);for(let i=0;i<N;i++){acc[i]+=2*k[i];tmp[i]=x[i]+dt*k[i];}
  deriv(tmp,k);for(let i=0;i<N;i++){x[i]+=dt/6*(acc[i]+k[i]);}
 };}
console.log("PLAFOND DU CALCULATEUR (Lorenz-96 exact, RK4 bas-memoire)");
let last=0;
for(const N of [1e6,1e7,5e7,1e8,2e8,4e8]){
 try{const Ni=N|0===N?N:Math.round(N);const stepf=makeInt(Ni);
  const steps=Ni>=5e7?20:200;const t0=process.hrtime.bigint();for(let s=0;s<steps;s++)stepf();const sec=Number(process.hrtime.bigint()-t0)/1e9;
  const vu=Ni*steps/sec,gb=Ni*8*4/1e9;
  console.log("  N="+(Ni/1e6)+"M variables ("+gb.toFixed(1)+" Go) OK | "+(vu/1e6).toFixed(0)+" M maj/s | "+(steps/sec).toFixed(1)+" pas/s");
  last=Ni;
 }catch(e){console.log("  N="+(N/1e6)+"M -> LIMITE ATTEINTE : "+e.message);break;}
}
console.log("plafond bac a sable ~ "+(last/1e6)+"M variables.");
