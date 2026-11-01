#!/usr/bin/env node
/* DUEL D'EFFICACITÉ — même tâche (Mackey-Glass), même protocole.
   DAVID  = équilatéral de René (petit, 3 voisins/nœud).
   GOLIATH= réservoir dense (gros, tous-à-tous). On mesure précision ET coût. */
"use strict";
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1,gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
function MG(n){const tau=17,beta=.2,gamma=.1,nn=10,dt=.1,h=Math.round(tau/dt);const ring=new Float64Array(h+1).fill(1.2);let cur=1.2,idx=0;const out=[];const tot=(n+200)*10+h;
 for(let s=0;s<tot;s++){const xt=ring[(idx-h+ring.length)%ring.length];cur+=dt*(beta*xt/(1+Math.pow(xt,nn))-gamma*cur);idx=(idx+1)%ring.length;ring[idx]=cur;if(s%10===0)out.push(cur);}return out.slice(100,100+n);}
const S=MG(4000),wash=200,trE=2800,teE=3800;

function ridge(X,y,F,reg){const A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+1));
 for(let k=0;k<X.length;k++){const xt=X[k],yt=y[k];for(let i=0;i<F;i++){const xi=xt[i];if(!xi)continue;for(let j=i;j<F;j++)A[i][j]+=xi*xt[j];A[i][F]+=xi*yt;}}
 for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
 for(let c=0;c<F;c++){let p=c;for(let r=c+1;r<F;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;const t=A[c];A[c]=A[p];A[p]=t;const d=A[c][c]||1e-12;for(let j=c;j<=F;j++)A[c][j]/=d;for(let r=0;r<F;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<=F;j++)A[r][j]-=f*A[c][j];}}
 const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F];return w;}

function nrmse(w,states){let se=0,sy=0,my=0,n=0;for(let t=trE;t<teE;t++){my+=S[t+1];n++;}my/=n;
 for(let t=trE;t<teE;t++)sy+=(S[t+1]-my)**2;
 for(let t=trE;t<teE;t++){const xt=states[t];let p=0;for(let i=0;i<xt.length;i++)p+=w[i]*xt[i];se+=(p-S[t+1])**2;}
 return Math.sqrt(se/sy);}

// ---- DAVID : équilatéral Nr=100 ----
function david(){const Nr=100,H=50,leak=.3,wr=.42,win=.5;const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
 const Wi=new Float64Array(Nr);for(let i=0;i<Nr;i++)Wi[i]=win*rn();const x=new Float64Array(Nr);const St=[];
 const t0=process.hrtime.bigint();
 for(let t=0;t<teE+1;t++){const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){const pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)])+Wi[i]*S[t];nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}x.set(nx);St.push([...x,1]);}
 const ms=Number(process.hrtime.bigint()-t0)/1e6;
 const Xtr=[],ytr=[];for(let t=wash;t<trE;t++){Xtr.push(St[t]);ytr.push(S[t+1]);}
 const w=ridge(Xtr,ytr,Nr+1,1e-6);
 return {name:"DAVID (équilatéral)",Nr,ops:3*Nr,ms,nrmse:nrmse(w,St)};}

// ---- GOLIATH : dense Nr=1000 ----
function goliath(){const Nr=1000,leak=.3,win=.5,rho=.95;const Wr=new Float64Array(Nr*Nr);for(let k=0;k<Wr.length;k++)Wr[k]=gauss()*(rr()<0.1?1:0); // 10% dense
 let v=new Float64Array(Nr);for(let i=0;i<Nr;i++)v[i]=rn();let rad=1;for(let it=0;it<25;it++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++){let s=0,b=i*Nr;for(let j=0;j<Nr;j++)s+=Wr[b+j]*v[j];w[i]=s;}let nw=0;for(let i=0;i<Nr;i++)nw+=w[i]*w[i];nw=Math.sqrt(nw)||1;rad=nw;for(let i=0;i<Nr;i++)v[i]=w[i]/nw;}
 const sc=rho/rad;for(let k=0;k<Wr.length;k++)Wr[k]*=sc;
 const Wi=new Float64Array(Nr);for(let i=0;i<Nr;i++)Wi[i]=win*rn();const x=new Float64Array(Nr);const St=[];
 const t0=process.hrtime.bigint();
 for(let t=0;t<teE+1;t++){const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre=Wi[i]*S[t],b=i*Nr;for(let j=0;j<Nr;j++)pre+=Wr[b+j]*x[j];nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}x.set(nx);St.push([...x,1]);}
 const ms=Number(process.hrtime.bigint()-t0)/1e6;
 const Xtr=[],ytr=[];for(let t=wash;t<trE;t++){Xtr.push(St[t]);ytr.push(S[t+1]);}
 const w=ridge(Xtr,ytr,Nr+1,1e-6);
 return {name:"GOLIATH (dense 10%)",Nr,ops:Math.round(0.1*Nr*Nr),ms,nrmse:nrmse(w,St)};}

const D=david(),G=goliath();
console.log("DUEL D'EFFICACITÉ — Mackey-Glass, prédiction à 1 pas");
console.log("==================================================");
for(const R of [D,G]){console.log(R.name+" — "+R.Nr+" nœuds");console.log("  précision NRMSE : "+R.nrmse.toFixed(5)+(R.nrmse<0.1?" (excellent)":""));console.log("  coût : "+R.ops.toLocaleString("fr-FR")+" opérations/pas de réservoir");console.log("  temps réservoir : "+R.ms.toFixed(0)+" ms");console.log("");}
console.log("--------------------------------------------------");
console.log("Goliath est "+(G.ops/D.ops).toFixed(0)+"× plus coûteux par pas que David.");
console.log("Précision : David "+D.nrmse.toFixed(4)+" vs Goliath "+G.nrmse.toFixed(4)+"  (rapport "+(D.nrmse/G.nrmse).toFixed(2)+")");
const effD=(1/D.nrmse)/D.ops, effG=(1/G.nrmse)/G.ops;
console.log("EFFICACITÉ (précision par opération) : David "+(effD/effG).toFixed(0)+"× plus efficace que Goliath.");
