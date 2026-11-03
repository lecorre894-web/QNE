








"use strict";
function jumelage(Nr,STEPS,KAPPA,PHI){
 const LEAK=0.95,WR=0.33,WIN=0.5,TH=1/3,H=Nr>>1,ETA=0.3,WARM=1200,EV=Math.floor(STEPS*0.6);
 const NB0=new Int32Array(Nr),NB1=new Int32Array(Nr),NB2=new Int32Array(Nr);
 for(let i=0;i<Nr;i++){NB0[i]=(i+1)%Nr;NB1[i]=(i-1+Nr)%Nr;NB2[i]=(i+H)%Nr;}
 let A=new Float64Array(Nr),B=new Float64Array(Nr),nA=new Float64Array(Nr),nB=new Float64Array(Nr);
 const w=new Float64Array(2*Nr);let a=424242>>>0;
 const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 for(let i=0;i<Nr;i++){A[i]=2*rnd()-1;B[i]=2*rnd()-1;}
 let se=0,sy=0;
 for(let s=0;s<WARM+STEPS;s++){
  const uA=Math.sin(s*0.017)+0.3*Math.sin(s*0.0031);
  const uB=Math.sin(s*0.017+PHI)+0.3*Math.sin(s*0.0031+PHI);
  const un=Math.sin((s+1)*0.017)+0.3*Math.sin((s+1)*0.0031);
  for(let i=0;i<Nr;i++){const mA=TH*(A[NB0[i]]+A[NB1[i]]+A[NB2[i]]),mB=TH*(B[NB0[i]]+B[NB1[i]]+B[NB2[i]]);
   nA[i]=(1-LEAK)*A[i]+LEAK*Math.tanh(WR*3*mA+WIN*uA+KAPPA*B[i]);
   nB[i]=(1-LEAK)*B[i]+LEAK*Math.tanh(WR*3*mB+WIN*uB+KAPPA*A[i]);}
  let t=A;A=nA;nA=t;t=B;B=nB;nB=t;
  if(s>=WARM){let yh=0,nrm=1;for(let i=0;i<Nr;i++){yh+=w[i]*A[i]+w[Nr+i]*B[i];nrm+=A[i]*A[i]+B[i]*B[i];}
   const e=un-yh,g=ETA*e/nrm;for(let i=0;i<Nr;i++){w[i]+=g*A[i];w[Nr+i]+=g*B[i];}
   if(s>=WARM+EV){se+=e*e;sy+=un*un;}}}
 return Math.max(0,100*(1-Math.sqrt(se/Math.max(sy,1e-12))));
}
console.log("ALIMENTATION differenciee — jumelage couple (kappa=0.3)");
console.log("rappel : kappa=0 -> 94.3%   |   kappa=0.3 alim identique -> 87.1%");
console.log("--------------------------------------------------");
const PI=Math.PI;
for(const [nom,phi] of [["0 (identique)",0],["pi/6",PI/6],["pi/4",PI/4],["pi/2",PI/2],["pi (oppose)",PI]]){
 const f=jumelage(400,30000,0.3,phi);console.log("dephasage alim B = "+nom.padEnd(14)+" -> aptitude = "+f.toFixed(1)+"%");}
