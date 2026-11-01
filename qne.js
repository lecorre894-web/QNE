#!/usr/bin/env node
/* ============================================================
   QNE — Quantique-Neuronal Équilatéral  (émulateur / coprocesseur)
   Auteur du concept : René LE CORRE (AISA)
   Esprit Δ : trois piliers de poids égal (1/3 chacun)
     1) QUANTIQUE  : amplitude complexe (re,im), rotation de phase
     2) NEURONAL   : activation tanh couplée aux voisins
     3) SYMBOLIQUE : état à 3 valeurs {0,1,2}, règle somme mod 3
   Maillage ÉQUILATÉRAL : graphe 3-régulier (chaque nœud = 3 voisins égaux).
   Usage : node qne.js [nœuds] [pas]
   Ex.   : node qne.js 50000 400
   Sortie : score coprocesseur (mises à jour/seconde) + équilibre.
   Aucune dépendance. Simulation logicielle — PAS de quantique physique.
   ============================================================ */

"use strict";

// ---- RNG déterministe (mulberry32) : runs comparables en benchmark ----
function rng(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

// ---- Paramètres ----
const N    = Math.max(6, parseInt(process.argv[2],10) || 50000);   // nombre de nœuds
const STEPS= Math.max(1, parseInt(process.argv[3],10) || 400);     // nombre de pas
const SEED = 20261124;                                             // graine (24/11)
const r = rng(SEED);

// ---- Trois piliers, en tableaux typés (vitesse réelle) ----
const re  = new Float64Array(N), im  = new Float64Array(N);   // quantique
const nre = new Float64Array(N), nim = new Float64Array(N);
const act = new Float64Array(N), nact= new Float64Array(N);   // neuronal
const sym = new Int8Array(N),    nsym= new Int8Array(N);      // symbolique {0,1,2}

// ---- Maillage équilatéral : graphe 3-régulier (circulant) ----
// voisins de i : i-1, i+1, i+N/2  (3 liens égaux, structure symétrique)
const H = Math.floor(N/2);
function nb(i,k){ // k=0,1,2
  if(k===0) return (i+1)%N;
  if(k===1) return (i-1+N)%N;
  return (i+H)%N;
}

// ---- Initialisation : superposition + activations + symboles ----
for(let i=0;i<N;i++){
  const ph = r()*2*Math.PI, amp = 0.5+0.5*r();
  re[i]=amp*Math.cos(ph); im[i]=amp*Math.sin(ph);
  act[i]=2*r()-1;
  sym[i]=(r()*3)|0;
}

const TWO3 = 2*Math.PI/3;   // 120° — le pas de phase par symbole
const THIRD = 1/3;          // poids égal des trois piliers

// ---- Un pas ÉQUILATÉRAL (double tampon : lecture ancienne, écriture neuve) ----
function step(){
  for(let i=0;i<N;i++){
    const a=nb(i,0), b=nb(i,1), c=nb(i,2);

    // 1) SYMBOLIQUE : somme des voisins mod 3 (algèbre à 3 états)
    const s = (sym[a]+sym[b]+sym[c]) % 3;

    // 2) NEURONAL : activation couplée aux voisins (poids 1/3)
    const na = Math.tanh( THIRD*(act[a]+act[b]+act[c]) + 0.15 );

    // 3) QUANTIQUE : mélange avec voisins puis rotation de phase
    //    la phase tourne de s*120° (le symbole pilote le quantique)
    //    l'amplitude est modulée par l'activation (le neuronal pilote le quantique)
    let mr = THIRD*(re[a]+re[b]+re[c]);
    let mi = THIRD*(im[a]+im[b]+im[c]);
    mr = 0.5*re[i] + 0.5*mr;
    mi = 0.5*im[i] + 0.5*mi;
    const phi = s*TWO3*0.5;                 // rotation pilotée par le symbole
    const cs=Math.cos(phi), sn=Math.sin(phi);
    const g = 0.5*(1+na);                   // gain piloté par le neuronal
    nre[i]=g*(mr*cs - mi*sn);
    nim[i]=g*(mr*sn + mi*cs);
    nact[i]=na;
    nsym[i]=s;
  }
  // renormalisation globale du vecteur quantique (évite dérive numérique)
  let norm=0; for(let i=0;i<N;i++) norm+=nre[i]*nre[i]+nim[i]*nim[i];
  norm=Math.sqrt(norm/N)||1; const inv=1/norm;
  re.set(nre); im.set(nim); act.set(nact); sym.set(nsym);
  for(let i=0;i<N;i++){ re[i]*=inv; im[i]*=inv; }
}

// ---- Mesures d'équilibre (le système Δ cherche son point d'équilibre) ----
function equilibre(){
  let mr=0,mi=0,ma=0,s0=0,s1=0,s2=0,energy=0;
  for(let i=0;i<N;i++){
    mr+=re[i]; mi+=im[i]; ma+=act[i]; energy+=re[i]*re[i]+im[i]*im[i];
    const s=sym[i]; if(s===0)s0++; else if(s===1)s1++; else s2++;
  }
  const coherence=Math.hypot(mr/N, mi/N);                 // cohérence quantique moyenne
  const equi = 1 - (Math.abs(s0-N/3)+Math.abs(s1-N/3)+Math.abs(s2-N/3))/N; // équilibre des 3 symboles (1=parfait)
  return {coherence, activationMoyenne:ma/N, energie:energy/N, equilibreSymbolique:equi, repartition:[s0,s1,s2]};
}

// ---- Benchmark coprocesseur ----
console.log("QNE — Quantique-Neuronal Équilatéral");
console.log("nœuds="+N+"  pas="+STEPS+"  graine="+SEED+"  (3 voisins/nœud, 3 piliers)");
const e0=equilibre();
console.log("état initial : cohérence="+e0.coherence.toFixed(4)+"  équilibre symb.="+e0.equilibreSymbolique.toFixed(4));

const t0=process.hrtime.bigint();
for(let s=0;s<STEPS;s++) step();
const t1=process.hrtime.bigint();

const ms=Number(t1-t0)/1e6;
const updates=N*STEPS;                 // nœuds-mises-à-jour totales
const ups=updates/(ms/1000);           // le "score coprocesseur"
const e1=equilibre();

console.log("--------------------------------------------------");
console.log("temps           : "+ms.toFixed(1)+" ms");
console.log("mises à jour    : "+updates.toLocaleString("fr-FR"));
console.log("SCORE COPROC.   : "+Math.round(ups).toLocaleString("fr-FR")+" maj/s");
console.log("débit/nœud      : "+(ups/N).toFixed(1)+" pas/s");
console.log("cohérence finale: "+e1.coherence.toFixed(4));
console.log("équilibre symb. : "+e1.equilibreSymbolique.toFixed(4)+"  (1 = triangle parfait)");
console.log("énergie moy.    : "+e1.energie.toFixed(4));
console.log("répartition 0/1/2: "+e1.repartition.join(" / "));
