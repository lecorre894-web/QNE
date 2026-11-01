"use strict";
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1,gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
// Lorenz en RK4 (verite propre)
function lorenz(n,dt){const s=10,rho=28,b=8/3;let x=1,y=1,z=1;const f=(X,Y,Z)=>[s*(Y-X),X*(rho-Z)-Y,X*Y-b*Z];const o=[];
 for(let i=0;i<n+2000;i++){const k1=f(x,y,z);const k2=f(x+dt/2*k1[0],y+dt/2*k1[1],z+dt/2*k1[2]);const k3=f(x+dt/2*k2[0],y+dt/2*k2[1],z+dt/2*k2[2]);const k4=f(x+dt*k3[0],y+dt*k3[1],z+dt*k3[2]);
  x+=dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);y+=dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);z+=dt/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]);if(i>=2000)o.push([x,y,z]);}return o;}
const dt=0.02,LYAP=0.906;
const raw=lorenz(16000,dt),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));
const Nr=300,wash=600,trE=12000,reg=1e-7;
function ridgeSolve(A,F){for(let c=0;c<F;c++){let p=c;for(let r=c+1;r<F;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;const tmp=A[c];A[c]=A[p];A[p]=tmp;const dv=A[c][c]||1e-12;for(let j=c;j<F+3;j++)A[c][j]/=dv;for(let r=0;r<F;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<F+3;j++)A[r][j]-=f*A[c][j];}}}
function essai(kind){
 const F=2*Nr+1;let Wr=null,nb=null;
 const Wi=[0,1,2].map(()=>{const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=0.5*rn();return w;});
 if(kind==="equilateral"){const H=Nr>>1;nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);}
 else{Wr=new Float64Array(Nr*Nr);for(let k=0;k<Wr.length;k++)Wr[k]=(rr()<0.06?gauss():0);
  let v=new Float64Array(Nr);for(let i=0;i<Nr;i++)v[i]=rn();let rad=1;for(let it=0;it<30;it++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++){let s=0,b=i*Nr;for(let j=0;j<Nr;j++)s+=Wr[b+j]*v[j];w[i]=s;}let nw=0;for(let i=0;i<Nr;i++)nw+=w[i]*w[i];nw=Math.sqrt(nw)||1;rad=nw;for(let i=0;i<Nr;i++)v[i]=w[i]/nw;}
  const sc=0.9/rad;for(let k=0;k<Wr.length;k++)Wr[k]*=sc;}
 const x=new Float64Array(Nr);const WR_COUP=0.3;
 const stepf=(u,addN)=>{const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre;if(kind==="equilateral")pre=WR_COUP*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);else{pre=0;let b=i*Nr;for(let j=0;j<Nr;j++)pre+=Wr[b+j]*x[j];}for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];let val=Math.tanh(pre);if(addN)val+=1e-3*gauss();nx[i]=val;}x.set(nx);};
 const feat=()=>{const f=new Float64Array(F);for(let i=0;i<Nr;i++){f[i]=x[i];f[Nr+i]=x[i]*x[i];}f[F-1]=1;return f;};
 const A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+3));
 for(let t=0;t<trE;t++){stepf(S[t],true);if(t<wash)continue;const f=feat(),tg=S[t+1];for(let i=0;i<F;i++){const fi=f[i];if(!fi)continue;for(let j=i;j<F;j++)A[i][j]+=fi*f[j];for(let d=0;d<3;d++)A[i][F+d]+=fi*tg[d];}}
 for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}ridgeSolve(A,F);
 const Wo=[0,1,2].map(d=>{const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F+d];return w;});
 const out=f=>[0,1,2].map(d=>{let s=0;for(let i=0;i<F;i++)s+=Wo[d][i]*f[i];return s;});
 let u=out(feat());const gen=[],tru=[];for(let t=0;t<4000;t++){stepf(u,false);u=out(feat());gen.push(u.slice());tru.push(S[trE+t]);}
 let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.4)break;valid++;}
 const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
 return {lyap:valid*dt*LYAP,clim:stats(gen.slice(0,3000))};}
a=111>>>0;const E=essai("equilateral");
a=222>>>0;const R=essai("random");
console.log("VRAI ESSAI — prediction de Lorenz (RK4), horizon en temps de Lyapunov");
console.log("  jumeau EQUILATERAL (le tien) : "+E.lyap.toFixed(2)+" t_Lyap | climato "+E.clim.map(v=>v.toFixed(2)).join("/"));
console.log("  reservoir RANDOM (le manuel) : "+R.lyap.toFixed(2)+" t_Lyap | climato "+R.clim.map(v=>v.toFixed(2)).join("/"));
console.log("  (vrai attracteur ~ 1.00/1.00/1.00 ; litterature : bons reservoirs ~5-10 t_Lyap)");
