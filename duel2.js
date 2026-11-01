#!/usr/bin/env node
/* REMATCH — David avec ses armes. "Adapter le calcul au système" = lecture
   quadratique [r, r^2] : coût réservoir inchangé, lecture enrichie.
   David brut vs David armé vs Goliath brut, même tâche (Mackey-Glass). */
"use strict";
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1,gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
function MG(n){const tau=17,beta=.2,gamma=.1,nn=10,dt=.1,h=Math.round(tau/dt);const ring=new Float64Array(h+1).fill(1.2);let cur=1.2,idx=0;const out=[];const tot=(n+200)*10+h;
 for(let s=0;s<tot;s++){const xt=ring[(idx-h+ring.length)%ring.length];cur+=dt*(beta*xt/(1+Math.pow(xt,nn))-gamma*cur);idx=(idx+1)%ring.length;ring[idx]=cur;if(s%10===0)out.push(cur);}return out.slice(100,100+n);}
const S=MG(4000),wash=200,trE=2800,teE=3800;
function feats(x,mode){const Nr=x.length;if(mode==="quad"){const f=new Float64Array(2*Nr+1);for(let i=0;i<Nr;i++){f[i]=x[i];f[Nr+i]=x[i]*x[i];}f[2*Nr]=1;return f;}const f=new Float64Array(Nr+1);for(let i=0;i<Nr;i++)f[i]=x[i];f[Nr]=1;return f;}
function ridge(X,y,F,reg){const A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+1));
 for(let k=0;k<X.length;k++){const xt=X[k],yt=y[k];for(let i=0;i<F;i++){const xi=xt[i];if(!xi)continue;for(let j=i;j<F;j++)A[i][j]+=xi*xt[j];A[i][F]+=xi*yt;}}
 for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
 for(let c=0;c<F;c++){let p=c;for(let r=c+1;r<F;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;const t=A[c];A[c]=A[p];A[p]=t;const d=A[c][c]||1e-12;for(let j=c;j<=F;j++)A[c][j]/=d;for(let r=0;r<F;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<=F;j++)A[r][j]-=f*A[c][j];}}
 const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F];return w;}
function evalRes(states,mode){const F=mode==="quad"?2*states[0].length+1:states[0].length+1;
 const Xtr=[],ytr=[];for(let t=wash;t<trE;t++){Xtr.push(feats(states[t],mode));ytr.push(S[t+1]);}
 const w=ridge(Xtr,ytr,F,1e-6);
 let se=0,sy=0,my=0,n=0;for(let t=trE;t<teE;t++){my+=S[t+1];n++;}my/=n;for(let t=trE;t<teE;t++)sy+=(S[t+1]-my)**2;
 for(let t=trE;t<teE;t++){const f=feats(states[t],mode);let p=0;for(let i=0;i<f.length;i++)p+=w[i]*f[i];se+=(p-S[t+1])**2;}
 return Math.sqrt(se/sy);}
function davidStates(){const Nr=100,H=50,leak=.3,wr=.42,win=.5;const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
 const Wi=new Float64Array(Nr);for(let i=0;i<Nr;i++)Wi[i]=win*rn();const x=new Float64Array(Nr);const St=[];
 for(let t=0;t<teE+1;t++){const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){const pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)])+Wi[i]*S[t];nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}x.set(nx);St.push(Float64Array.from(x));}
 return {St,ops:3*Nr};}
function goliathStates(){const Nr=1000,leak=.3,win=.5,rho=.95;const Wr=new Float64Array(Nr*Nr);for(let k=0;k<Wr.length;k++)Wr[k]=(rr()<0.1?gauss():0);
 let v=new Float64Array(Nr);for(let i=0;i<Nr;i++)v[i]=rn();let rad=1;for(let it=0;it<25;it++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++){let s=0,b=i*Nr;for(let j=0;j<Nr;j++)s+=Wr[b+j]*v[j];w[i]=s;}let nw=0;for(let i=0;i<Nr;i++)nw+=w[i]*w[i];nw=Math.sqrt(nw)||1;rad=nw;for(let i=0;i<Nr;i++)v[i]=w[i]/nw;}
 const sc=rho/rad;for(let k=0;k<Wr.length;k++)Wr[k]*=sc;const Wi=new Float64Array(Nr);for(let i=0;i<Nr;i++)Wi[i]=win*rn();const x=new Float64Array(Nr);const St=[];
 for(let t=0;t<teE+1;t++){const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre=Wi[i]*S[t],b=i*Nr;for(let j=0;j<Nr;j++)pre+=Wr[b+j]*x[j];nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}x.set(nx);St.push(Float64Array.from(x));}
 return {St,ops:Math.round(0.1*Nr*Nr)};}

const D=davidStates(),G=goliathStates();
const dBrut=evalRes(D.St,"lin"),dArme=evalRes(D.St,"quad"),gBrut=evalRes(G.St,"lin");
console.log("REMATCH — Mackey-Glass, prédiction à 1 pas");
console.log("==================================================");
console.log("David BRUT (équilatéral, lecture simple)  : NRMSE "+dBrut.toFixed(5)+"  | "+D.ops+" op/pas");
console.log("David ARMÉ (lecture quadratique)          : NRMSE "+dArme.toFixed(5)+"  | "+D.ops+" op/pas (réservoir inchangé)");
console.log("Goliath BRUT (dense 1000)                 : NRMSE "+gBrut.toFixed(5)+"  | "+G.ops+" op/pas");
console.log("--------------------------------------------------");
console.log("David armé vs Goliath : précision "+(dArme<=gBrut?"MEILLEURE ou égale":"rapport "+(dArme/gBrut).toFixed(2))+", pour "+(G.ops/D.ops).toFixed(0)+"× moins de calcul.");
console.log("Gain de l'arme sur David : ×"+(dBrut/dArme).toFixed(1)+" plus précis, coût réservoir identique.");
