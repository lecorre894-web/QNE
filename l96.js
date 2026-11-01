"use strict";
let seed=42>>>0;const rr=()=>{seed|=0;seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1;
// Lorenz-96 : 40 variables couplees, F=8 (chaos spatio-temporel), RK4
const Ndim=40,Fc=8,dt=0.01;
function deriv(x){const d=new Float64Array(Ndim);for(let i=0;i<Ndim;i++){d[i]=(x[(i+1)%Ndim]-x[(i-2+Ndim)%Ndim])*x[(i-1+Ndim)%Ndim]-x[i]+Fc;}return d;}
function gen(n){let x=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)x[i]=Fc+0.01*rn();const o=[];
 for(let s=0;s<n+2000;s++){const k1=deriv(x);const x2=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)x2[i]=x[i]+dt/2*k1[i];const k2=deriv(x2);
  const x3=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)x3[i]=x[i]+dt/2*k2[i];const k3=deriv(x3);
  const x4=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)x4[i]=x[i]+dt*k3[i];const k4=deriv(x4);
  for(let i=0;i<Ndim;i++)x[i]+=dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]);if(s>=2000)o.push(Float64Array.from(x));}return o;}
const raw=gen(9000);const mu=new Float64Array(Ndim),sd=new Float64Array(Ndim);
for(const p of raw)for(let i=0;i<Ndim;i++)mu[i]+=p[i];for(let i=0;i<Ndim;i++)mu[i]/=raw.length;
for(const p of raw)for(let i=0;i<Ndim;i++)sd[i]+=(p[i]-mu[i])**2;for(let i=0;i<Ndim;i++)sd[i]=Math.sqrt(sd[i]/raw.length);
const S=raw.map(p=>{const q=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)q[i]=(p[i]-mu[i])/sd[i];return q;});
const Nr=800,H=Nr>>1,wash=800,trE=7500,reg=1e-7,WR=0.3,LYAP=1.67;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=[];for(let d=0;d<Ndim;d++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=0.2*rn();Wi.push(w);}
const x=new Float64Array(Nr);
const step=u=>{const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre=WR*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<Ndim;d++)pre+=Wi[d][i]*u[d];nx[i]=Math.tanh(pre);}x.set(nx);};
const Ff=2*Nr+1;const feat=()=>{const f=new Float64Array(Ff);for(let i=0;i<Nr;i++){f[i]=x[i];f[Nr+i]=x[i]*x[i];}f[Ff-1]=1;return f;};
const tb=Date.now();
const A=[];for(let i=0;i<Ff;i++)A.push(new Float64Array(Ff+Ndim));
for(let t=0;t<trE;t++){step(S[t]);if(t<wash)continue;const f=feat(),tg=S[t+1];for(let i=0;i<Ff;i++){const fi=f[i];if(!fi)continue;for(let j=i;j<Ff;j++)A[i][j]+=fi*f[j];for(let d=0;d<Ndim;d++)A[i][Ff+d]+=fi*tg[d];}}
for(let i=0;i<Ff;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
for(let c=0;c<Ff;c++){let p=c;for(let r=c+1;r<Ff;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;const tmp=A[c];A[c]=A[p];A[p]=tmp;const dv=A[c][c]||1e-12;for(let j=c;j<Ff+Ndim;j++)A[c][j]/=dv;for(let r=0;r<Ff;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<Ff+Ndim;j++)A[r][j]-=f*A[c][j];}}
const Wo=[];for(let d=0;d<Ndim;d++){const w=new Float64Array(Ff);for(let i=0;i<Ff;i++)w[i]=A[i][Ff+d];Wo.push(w);}
const out=f=>{const o=new Float64Array(Ndim);for(let d=0;d<Ndim;d++){let s=0;const w=Wo[d];for(let i=0;i<Ff;i++)s+=w[i]*f[i];o[d]=s;}return o;};
let u=out(feat());let valid=0;
for(let t=0;t<3000;t++){step(u);u=out(feat());let e=0;const tg=S[trE+t];for(let d=0;d<Ndim;d++)e+=(u[d]-tg[d])**2;if(Math.sqrt(e/Ndim)>0.4)break;valid++;}
console.log("LORENZ-96 (40 variables couplees, chaos spatio-temporel) mime par equilateral "+Nr);
console.log("  horizon de mimique : "+valid+" pas = "+(valid*dt*LYAP).toFixed(2)+" temps de Lyapunov | build "+((Date.now()-tb)/1000).toFixed(0)+" s");
