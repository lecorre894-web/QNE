#!/usr/bin/env node
/* Everest : réservoir DENSE (connexions aléatoires tous-à-tous, rayon spectral calé).
   Apprend Lorenz, puis roue libre pour recréer l'attracteur. */
"use strict";
let a=20261124>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*r()-1, gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const out=[];
 for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)out.push([x,y,z]);}return out;}
const raw=lorenz(12000),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));

const Nr=500,rho=0.9,win=0.12,leak=1.0,reg=1e-5;
// matrice réservoir dense aléatoire
const Wr=new Float64Array(Nr*Nr);for(let k=0;k<Wr.length;k++)Wr[k]=gauss();
// rayon spectral par itération de puissance
let v=new Float64Array(Nr);for(let i=0;i<Nr;i++)v[i]=rn();let rad=1;
for(let it=0;it<40;it++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++){let s=0,b=i*Nr;for(let j=0;j<Nr;j++)s+=Wr[b+j]*v[j];w[i]=s;}
 let nw=0;for(let i=0;i<Nr;i++)nw+=w[i]*w[i];nw=Math.sqrt(nw)||1;rad=nw;for(let i=0;i<Nr;i++)v[i]=w[i]/nw;}
const sc=rho/rad;for(let k=0;k<Wr.length;k++)Wr[k]*=sc;   // calage du rayon spectral
const Wi=[];for(let d=0;d<3;d++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=win*rn();Wi.push(w);}
function upd(x,u){const nx=new Float64Array(Nr);
 for(let i=0;i<Nr;i++){let pre=0,b=i*Nr;for(let j=0;j<Nr;j++)pre+=Wr[b+j]*x[j];for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];
  nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}return nx;}

const wash=500,trainEnd=8000;let x=new Float64Array(Nr);const X=[];
for(let t=0;t<trainEnd;t++){x=upd(x,S[t]);if(t>=wash)X.push(x);}
const F=Nr+1,A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+3));
for(let k=0;k<X.length;k++){const xt=X[k],tgt=S[wash+k+1];
 for(let i=0;i<F;i++){const xi=i<Nr?xt[i]:1;for(let j=i;j<F;j++){const xj=j<Nr?xt[j]:1;A[i][j]+=xi*xj;}for(let d=0;d<3;d++)A[i][F+d]+=xi*tgt[d];}}
for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
for(let c=0;c<F;c++){let piv=c;for(let r2=c+1;r2<F;r2++)if(Math.abs(A[r2][c])>Math.abs(A[piv][c]))piv=r2;const tmp=A[c];A[c]=A[piv];A[piv]=tmp;const d=A[c][c]||1e-12;for(let j=c;j<F+3;j++)A[c][j]/=d;for(let r2=0;r2<F;r2++)if(r2!==c){const f=A[r2][c];for(let j=c;j<F+3;j++)A[r2][j]-=f*A[c][j];}}
const Wo=[0,1,2].map(d=>{const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F+d];return w;});
const out=xt=>[0,1,2].map(d=>{let s=Wo[d][Nr];for(let i=0;i<Nr;i++)s+=Wo[d][i]*xt[i];return s;});

let xs=X[X.length-1],u=out(xs);const gen=[],tru=[],start=trainEnd;
for(let t=0;t<3000;t++){xs=upd(xs,u);u=out(xs);gen.push(u);tru.push(S[start+t+1]);}
let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.3)break;valid++;}
const lyap=(valid*0.02*0.906).toFixed(2);
const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
const sg=stats(gen),st=stats(tru);
console.log("EVEREST — réservoir DENSE "+Nr+" nœuds, rayon spectral calé à "+rho);
console.log("--------------------------------------------------");
console.log("temps valide (suit Lorenz)      : "+valid+" pas = "+lyap+" temps de Lyapunov");
console.log("climatologie (écart-type, cible 1.00) :");
console.log("  généré x/y/z : "+sg.map(v=>v.toFixed(2)).join(" / "));
console.log("  vrai   x/y/z : "+st.map(v=>v.toFixed(2)).join(" / "));
const climOK=sg.every((v,d)=>Math.abs(v-st[d])<0.2);
console.log("--------------------------------------------------");
console.log(( +lyap>=4 ? "SOMMET ATTEINT" : (+lyap>=2.5?"haute altitude":"progrès"))+" — trajectoire ~"+lyap+" t.Lyap ; attracteur "+(climOK?"RECRÉÉ fidèlement ✓":"approché"));
