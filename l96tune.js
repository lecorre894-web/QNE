"use strict";
let seed=42>>>0;const rr=()=>{seed|=0;seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1,gauss=()=>{let s=0;for(let i=0;i<4;i++)s+=rn();return s/2;};
const Ndim=40,Fc=8,dt=0.01,LYAP=1.67;
function deriv(x){const d=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)d[i]=(x[(i+1)%Ndim]-x[(i-2+Ndim)%Ndim])*x[(i-1+Ndim)%Ndim]-x[i]+Fc;return d;}
function gen(n){let x=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)x[i]=Fc+0.01*rn();const o=[];
 for(let s=0;s<n+2000;s++){const k1=deriv(x);const a2=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)a2[i]=x[i]+dt/2*k1[i];const k2=deriv(a2);const a3=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)a3[i]=x[i]+dt/2*k2[i];const k3=deriv(a3);const a4=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)a4[i]=x[i]+dt*k3[i];const k4=deriv(a4);
  for(let i=0;i<Ndim;i++)x[i]+=dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]);if(s>=2000)o.push(Float64Array.from(x));}return o;}
const raw=gen(6000);let m=0,cnt=0;for(const p of raw)for(let i=0;i<Ndim;i++){m+=p[i];cnt++;}m/=cnt;let v=0;for(const p of raw)for(let i=0;i<Ndim;i++)v+=(p[i]-m)**2;const sdv=Math.sqrt(v/cnt);
const S=raw.map(p=>{const q=new Float64Array(Ndim);for(let i=0;i<Ndim;i++)q[i]=(p[i]-m)/sdv;return q;});
const Rw=4,IN=2*Rw+1,Nr=300,H=Nr>>1,WR=0.18,leak=0.6,reg=1e-6,noise=1e-3,wash=600,trE=4000;
const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=[];for(let d=0;d<IN;d++){const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=0.3*rn();Wi.push(w);}
const Ff=2*Nr+IN+1;                       // etat, etat^2, fenetre d'entree, biais
const feat=(st,win)=>{const f=new Float64Array(Ff);for(let i=0;i<Nr;i++){f[i]=st[i];f[Nr+i]=st[i]*st[i];}for(let d=0;d<IN;d++)f[2*Nr+d]=win[d];f[Ff-1]=1;return f;};
const upd=(st,win,addN)=>{const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre=WR*(st[nb(i,0)]+st[nb(i,1)]+st[nb(i,2)]);for(let d=0;d<IN;d++)pre+=Wi[d][i]*win[d];let val=(1-leak)*st[i]+leak*Math.tanh(pre);if(addN)val+=noise*gauss();nx[i]=val;}return nx;};
const winOf=(full,p)=>{const w=new Float64Array(IN);for(let d=0;d<IN;d++)w[d]=full[(p-Rw+d+Ndim)%Ndim];return w;};
let st=[];for(let p=0;p<Ndim;p++)st.push(new Float64Array(Nr));
const A=[];for(let i=0;i<Ff;i++)A.push(new Float64Array(Ff+1));
const tb=Date.now();
for(let t=0;t<trE;t++){const full=S[t];const ns=[];for(let p=0;p<Ndim;p++)ns.push(upd(st[p],winOf(full,p),true));
 if(t>=wash){for(let p=0;p<Ndim;p++){const f=feat(ns[p],winOf(full,p)),tg=S[t+1][p];for(let i=0;i<Ff;i++){const fi=f[i];if(!fi)continue;for(let j=i;j<Ff;j++)A[i][j]+=fi*f[j];A[i][Ff]+=fi*tg;}}}
 st=ns;}
for(let i=0;i<Ff;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
for(let c=0;c<Ff;c++){let pp=c;for(let r=c+1;r<Ff;r++)if(Math.abs(A[r][c])>Math.abs(A[pp][c]))pp=r;const tmp=A[c];A[c]=A[pp];A[pp]=tmp;const dv=A[c][c]||1e-12;for(let j=c;j<=Ff;j++)A[c][j]/=dv;for(let r=0;r<Ff;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<=Ff;j++)A[r][j]-=f*A[c][j];}}
const Wo=new Float64Array(Ff);for(let i=0;i<Ff;i++)Wo[i]=A[i][Ff];
const predC=f=>{let s=0;for(let i=0;i<Ff;i++)s+=Wo[i]*f[i];return s;};
let full=Float64Array.from(S[trE]);let valid=0;
for(let t=0;t<2500;t++){const ns=[];const nf=new Float64Array(Ndim);for(let p=0;p<Ndim;p++){const w=winOf(full,p);const s2=upd(st[p],w,false);ns.push(s2);nf[p]=predC(feat(s2,w));}st=ns;full=nf;
 let e=0;const tg=S[trE+1+t];for(let d=0;d<Ndim;d++)e+=(full[d]-tg[d])**2;if(Math.sqrt(e/Ndim)>0.4)break;valid++;}
console.log("LORENZ-96 regle (equilateral local: fuite, fenetre +-4, entree en lecture, Nr="+Nr+")");
console.log("  horizon : "+valid+" pas = "+(valid*dt*LYAP).toFixed(2)+" t_Lyap  (avant: global 0.17, local brut 0.30) | build "+((Date.now()-tb)/1000).toFixed(0)+" s");
