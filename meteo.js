#!/usr/bin/env node
/* MÉTÉO — vrai modèle atmosphérique (équations de Saint-Venant / shallow water),
   le squelette des modèles de prévision. Grille 2D, Coriolis, gravité, advection.
   On fait évoluer un système de pression, puis on mesure la LIMITE de prévisibilité :
   deux atmosphères quasi identiques (écart 1 cm) divergent-elles ? (chaos météo) */
"use strict";
const NX=80,NY=80,DX=50000,DY=50000,g=9.81,Hm=10000,f=1e-4,nu=8e3,dt=90;
const DAYS=9, STEPS=Math.round(DAYS*86400/dt);
const idx=(i,j)=>((i+NX)%NX)*NY+((j+NY)%NY);
function field(){return new Float64Array(NX*NY);}
function initWorld(pert){const h=field(),u=field(),v=field();
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){
  const x=i-NX/2,y=j-NY/2;
  // dépression + anticyclone (deux systèmes de pression)
  let hh=Hm-250*Math.exp(-((x+15)**2+(y+6)**2)/120)+180*Math.exp(-((x-18)**2+(y-10)**2)/160);
  h[idx(i,j)]=hh;}
 if(pert)h[idx(40,40)]+=0.01;  // perturbation d'1 cm : la "deuxième atmosphère"
 return {h,u,v};}
function lap(a,i,j){return (a[idx(i+1,j)]+a[idx(i-1,j)]+a[idx(i,j+1)]+a[idx(i,j-1)]-4*a[idx(i,j)]);}
function step(s){const {h,u,v}=s;const nh=field(),nu_=field(),nv=field();
 for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const c=idx(i,j);
  // moyennes de voisins (Lax-Friedrichs : stabilise l'advection)
  const hb=0.25*(h[idx(i+1,j)]+h[idx(i-1,j)]+h[idx(i,j+1)]+h[idx(i,j-1)]);
  const ub=0.25*(u[idx(i+1,j)]+u[idx(i-1,j)]+u[idx(i,j+1)]+u[idx(i,j-1)]);
  const vb=0.25*(v[idx(i+1,j)]+v[idx(i-1,j)]+v[idx(i,j+1)]+v[idx(i,j-1)]);
  const dhdx=(h[idx(i+1,j)]-h[idx(i-1,j)])/(2*DX), dhdy=(h[idx(i,j+1)]-h[idx(i,j-1)])/(2*DY);
  const dudx=(u[idx(i+1,j)]-u[idx(i-1,j)])/(2*DX), dudy=(u[idx(i,j+1)]-u[idx(i,j-1)])/(2*DY);
  const dvdx=(v[idx(i+1,j)]-v[idx(i-1,j)])/(2*DX), dvdy=(v[idx(i,j+1)]-v[idx(i,j-1)])/(2*DY);
  const dhudx=(h[idx(i+1,j)]*u[idx(i+1,j)]-h[idx(i-1,j)]*u[idx(i-1,j)])/(2*DX);
  const dhvdy=(h[idx(i,j+1)]*v[idx(i,j+1)]-h[idx(i,j-1)]*v[idx(i,j-1)])/(2*DY);
  nu_[c]=ub+dt*(-ub*dudx-vb*dudy - g*dhdx + f*vb);
  nv[c]=vb+dt*(-ub*dvdx-vb*dvdy - g*dhdy - f*ub);
  nh[c]=hb+dt*(-(dhudx+dhvdy));
 }
 h.set(nh);u.set(nu_);v.set(nv);}
function stats(s){const {h,u,v}=s;let hmin=1e9,hmax=-1e9,wmax=0;
 for(let k=0;k<h.length;k++){if(h[k]<hmin)hmin=h[k];if(h[k]>hmax)hmax=h[k];const w=Math.hypot(u[k],v[k]);if(w>wmax)wmax=w;}
 return {hmin,hmax,wmax};}
function rms(a,b){let s=0;for(let k=0;k<a.h.length;k++){const d=a.h[k]-b.h[k];s+=d*d;}return Math.sqrt(s/a.h.length);}

console.log("MÉTÉO — modèle Saint-Venant (shallow water), grille "+NX+"×"+NY+" ("+(NX*DX/1000)+"×"+(NY*DY/1000)+" km)");
console.log("prévision sur "+DAYS+" jours, pas de "+dt+" s  ("+STEPS+" pas) — 2 atmosphères (écart initial 1 cm)");
console.log("--------------------------------------------------");
const A=initWorld(false), B=initWorld(true);
const perDay=Math.round(86400/dt);
const t0=process.hrtime.bigint();
for(let s=1;s<=STEPS;s++){step(A);step(B);
 if(s%perDay===0){const day=s/perDay,st=stats(A),r=rms(A,B);
  console.log("J+"+day+"  vent max="+st.wmax.toFixed(1)+" m/s  h∈["+(st.hmin-Hm).toFixed(0)+","+(st.hmax-Hm).toFixed(0)+"] m  |  écart A/B = "+r.toExponential(2)+" m");}}
const el=Number(process.hrtime.bigint()-t0)/1e9;
console.log("--------------------------------------------------");
console.log("calcul réel : "+el.toFixed(1)+" s pour "+DAYS+" jours de prévision simulés");
console.log("La colonne écart A/B montre comment une erreur d'1 cm enfle : c'est la limite de prévisibilité (chaos météo).");
