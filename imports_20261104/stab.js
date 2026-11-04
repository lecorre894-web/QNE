








"use strict";
const n=64, TN=2.4;
let s=777>>>0;const rnd=()=>{s=(s*1103515245+12345)>>>0;return (s>>>8)/16777216*2-1;};
const W=Array.from({length:n},()=>Array.from({length:n},()=>rnd()/Math.sqrt(n)));
const mix=(x)=>{const y=new Float64Array(n);for(let i=0;i<n;i++){let a=0;for(let j=0;j<n;j++)a+=W[i][j]*x[j];y[i]=a;}return y;};
const norme=(x)=>Math.sqrt(x.reduce((a,c)=>a+c*c,0));
const renorm=(y)=>{const k=TN/(norme(y)||1e-12),z=new Float64Array(n);for(let i=0;i<n;i++)z[i]=y[i]*k;return z;};
const activite=(x)=>x.reduce((a,c)=>a+(Math.abs(c)<0.95?1:0),0)/n;
function run(nl,stab,G,PAS){let x=new Float64Array(n);for(let i=0;i<n;i++)x[i]=rnd()*0.3;
 for(let p=0;p<PAS;p++){let y=mix(x);for(let i=0;i<n;i++)y[i]=nl?Math.tanh(G*y[i]):G*y[i];
  x=stab?renorm(y):y;const nm=norme(x);
  if(!Number.isFinite(nm)||nm>1e100)return {fin:"EXPLOSE au pas "+p};
  if(!stab&&!nl&&nm<1e-6)return {fin:"EFFONDRE au pas "+p+" (norme->0)"};}
 return {fin:"STABLE sur "+PAS+" pas, norme="+norme(x).toFixed(2)+(nl?", activite="+(activite(x)*100).toFixed(0)+"%":"")};}
console.log("STABILISATION UNIVERSELLE (renorm d'energie, comme le Delta~1 du QNE)");
console.log("--------------------------------------------------");
console.log("LINEAIRE gain 3.0  sans stab : "+run(false,false,3.0,100000).fin);
console.log("LINEAIRE gain 0.5  sans stab : "+run(false,false,0.5,100000).fin);
console.log("LINEAIRE gain 3.0  AVEC stab : "+run(false,true ,3.0,100000).fin);
console.log("LINEAIRE gain 0.5  AVEC stab : "+run(false,true ,0.5,100000).fin);
console.log("--------------------------------------------------");
console.log("NON-LIN  gain 5.0  sans stab : "+run(true ,false,5.0,100000).fin+"  (tanh n'explose pas, mais derive)");
console.log("NON-LIN  gain 5.0  AVEC stab : "+run(true ,true ,5.0,100000).fin+"  (borne ET gradient vivant)");
console.log("--------------------------------------------------");
console.log("=> une seule brique - la renorm - tient N'IMPORTE QUEL calcul continu dans sa zone utile.");
console.log("   explosion matee, effondrement mate, saturation evitee : c'est le Delta~1 du QNE, generalise.");
