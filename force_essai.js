"use strict";
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1;
function lorenz(n,dt){const s=10,rho=28,b=8/3;let x=1,y=1,z=1;const f=(X,Y,Z)=>[s*(Y-X),X*(rho-Z)-Y,X*Y-b*Z];const o=[];
 for(let i=0;i<n+2000;i++){const k1=f(x,y,z);const k2=f(x+dt/2*k1[0],y+dt/2*k1[1],z+dt/2*k1[2]);const k3=f(x+dt/2*k2[0],y+dt/2*k2[1],z+dt/2*k2[2]);const k4=f(x+dt*k3[0],y+dt*k3[1],z+dt*k3[2]);
  x+=dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);y+=dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);z+=dt/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]);if(i>=2000)o.push([x,y,z]);}return o;}
const dt=0.02,LYAP=0.906;
const raw=lorenz(16000,dt),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));
const Nr=300,H=Nr>>1,wash=600,trE=12000,WR=0.3;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=[0,1,2].map(()=>{const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=0.5*rn();return w;});
const x=new Float64Array(Nr);
const step=u=>{const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre=WR*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];nx[i]=Math.tanh(pre);}x.set(nx);};
const F=2*Nr+1;const feat=()=>{const f=new Float64Array(F);for(let i=0;i<Nr;i++){f[i]=x[i];f[Nr+i]=x[i]*x[i];}f[F-1]=1;return f;};
// FORCE : boucle fermee + RLS. P = I/alpha, on renvoie la prediction.
const Wo=[new Float64Array(F),new Float64Array(F),new Float64Array(F)];
const alpha=1;const P=[];for(let i=0;i<F;i++){const r=new Float64Array(F);r[i]=1/alpha;P.push(r);}
let u=[S[0][0],S[0][1],S[0][2]];
for(let t=0;t<trE;t++){
 if(t<wash){step(S[t]);u=S[t+1].slice();continue;}
 step(u);const f=feat();
 const pred=[0,1,2].map(d=>{let s=0;const w=Wo[d];for(let i=0;i<F;i++)s+=w[i]*f[i];return s;});
 const Pf=new Float64Array(F);for(let i=0;i<F;i++){let s=0,Pi=P[i];for(let j=0;j<F;j++)s+=Pi[j]*f[j];Pf[i]=s;}
 let den=1;for(let i=0;i<F;i++)den+=f[i]*Pf[i];
 const k=new Float64Array(F);for(let i=0;i<F;i++)k[i]=Pf[i]/den;
 for(let i=0;i<F;i++){const Pi=P[i],ki=k[i];for(let j=0;j<F;j++)Pi[j]-=ki*Pf[j];}
 for(let d=0;d<3;d++){const e=pred[d]-S[t+1][d];const w=Wo[d];for(let i=0;i<F;i++)w[i]-=e*k[i];}
 u=pred;
}
const out=f=>[0,1,2].map(d=>{let s=0;const w=Wo[d];for(let i=0;i<F;i++)s+=w[i]*f[i];return s;});
let uu=out(feat());const gen=[],tru=[];for(let t=0;t<4000;t++){step(uu);uu=out(feat());gen.push(uu.slice());tru.push(S[trE+t]);}
let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.4)break;valid++;}
const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
const c=stats(gen.slice(0,3000));
console.log("EQUILATERAL + FORCE (systeme adapte au calcul, boucle fermee)");
console.log("  horizon : "+(valid*dt*LYAP).toFixed(2)+" t_Lyap | climato "+c.map(v=>v.toFixed(2)).join("/"));
console.log("  rappel : equilateral BRUT=0.43 | random BRUT=3.70 t_Lyap");
