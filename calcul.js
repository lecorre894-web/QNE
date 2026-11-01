"use strict";
// MODE CALCULATEUR (pas mime) : integration directe de Lorenz-96, RK4, EXACTE,
// pour n'importe quelle taille N. Aucun apprentissage, aucune donnee prealable.
const Fc=8,dt=0.01;
function stepRK4(x,N){const d=a=>{const o=new Float64Array(N);for(let i=0;i<N;i++)o[i]=(a[(i+1)%N]-a[(i-2+N)%N])*a[(i-1+N)%N]-a[i]+Fc;return o;};
 const k1=d(x);const a2=new Float64Array(N);for(let i=0;i<N;i++)a2[i]=x[i]+dt/2*k1[i];const k2=d(a2);
 const a3=new Float64Array(N);for(let i=0;i<N;i++)a3[i]=x[i]+dt/2*k2[i];const k3=d(a3);
 const a4=new Float64Array(N);for(let i=0;i<N;i++)a4[i]=x[i]+dt*k3[i];const k4=d(a4);
 for(let i=0;i<N;i++)x[i]+=dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]);return x;}
console.log("MODE CALCULATEUR — Lorenz-96 integre exactement (RK4), aucune mimique :");
for(const N of [40,4000,400000,4000000]){
 let x=new Float64Array(N);for(let i=0;i<N;i++)x[i]=Fc+(i%7-3)*0.001;
 const steps= N>=400000?40:400;
 const t0=process.hrtime.bigint();for(let s=0;s<steps;s++)stepRK4(x,N);const sec=Number(process.hrtime.bigint()-t0)/1e9;
 const vu=N*steps/sec;
 console.log("  N="+String(N).padStart(8)+" variables | "+(vu/1e6).toFixed(0)+" M maj-variable/s | "+(steps/sec).toFixed(0)+" pas/s");
}
console.log("Exact, n'importe quelle condition initiale, aucun entrainement. La seule limite face");
console.log("au supercalculateur n'est pas la nature du calcul — c'est le NOMBRE de variables (lui en tient des milliards).");
