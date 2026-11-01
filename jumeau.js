"use strict";
// JUMEAU NON-LINEAIRE : meme maille equilaterale (3 voisins), ame tanh.
// Il n'est pas exact ; il APPREND un systeme chaotique et le recree.
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1,gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const o=[];for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)o.push([x,y,z]);}return o;}
const raw=lorenz(13000),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));
const Nr=300,H=150,leak=0.95,wr=0.33,win=0.4,reg=1e-7,noise=1e-3;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=[0,1,2].map(()=>{const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=win*rn();return w;});
const x=new Float64Array(Nr);
function step(u,addN){const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];let v=(1-leak)*x[i]+leak*Math.tanh(pre);if(addN)v+=noise*gauss();nx[i]=v;}x.set(nx);}
const F=2*Nr+1;const feat=()=>{const f=new Float64Array(F);for(let i=0;i<Nr;i++){f[i]=x[i];f[Nr+i]=x[i]*x[i];}f[F-1]=1;return f;};
const wash=400,trE=9000;const X=[];for(let t=0;t<trE;t++){step(S[t],true);if(t>=wash)X.push(feat());}
const A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+3));
for(let k=0;k<X.length;k++){const xt=X[k],tg=S[wash+k+1];for(let i=0;i<F;i++){const xi=xt[i];if(!xi)continue;for(let j=i;j<F;j++)A[i][j]+=xi*xt[j];for(let d=0;d<3;d++)A[i][F+d]+=xi*tg[d];}}
for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
for(let c=0;c<F;c++){let p=c;for(let r=c+1;r<F;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;const tmp=A[c];A[c]=A[p];A[p]=tmp;const dv=A[c][c]||1e-12;for(let j=c;j<F+3;j++)A[c][j]/=dv;for(let r=0;r<F;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<F+3;j++)A[r][j]-=f*A[c][j];}}
const Wo=[0,1,2].map(d=>{const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F+d];return w;});
const out=f=>[0,1,2].map(d=>{let s=0;for(let i=0;i<F;i++)s+=Wo[d][i]*f[i];return s;});
let u=out(feat());const gen=[],tru=[];for(let t=0;t<3000;t++){step(u,false);u=out(feat());gen.push(u.slice());tru.push(S[trE+t]);}
let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.3)break;valid++;}
const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
const sg=stats(gen),st=stats(tru);
console.log("JUMEAU NON-LINEAIRE (equilateral + tanh) apprend Lorenz");
console.log("horizon de prediction : "+valid+" pas = "+(valid*0.02*0.906).toFixed(2)+" temps de Lyapunov");
console.log("climatologie (forme de l'attracteur) genere x/y/z : "+sg.map(v=>v.toFixed(2)).join(" / "));
console.log("                                  vrai  x/y/z : "+st.map(v=>v.toFixed(2)).join(" / "));
console.log("attracteur "+(sg.every((v,d)=>Math.abs(v-st[d])<0.2)?"RECREE fidelement":"approche"));
