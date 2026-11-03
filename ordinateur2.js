








"use strict";
function qne(N,STEPS){
 const OMEGA2=0.008,DAMP=0.002,PHMOD=0.15,G=1.5,T=2*Math.PI/3,TH=1/3,H=N>>1;
 const re=[new Float32Array(N),new Float32Array(N)],im=[new Float32Array(N),new Float32Array(N)];
 const act=[new Float32Array(N),new Float32Array(N)],sym=[new Int8Array(N),new Int8Array(N)];
 const NB0=new Int32Array(N),NB1=new Int32Array(N),NB2=new Int32Array(N);
 for(let i=0;i<N;i++){NB0[i]=(i+1)%N;NB1[i]=(i-1+N)%N;NB2[i]=(i+H)%N;}
 const SUM3=[0,1,2,0,1,2,0];let a=20261124>>>0;
 const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 for(let i=0;i<N;i++){const ph=rnd()*2*Math.PI,am=0.5+0.5*rnd();re[0][i]=am*Math.cos(ph);im[0][i]=am*Math.sin(ph);act[0][i]=2*rnd()-1;sym[0][i]=(rnd()*3)|0;}
 let p=0;const fb=[1,0,0];const t0=process.hrtime.bigint();
 for(let s=0;s<STEPS;s++){const np=p^1,S=fb[1],iv=fb[0];
  const oR=re[p],oI=im[p],oA=act[p],oS=sym[p],nR=re[np],nI=im[np],nA=act[np],nS=sym[np];
  const half=T*0.5*(1+PHMOD*S),c1=Math.cos(half),s1=Math.sin(half),c2=Math.cos(2*half),s2=Math.sin(2*half);
  let ss=0;
  for(let i=0;i<N;i++){const a0=NB0[i],b=NB1[i],c=NB2[i];const sv=SUM3[oS[a0]+oS[b]+oS[c]];
   const na=Math.tanh(TH*(oA[a0]+oA[b]+oA[c])+0.15);
   let mr=0.5*oR[i]+0.5*TH*(oR[a0]+oR[b]+oR[c]),mi=0.5*oI[i]+0.5*TH*(oI[a0]+oI[b]+oI[c]);
   const cs=sv===0?1:(sv===1?c1:c2),sn=sv===0?0:(sv===1?s1:s2),g=0.5*(1+na);
   let vr=g*(mr*cs-mi*sn)*iv,vi=g*(mr*sn+mi*cs)*iv;
   nR[i]=vr;nI[i]=vi;nA[i]=na;nS[i]=sv;ss+=vr*vr+vi*vi;}
  const E=ss/N;fb[0]=1/Math.sqrt(Math.max(E,1e-12));
  let acc=OMEGA2*((G-1)-fb[1])-DAMP*fb[2];fb[2]+=acc;fb[1]+=fb[2];p=np;}
 const el=Number(process.hrtime.bigint()-t0)/1e9;
 let s0=0,s1=0,s2=0;const oS=sym[p];for(let i=0;i<N;i++){if(oS[i]===0)s0++;else if(oS[i]===1)s1++;else s2++;}
 return {majs:N*STEPS/el,D:1-(Math.abs(s0-N/3)+Math.abs(s1-N/3)+Math.abs(s2-N/3))/N};
}
function groupe(Nr,STEPS,KAPPA,G){
 const LEAK=0.95,WR=0.33,WIN=0.5,TH=1/3,H=Nr>>1,ETA=0.3,WARM=1200,EV=Math.floor(STEPS*0.6),PI=Math.PI;
 const NB0=new Int32Array(Nr),NB1=new Int32Array(Nr),NB2=new Int32Array(Nr);
 for(let i=0;i<Nr;i++){NB0[i]=(i+1)%Nr;NB1[i]=(i-1+Nr)%Nr;NB2[i]=(i+H)%Nr;}
 const X=[],NX=[];for(let k=0;k<G;k++){X.push(new Float64Array(Nr));NX.push(new Float64Array(Nr));}
 const phi=new Float64Array(G);for(let k=0;k<G;k++)phi[k]=2*PI*k/G;
 const w=new Float64Array(G*Nr),M=new Float64Array(Nr);let a=424242>>>0;
 const rnd=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 for(let k=0;k<G;k++)for(let i=0;i<Nr;i++)X[k][i]=2*rnd()-1;
 let se=0,sy=0;
 for(let s=0;s<WARM+STEPS;s++){const un=Math.sin((s+1)*0.017)+0.3*Math.sin((s+1)*0.0031);
  for(let i=0;i<Nr;i++){let m=0;for(let k=0;k<G;k++)m+=X[k][i];M[i]=m/G;}
  for(let k=0;k<G;k++){const xk=X[k],nk=NX[k],p=phi[k];const uk=Math.sin(s*0.017+p)+0.3*Math.sin(s*0.0031+p);
   for(let i=0;i<Nr;i++){const loc=TH*(xk[NB0[i]]+xk[NB1[i]]+xk[NB2[i]]);nk[i]=(1-LEAK)*xk[i]+LEAK*Math.tanh(WR*3*loc+WIN*uk+KAPPA*M[i]);}}
  for(let k=0;k<G;k++){const t=X[k];X[k]=NX[k];NX[k]=t;}
  if(s>=WARM){let yh=0,nrm=1;for(let k=0;k<G;k++){const xk=X[k];for(let i=0;i<Nr;i++){yh+=w[k*Nr+i]*xk[i];nrm+=xk[i]*xk[i];}}
   const e=un-yh,g=ETA*e/nrm;for(let k=0;k<G;k++){const xk=X[k];for(let i=0;i<Nr;i++)w[k*Nr+i]+=g*xk[i];}
   if(s>=WARM+EV){se+=e*e;sy+=un*un;}}}
 return Math.max(0,100*(1-Math.sqrt(se/Math.max(sy,1e-12))));
}
const G=Math.max(2,parseInt(process.argv[2],10)||4);
console.log("=== ORDINATEUR QNE — alimentation auto-adaptee a la puissance ===");
const L=qne(200000,2000);
console.log("TWIN LINEAIRE (Float32)  : "+Math.round(L.majs).toLocaleString("fr-FR")+" maj/s   Δ="+L.D.toFixed(4));
console.log("TWIN NON-LINEAIRE        : "+G+" jumeaux couples, alim phi=2pi.k/"+G+" (auto)");
console.log("  aptitude = "+groupe(400,25000,0.3,G).toFixed(1)+"%");
