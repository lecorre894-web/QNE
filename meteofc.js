#!/usr/bin/env node
/* Peut-on prévoir 1-2 MOIS ? Test de compétence (skill).
   VÉRITÉ = atmosphère chaotique (jet instable). PRÉVISION = même modèle,
   état initial connu avec une erreur minuscule (1 cm, ultra-optimiste).
   On mesure la corrélation prévision/vérité sur 60 jours.
   corr>0.6 = prévision utile ; corr~0 = aucune valeur. */
"use strict";
const NX=96,NY=96,DX=40000,DY=40000,g=9.81,Hm=10000,f=1e-4,nu=1.5e4,gam=0.08,dt=70;
const DAYS=60, STEPS=Math.round(DAYS*86400/dt);
const idx=(i,j)=>((i+NX)%NX)*NY+((j+NY)%NY);
const fld=()=>new Float64Array(NX*NY);
const dx_=(a,i,j)=>(a[idx(i+1,j)]-a[idx(i-1,j)])/(2*DX);
const dy_=(a,i,j)=>(a[idx(i,j+1)]-a[idx(i,j-1)])/(2*DY);
const lap=(a,i,j)=>(a[idx(i+1,j)]+a[idx(i-1,j)]+a[idx(i,j+1)]+a[idx(i,j-1)]-4*a[idx(i,j)])/(DX*DX);
const noise=fld();{let a=12345>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};for(let k=0;k<noise.length;k++)noise[k]=r()-0.5;}
function world(pert){const h=fld(),u=fld(),v=fld();const U0=40,Ly=160000,y1=NY*DY*0.3,y2=NY*DY*0.7;
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const Y=j*DY,s1=1/Math.cosh((Y-y1)/Ly),s2=1/Math.cosh((Y-y2)/Ly);
  u[idx(i,j)]=U0*(s1*s1-s2*s2);h[idx(i,j)]=Hm-(f/g)*U0*Ly*(Math.tanh((Y-y1)/Ly)-Math.tanh((Y-y2)/Ly));v[idx(i,j)]=0.6*noise[idx(i,j)];}
 if(pert)h[idx(48,48)]+=0.01;  // erreur initiale : 1 cm seulement (ultra-optimiste pour le "prévisionniste")
 return {h,u,v};}
function rhs(s,i,j){const {h,u,v}=s,c=idx(i,j),U=u[c],V=v[c];
 return [ -U*dx_(u,i,j)-V*dy_(u,i,j)-g*dx_(h,i,j)+f*V, -U*dx_(v,i,j)-V*dy_(v,i,j)-g*dy_(h,i,j)-f*U,
  -((h[idx(i+1,j)]*u[idx(i+1,j)]-h[idx(i-1,j)]*u[idx(i-1,j)])/(2*DX)+(h[idx(i,j+1)]*v[idx(i,j+1)]-h[idx(i,j-1)]*v[idx(i,j-1)])/(2*DY)) ];}
function advance(st){const {cur,prev,first}=st,nh=fld(),nu_=fld(),nv=fld();
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const c=idx(i,j),[du,dv,dh]=rhs(cur,i,j),k=first?dt:2*dt,src=first?cur:prev;
  nu_[c]=src.u[c]+k*(du+nu*lap(src.u,i,j));nv[c]=src.v[c]+k*(dv+nu*lap(src.v,i,j));nh[c]=src.h[c]+k*(dh+nu*lap(src.h,i,j));}
 if(!first)for(let c=0;c<nh.length;c++){cur.h[c]+=gam*(prev.h[c]-2*cur.h[c]+nh[c]);cur.u[c]+=gam*(prev.u[c]-2*cur.u[c]+nu_[c]);cur.v[c]+=gam*(prev.v[c]-2*cur.v[c]+nv[c]);}
 st.prev=cur;st.cur={h:nh,u:nu_,v:nv};st.first=false;}
function corr(a,b){let ma=0,mb=0;for(let k=0;k<a.h.length;k++){ma+=a.h[k];mb+=b.h[k];}ma/=a.h.length;mb/=b.h.length;
 let sab=0,sa=0,sb=0;for(let k=0;k<a.h.length;k++){const da=a.h[k]-ma,db=b.h[k]-mb;sab+=da*db;sa+=da*da;sb+=db*db;}return sab/Math.sqrt(sa*sb);}

console.log("TEST DE PRÉVISIBILITÉ — vérité chaotique vs prévision (erreur initiale 1 cm), "+DAYS+" jours");
console.log("--------------------------------------------------");
const TR={cur:world(false),prev:null,first:true}, FC={cur:world(true),prev:null,first:true};
const perDay=Math.round(86400/dt);let horizon=null;
for(let s=1;s<=STEPS;s++){advance(TR);advance(FC);
 if(s%(perDay*3)===0){const day=s/perDay,c=corr(TR.cur,FC.cur);
  if(horizon===null&&c<0.6)horizon=day;
  const tag=c>0.8?"excellente":(c>0.6?"utile":(c>0.3?"faible":"NULLE"));
  console.log("J+"+String(day).padStart(2)+"  corrélation prévision/vérité = "+c.toFixed(3)+"  ("+tag+")");}}
console.log("--------------------------------------------------");
console.log("Horizon de prévision utile (corr<0.6) : ~J+"+(horizon||">60")+"  — au-delà, la prévision ne vaut rien.");
