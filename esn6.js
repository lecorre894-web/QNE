#!/usr/bin/env node
/* ADAPTER LE CALCUL AU SYSTÈME : lecture quadratique [r, r^2] (on enrichit le
   calcul fait sur les états, pas le système) + bruit d'entraînement (stabilise
   la roue libre). Réservoir = équilatéral de René. Épreuve : Lorenz autonome. */
"use strict";
let a=20261124>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t^(t>>>14))>>>0))/4294967296;};
const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1,gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const o=[];for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)o.push([x,y,z]);}return o;}
const raw=lorenz(13000),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));

const Nr=300,H=Math.floor(Nr/2),leak=0.95,wr=0.33,win=0.4,reg=1e-7,noise=1e-3;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=[];for(let d=0;d<3;d++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=win*rn();Wi.push(w);}
const x=new Float64Array(Nr);
function step(u,addN){const nx=new Float64Array(Nr);
 for(let i=0;i<Nr;i++){let pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];
  let v=(1-leak)*x[i]+leak*Math.tanh(pre);if(addN)v+=noise*gauss();nx[i]=v;}x.set(nx);}
const Ff=2*Nr+1;                                  // features : [r, r^2, 1]
function feat(){const f=new Float64Array(Ff);for(let i=0;i<Nr;i++){f[i]=x[i];f[Nr+i]=x[i]*x[i];}f[Ff-1]=1;return f;}

const wash=400,trainEnd=9000;const X=[];
for(let t=0;t<trainEnd;t++){step(S[t],true);if(t>=wash)X.push(feat());}
const A=[];for(let i=0;i<Ff;i++)A.push(new Float64Array(Ff+3));
for(let k=0;k<X.length;k++){const xt=X[k],tg=S[wash+k+1];for(let i=0;i<Ff;i++){const xi=xt[i];if(xi===0)continue;for(let j=i;j<Ff;j++)A[i][j]+=xi*xt[j];for(let d=0;d<3;d++)A[i][Ff+d]+=xi*tg[d];}}
for(let i=0;i<Ff;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
for(let c=0;c<Ff;c++){let piv=c;for(let r2=c+1;r2<Ff;r2++)if(Math.abs(A[r2][c])>Math.abs(A[piv][c]))piv=r2;const tmp=A[c];A[c]=A[piv];A[piv]=tmp;const d=A[c][c]||1e-12;for(let j=c;j<Ff+3;j++)A[c][j]/=d;for(let r2=0;r2<Ff;r2++)if(r2!==c){const f=A[r2][c];if(f===0)continue;for(let j=c;j<Ff+3;j++)A[r2][j]-=f*A[c][j];}}
const Wo=[0,1,2].map(d=>{const w=new Float64Array(Ff);for(let i=0;i<Ff;i++)w[i]=A[i][Ff+d];return w;});
const out=f=>[0,1,2].map(d=>{let s=0;for(let i=0;i<Ff;i++)s+=Wo[d][i]*f[i];return s;});

let u=out(feat());const gen=[],tru=[];
for(let t=0;t<3000;t++){step(u,false);u=out(feat());gen.push(u.slice());tru.push(S[trainEnd+t]);}
let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.3)break;valid++;}
const lyap=(valid*0.02*0.906).toFixed(2);
const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
const sg=stats(gen),st2=stats(tru);
console.log("CALCUL ADAPTÉ AU SYSTÈME — lecture quadratique [r,r²] + bruit, équilatéral "+Nr);
console.log("--------------------------------------------------");
console.log("temps valide (suit Lorenz) : "+valid+" pas = "+lyap+" temps de Lyapunov");
console.log("climatologie (cible 1.00) — généré x/y/z: "+sg.map(v=>v.toFixed(2)).join(" / ")+"  | vrai: "+st2.map(v=>v.toFixed(2)).join(" / "));
const climOK=sg.every((v,d)=>Math.abs(v-st2[d])<0.2);
console.log("--------------------------------------------------");
console.log((+lyap>=4?"SOMMET ✓✓✓":(+lyap>=2.5?"haute altitude ✓":"progrès"))+" — attracteur "+(climOK?"RECRÉÉ FIDÈLEMENT ✓":"approché"));
