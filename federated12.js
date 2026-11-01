"use strict";
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1,gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const o=[];for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)o.push([x,y,z]);}return o;}
const raw=lorenz(11000),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));
const wash=400,trainEnd=7000,noise=1e-3,reg=1e-7;

// --- une banque de reservoirs equilateraux (R reservoirs de n noeuds) ---
function makeBank(specs){ // specs: [{n,leak,wr,win}]
 const banks=specs.map(sp=>{const H=Math.floor(sp.n/2);const Wi=[];for(let d=0;d<3;d++){const w=new Float64Array(sp.n);for(let i=0;i<sp.n;i++)w[i]=sp.win*rn();Wi.push(w);}return{...sp,H,Wi,x:new Float64Array(sp.n)};});
 const TOT=banks.reduce((s,b)=>s+b.n,0);
 function step(u,addN){let off=0;const big=new Float64Array(TOT);
  for(const b of banks){const n=b.n,H=b.H,nx=new Float64Array(n);
   for(let i=0;i<n;i++){const pre=b.wr*(b.x[(i+1)%n]+b.x[(i-1+n)%n]+b.x[(i+H)%n])+b.Wi[0][i]*u[0]+b.Wi[1][i]*u[1]+b.Wi[2][i]*u[2];
    let v=(1-b.leak)*b.x[i]+b.leak*Math.tanh(pre);if(addN)v+=noise*gauss();nx[i]=v;}
   b.x.set(nx);for(let i=0;i<n;i++)big[off+i]=nx[i];off+=n;}
  return big;}
 return {step,TOT};
}
function train(bank){const F=2*bank.TOT+1;
 const feat=big=>{const f=new Float64Array(F);for(let i=0;i<bank.TOT;i++){f[i]=big[i];f[bank.TOT+i]=big[i]*big[i];}f[F-1]=1;return f;};
 const A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+3));
 for(let t=0;t<trainEnd;t++){const big=bank.step(S[t],true);if(t<wash)continue;const f=feat(big),tg=S[t+1];
  for(let i=0;i<F;i++){const fi=f[i];if(fi===0)continue;for(let j=i;j<F;j++)A[i][j]+=fi*f[j];for(let d=0;d<3;d++)A[i][F+d]+=fi*tg[d];}}
 for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
 for(let c=0;c<F;c++){let p=c;for(let r=c+1;r<F;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;const tmp=A[c];A[c]=A[p];A[p]=tmp;const dv=A[c][c]||1e-12;for(let j=c;j<F+3;j++)A[c][j]/=dv;for(let r=0;r<F;r++)if(r!==c){const fc=A[r][c];if(fc===0)continue;for(let j=c;j<F+3;j++)A[r][j]-=fc*A[c][j];}}
 const Wo=[0,1,2].map(d=>{const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F+d];return w;});
 const out=f=>[0,1,2].map(d=>{let s=0;for(let i=0;i<F;i++)s+=Wo[d][i]*f[i];return s;});
 return {feat,out};
}
function evaluate(bank,tr){let u=tr.out(tr.feat(bank.step(S[trainEnd],false)));const gen=[],tru=[];
 for(let t=0;t<2500;t++){const big=bank.step(u,false);u=tr.out(tr.feat(big));gen.push(u.slice());tru.push(S[trainEnd+1+t]);}
 let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.3)break;valid++;}
 const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
 return {lyap:(valid*0.02*0.906),clim:stats(gen),vrai:stats(tru)};
}
// 12 reservoirs varies, ~40 noeuds chacun = 480 total
const specs12=[];for(let k=0;k<12;k++)specs12.push({n:40,leak:0.3+0.6*(k/11),wr:0.30+0.02*k,win:0.4+0.2*((k%3)/2)});
// baseline : UN seul reservoir de meme taille totale (480)
const specs1=[{n:480,leak:0.95,wr:0.33,win:0.4}];

const t0=Date.now();
a=20261124>>>0; const b12=makeBank(specs12); const r12=evaluate(b12,train(b12));
a=777777>>>0;   const b1=makeBank(specs1);   const r1=evaluate(b1,train(b1));
const sec=(Date.now()-t0)/1e3;
const line=(nom,r)=>nom+" : temps valide "+r.lyap.toFixed(2)+" t_Lyap | climato "+r.clim.map(v=>v.toFixed(2)).join("/")+" (vrai "+r.vrai.map(v=>v.toFixed(2)).join("/")+")";
console.log("FEDERATION — Lorenz autonome, lecture quadratique, boucle fermee");
console.log(line("12 equilateraux (480 n)",r12));
console.log(line(" 1 equilateral  (480 n)",r1));
console.log("temps total : "+sec.toFixed(0)+" s");
