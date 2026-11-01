#!/usr/bin/env node
/* MÉTÉO v2 — Saint-Venant, schéma saute-mouton (leapfrog) + filtre Robert-Asselin,
   vents initiaux en équilibre géostrophique (vortex persistants, vraie dynamique).
   Deux atmosphères à 1 cm d'écart => mesure de la limite de prévisibilité. */
"use strict";
const NX=80,NY=80,DX=50000,DY=50000,g=9.81,Hm=10000,f=1e-4,nu=6e4,gam=0.06,dt=90;
const DAYS=12, STEPS=Math.round(DAYS*86400/dt);
const idx=(i,j)=>((i+NX)%NX)*NY+((j+NY)%NY);
const fld=()=>new Float64Array(NX*NY);
function dx_(a,i,j){return (a[idx(i+1,j)]-a[idx(i-1,j)])/(2*DX);}
function dy_(a,i,j){return (a[idx(i,j+1)]-a[idx(i,j-1)])/(2*DY);}
function lap(a,i,j){return (a[idx(i+1,j)]+a[idx(i-1,j)]+a[idx(i,j+1)]+a[idx(i,j-1)]-4*a[idx(i,j)])/(DX*DX);}
function world(pert){const h=fld(),u=fld(),v=fld();
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const x=i-NX/2,y=j-NY/2;
  h[idx(i,j)]=Hm-260*Math.exp(-((x+14)**2+(y+6)**2)/90)+200*Math.exp(-((x-16)**2+(y-9)**2)/130)-120*Math.exp(-((x-2)**2+(y+16)**2)/70);}
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){u[idx(i,j)]=-(g/f)*dy_(h,i,j);v[idx(i,j)]=(g/f)*dx_(h,i,j);} // géostrophique
 if(pert)h[idx(40,40)]+=0.01;
 return {h,u,v};}
function rhs(s,i,j){const {h,u,v}=s,c=idx(i,j),U=u[c],V=v[c];
 const du=-U*dx_(u,i,j)-V*dy_(u,i,j)-g*dx_(h,i,j)+f*V;
 const dv=-U*dx_(v,i,j)-V*dy_(v,i,j)-g*dy_(h,i,j)-f*U;
 const dh=-( (h[idx(i+1,j)]*u[idx(i+1,j)]-h[idx(i-1,j)]*u[idx(i-1,j)])/(2*DX) + (h[idx(i,j+1)]*v[idx(i,j+1)]-h[idx(i,j-1)]*v[idx(i,j-1)])/(2*DY) );
 return [du,dv,dh];}
function advance(st){ // leapfrog + Asselin, état {cur, prev}
 const {cur,prev}=st, nh=fld(),nu_=fld(),nv=fld(),first=st.first;
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const c=idx(i,j);const [du,dv,dh]=rhs(cur,i,j);
  const k=first?dt:2*dt, src=first?cur:prev;
  nu_[c]=src.u[c]+k*(du+nu*lap(src.u,i,j));
  nv[c]=src.v[c]+k*(dv+nu*lap(src.v,i,j));
  nh[c]=src.h[c]+k*(dh+nu*lap(src.h,i,j));}
 if(!first){for(let c=0;c<nh.length;c++){ // filtre Robert-Asselin
  cur.h[c]+=gam*(prev.h[c]-2*cur.h[c]+nh[c]);cur.u[c]+=gam*(prev.u[c]-2*cur.u[c]+nu_[c]);cur.v[c]+=gam*(prev.v[c]-2*cur.v[c]+nv[c]);}}
 st.prev=cur; st.cur={h:nh,u:nu_,v:nv}; st.first=false;}
function stats(s){let hmn=1e9,hmx=-1e9,wmx=0;for(let k=0;k<s.h.length;k++){if(s.h[k]<hmn)hmn=s.h[k];if(s.h[k]>hmx)hmx=s.h[k];const w=Math.hypot(s.u[k],s.v[k]);if(w>wmx)wmx=w;}return{hmn,hmx,wmx};}
function rms(a,b){let s=0;for(let k=0;k<a.h.length;k++){const d=a.h[k]-b.h[k];s+=d*d;}return Math.sqrt(s/a.h.length);}

console.log("MÉTÉO v2 — Saint-Venant leapfrog+Asselin, grille "+NX+"×"+NY+" ("+(NX*DX/1000)+" km)");
console.log("prévision "+DAYS+" j, dt="+dt+"s ("+STEPS+" pas) — 2 atmosphères, écart initial 1 cm");
console.log("--------------------------------------------------");
const A={cur:world(false),prev:null,first:true}, B={cur:world(true),prev:null,first:true};
const perDay=Math.round(86400/dt);let r0=null;
for(let s=1;s<=STEPS;s++){advance(A);advance(B);
 if(s%perDay===0){const day=s/perDay,st=stats(A.cur),r=rms(A.cur,B.cur);if(day===1)r0=r;
  console.log("J+"+String(day).padStart(2)+"  vent max="+st.wmx.toFixed(1).padStart(5)+" m/s  anomalie h∈["+(st.hmn-Hm).toFixed(0)+","+(st.hmx-Hm).toFixed(0)+"] m  |  écart A/B="+r.toExponential(2)+" m");}}
console.log("--------------------------------------------------");
console.log("Si l'écart A/B grandit (×10, ×100...), c'est le chaos météo : 1 cm devient une erreur de prévision. Sinon le modèle est trop amorti.");
