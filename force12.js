"use strict";
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1;
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const o=[];for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)o.push([x,y,z]);}return o;}
const raw=lorenz(9000),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));
const wash=300,trainEnd=5500;

function makeBank(specs){
 const banks=specs.map(sp=>{const H=Math.floor(sp.n/2);const Wi=[];for(let d=0;d<3;d++){const w=new Float64Array(sp.n);for(let i=0;i<sp.n;i++)w[i]=sp.win*rn();Wi.push(w);}return{...sp,H,Wi,x:new Float64Array(sp.n)};});
 const TOT=banks.reduce((s,b)=>s+b.n,0);
 const step=(u)=>{let off=0;const big=new Float64Array(TOT);
  for(const b of banks){const n=b.n,H=b.H,nx=new Float64Array(n);
   for(let i=0;i<n;i++){const pre=b.wr*(b.x[(i+1)%n]+b.x[(i-1+n)%n]+b.x[(i+H)%n])+b.Wi[0][i]*u[0]+b.Wi[1][i]*u[1]+b.Wi[2][i]*u[2];
    nx[i]=(1-b.leak)*b.x[i]+b.leak*Math.tanh(pre);}
   b.x.set(nx);for(let i=0;i<n;i++)big[off+i]=nx[i];off+=n;}
  return big;};
 return {step,TOT};
}
function forceTrain(bank){const F=2*bank.TOT+1;
 const feat=big=>{const f=new Float64Array(F);for(let i=0;i<bank.TOT;i++){f[i]=big[i];f[bank.TOT+i]=big[i]*big[i];}f[F-1]=1;return f;};
 const Wo=[new Float64Array(F),new Float64Array(F),new Float64Array(F)];
 const P=[];for(let i=0;i<F;i++){const row=new Float64Array(F);row[i]=1;P.push(row);} // P=I/alpha, alpha=1
 let u=[0,0,0];
 for(let t=0;t<trainEnd;t++){
  if(t<wash){bank.step(S[t]);u=S[t+1].slice();continue;} // amorce teacher
  const big=bank.step(u);const f=feat(big);
  const pred=[0,1,2].map(d=>{let s=0;const w=Wo[d];for(let i=0;i<F;i++)s+=w[i]*f[i];return s;});
  // RLS
  const Pf=new Float64Array(F);for(let i=0;i<F;i++){let s=0,Pi=P[i];for(let j=0;j<F;j++)s+=Pi[j]*f[j];Pf[i]=s;}
  let den=1;for(let i=0;i<F;i++)den+=f[i]*Pf[i];
  const k=new Float64Array(F);for(let i=0;i<F;i++)k[i]=Pf[i]/den;
  for(let i=0;i<F;i++){const Pi=P[i],ki=k[i];for(let j=0;j<F;j++)Pi[j]-=ki*Pf[j];}
  for(let d=0;d<3;d++){const e=pred[d]-S[t+1][d];const w=Wo[d];for(let i=0;i<F;i++)w[i]-=e*k[i];}
  u=pred; // boucle fermee
 }
 const out=f=>[0,1,2].map(d=>{let s=0;const w=Wo[d];for(let i=0;i<F;i++)s+=w[i]*f[i];return s;});
 return {feat,out};
}
function evaluate(bank,tr){let u=tr.out(tr.feat(bank.step(S[trainEnd])));const gen=[],tru=[];
 for(let t=0;t<2500;t++){const big=bank.step(u);u=tr.out(tr.feat(big));gen.push(u.slice());tru.push(S[trainEnd+1+t]);}
 let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.3)break;valid++;}
 const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
 return {lyap:(valid*0.02*0.906),clim:stats(gen),vrai:stats(tru)};
}
const specs12=[];for(let k=0;k<12;k++)specs12.push({n:40,leak:0.9,wr:0.32+0.01*k,win:0.4});
const t0=Date.now();
a=20261124>>>0;const b=makeBank(specs12);const r=evaluate(b,forceTrain(b));
const sec=(Date.now()-t0)/1e3;
console.log("FORCE — 12 equilateraux (480 n), systeme adapte au calcul (boucle fermee)");
console.log("temps valide : "+r.lyap.toFixed(2)+" t_Lyap");
console.log("climato generee : "+r.clim.map(v=>v.toFixed(2)).join(" / ")+"   (vrai "+r.vrai.map(v=>v.toFixed(2)).join(" / ")+")");
console.log("rappel boucle ouverte : 0.91 t_Lyap, climato 1.02/1.16/1.34");
console.log("temps : "+sec.toFixed(0)+" s");
