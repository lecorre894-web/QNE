#!/usr/bin/env node
/* MULTIPLIER le système de René : ENSEMBLE de M réservoirs équilatéraux (3 voisins),
   chacun nourri par des entrées différentes (diversité), états concaténés.
   + bruit d'entraînement (stabilise la roue libre). Épreuve : Lorenz autonome. */
"use strict";
let a=20261124>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*r()-1,gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const o=[];for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)o.push([x,y,z]);}return o;}
const raw=lorenz(12000),mu=[0,0,0],sd=[0,0,0];
for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;
for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));

const M=6, Nr=120, H=Math.floor(Nr/2), reg=1e-6, noise=2e-3;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
// M membres, chacun : ses poids d'entrée, sa fuite, son couplage (diversité, mais tous stables)
const mem=[];for(let m=0;m<M;m++){const Wi=[];for(let d=0;d<3;d++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=(0.4+0.3*r())*rn();Wi.push(w);}
 mem.push({Wi,leak:0.2+0.12*(m/M),wr:0.38+0.08*(m/(M-1)),x:new Float64Array(Nr)});}
const Ftot=M*Nr+1;
function stepAll(u,addNoise){const state=new Float64Array(Ftot);let off=0;
 for(const me of mem){const nx=new Float64Array(Nr);
  for(let i=0;i<Nr;i++){let pre=me.wr*(me.x[nb(i,0)]+me.x[nb(i,1)]+me.x[nb(i,2)]);for(let d=0;d<3;d++)pre+=me.Wi[d][i]*u[d];
   let val=(1-me.leak)*me.x[i]+me.leak*Math.tanh(pre);if(addNoise)val+=noise*gauss();nx[i]=val;}
  me.x=nx;for(let i=0;i<Nr;i++)state[off+i]=nx[i];off+=Nr;}
 state[Ftot-1]=1;return state;}

const wash=400,trainEnd=8000;const X=[];
for(let t=0;t<trainEnd;t++){const st=stepAll(S[t],true);if(t>=wash)X.push(st);}
// ridge 3 sorties
const A=[];for(let i=0;i<Ftot;i++)A.push(new Float64Array(Ftot+3));
for(let k=0;k<X.length;k++){const xt=X[k],tg=S[wash+k+1];for(let i=0;i<Ftot;i++){const xi=xt[i];for(let j=i;j<Ftot;j++)A[i][j]+=xi*xt[j];for(let d=0;d<3;d++)A[i][Ftot+d]+=xi*tg[d];}}
for(let i=0;i<Ftot;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
for(let c=0;c<Ftot;c++){let piv=c;for(let r2=c+1;r2<Ftot;r2++)if(Math.abs(A[r2][c])>Math.abs(A[piv][c]))piv=r2;const tmp=A[c];A[c]=A[piv];A[piv]=tmp;const d=A[c][c]||1e-12;for(let j=c;j<Ftot+3;j++)A[c][j]/=d;for(let r2=0;r2<Ftot;r2++)if(r2!==c){const f=A[r2][c];for(let j=c;j<Ftot+3;j++)A[r2][j]-=f*A[c][j];}}
const Wo=[0,1,2].map(d=>{const w=new Float64Array(Ftot);for(let i=0;i<Ftot;i++)w[i]=A[i][Ftot+d];return w;});
const out=st=>[0,1,2].map(d=>{let s=0;for(let i=0;i<Ftot;i++)s+=Wo[d][i]*st[i];return s;});

// roue libre
let st=stepAll(S[trainEnd-1],false),u=out(st);const gen=[],tru=[];
for(let t=0;t<3000;t++){st=stepAll(u,false);u=out(st);gen.push(u);tru.push(S[trainEnd+t]);}
let valid=0;for(let t=0;t<gen.length;t++){let e=0;for(let d=0;d<3;d++)e+=(gen[t][d]-tru[t][d])**2;if(Math.sqrt(e/3)>0.3)break;valid++;}
const lyap=(valid*0.02*0.906).toFixed(2);
const stats=arr=>{const m=[0,0,0],s=[0,0,0];for(const p of arr)for(let d=0;d<3;d++)m[d]+=p[d];for(let d=0;d<3;d++)m[d]/=arr.length;for(const p of arr)for(let d=0;d<3;d++)s[d]+=(p[d]-m[d])**2;return s.map(v=>Math.sqrt(v/arr.length));};
const sg=stats(gen),st2=stats(tru);
console.log("MULTIPLICATION — ensemble de "+M+" réservoirs équilatéraux ("+Nr+" nœuds chacun, "+(M*Nr)+" états)");
console.log("--------------------------------------------------");
console.log("temps valide (suit Lorenz) : "+valid+" pas = "+lyap+" temps de Lyapunov  (équilatéral seul: 1.9)");
console.log("climatologie (cible 1.00) — généré x/y/z: "+sg.map(v=>v.toFixed(2)).join(" / ")+"  | vrai: "+st2.map(v=>v.toFixed(2)).join(" / "));
const climOK=sg.every((v,d)=>Math.abs(v-st2[d])<0.2);
console.log("--------------------------------------------------");
console.log((+lyap>=4?"SOMMET ✓":(+lyap>=2.5?"haute altitude":"progrès"))+" — attracteur "+(climOK?"RECRÉÉ fidèlement ✓":"approché"));
