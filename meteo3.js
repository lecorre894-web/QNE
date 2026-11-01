#!/usr/bin/env node
/* MÉTÉO v3 — jet instable (barotropique) pour RÉVÉLER le chaos météo.
   Faible diffusion, jet cisaillé géostrophique + bruit identique aux deux
   atmosphères (seul 1 cm les sépare). On traque la croissance de l'écart. */
"use strict";
const NX=96,NY=96,DX=40000,DY=40000,g=9.81,Hm=10000,f=1e-4,nu=1.5e4,gam=0.08,dt=70;
const DAYS=18, STEPS=Math.round(DAYS*86400/dt);
const idx=(i,j)=>((i+NX)%NX)*NY+((j+NY)%NY);
const fld=()=>new Float64Array(NX*NY);
const dx_=(a,i,j)=>(a[idx(i+1,j)]-a[idx(i-1,j)])/(2*DX);
const dy_=(a,i,j)=>(a[idx(i,j+1)]-a[idx(i,j-1)])/(2*DY);
const lap=(a,i,j)=>(a[idx(i+1,j)]+a[idx(i-1,j)]+a[idx(i,j+1)]+a[idx(i,j-1)]-4*a[idx(i,j)])/(DX*DX);
// bruit identique partagé (seed fixe)
const noise=fld();{let a=12345>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};for(let k=0;k<noise.length;k++)noise[k]=r()-0.5;}
function world(pert){const h=fld(),u=fld(),v=fld();
 const U0=40,Ly=160000,y1=NY*DY*0.3,y2=NY*DY*0.7;        // DOUBLE jet (périodique)
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const Y=j*DY,s1=1/Math.cosh((Y-y1)/Ly),s2=1/Math.cosh((Y-y2)/Ly);
  u[idx(i,j)]=U0*(s1*s1-s2*s2);                           // jet est puis ouest
  h[idx(i,j)]=Hm-(f/g)*U0*Ly*(Math.tanh((Y-y1)/Ly)-Math.tanh((Y-y2)/Ly)); // géostrophique périodique
  v[idx(i,j)]=0.6*noise[idx(i,j)];}                       // bruit déclencheur (identique A et B)
 if(pert)h[idx(48,48)]+=0.01;                             // la seule différence : 1 cm
 return {h,u,v};}
function rhs(s,i,j){const {h,u,v}=s,c=idx(i,j),U=u[c],V=v[c];
 return [ -U*dx_(u,i,j)-V*dy_(u,i,j)-g*dx_(h,i,j)+f*V,
          -U*dx_(v,i,j)-V*dy_(v,i,j)-g*dy_(h,i,j)-f*U,
          -((h[idx(i+1,j)]*u[idx(i+1,j)]-h[idx(i-1,j)]*u[idx(i-1,j)])/(2*DX)+(h[idx(i,j+1)]*v[idx(i,j+1)]-h[idx(i,j-1)]*v[idx(i,j-1)])/(2*DY)) ];}
function advance(st){const {cur,prev,first}=st,nh=fld(),nu_=fld(),nv=fld();
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const c=idx(i,j),[du,dv,dh]=rhs(cur,i,j),k=first?dt:2*dt,src=first?cur:prev;
  nu_[c]=src.u[c]+k*(du+nu*lap(src.u,i,j));nv[c]=src.v[c]+k*(dv+nu*lap(src.v,i,j));nh[c]=src.h[c]+k*(dh+nu*lap(src.h,i,j));}
 if(!first)for(let c=0;c<nh.length;c++){cur.h[c]+=gam*(prev.h[c]-2*cur.h[c]+nh[c]);cur.u[c]+=gam*(prev.u[c]-2*cur.u[c]+nu_[c]);cur.v[c]+=gam*(prev.v[c]-2*cur.v[c]+nv[c]);}
 st.prev=cur;st.cur={h:nh,u:nu_,v:nv};st.first=false;}
const rms=(a,b)=>{let s=0;for(let k=0;k<a.h.length;k++){const d=a.h[k]-b.h[k];s+=d*d;}return Math.sqrt(s/a.h.length);};
const wmax=s=>{let w=0;for(let k=0;k<s.h.length;k++){const q=Math.hypot(s.u[k],s.v[k]);if(q>w)w=q;}return w;};

console.log("MÉTÉO v3 — jet instable, "+NX+"×"+NY+", diffusion faible, "+DAYS+" jours");
console.log("--------------------------------------------------");
const A={cur:world(false),prev:null,first:true},B={cur:world(true),prev:null,first:true};
const perDay=Math.round(86400/dt);let prev=null;
for(let s=1;s<=STEPS;s++){advance(A);advance(B);
 if(s%perDay===0){const day=s/perDay,r=rms(A.cur,B.cur);const fac=prev?(r/prev):1;prev=r;
  if(!isFinite(r)){console.log("J+"+day+" instable (NaN)");break;}
  console.log("J+"+String(day).padStart(2)+"  vent max="+wmax(A.cur).toFixed(0).padStart(3)+" m/s  écart A/B="+r.toExponential(2)+" m  (×"+fac.toFixed(2)+"/jour)");}}
console.log("--------------------------------------------------");
console.log("Écart qui grimpe = CHAOS révélé : l'erreur d'1 cm devient une erreur de prévision. Facteur >1/jour = divergence.");
