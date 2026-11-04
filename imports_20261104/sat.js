








"use strict";
const N=parseInt(process.argv[2],10)||1500;
const clauses=[];
for(let a=1;a<=N;a++){const a2=a*a;for(let b=a+1;b<=N;b++){const c2=a2+b*b,c=Math.round(Math.sqrt(c2));if(c<=N&&c*c===c2){clauses.push([-a,-b,-c]);clauses.push([a,b,c]);}}}
const V=N,nC=clauses.length;
const occP=Array.from({length:V+1},()=>[]),occN=Array.from({length:V+1},()=>[]);
const size=new Int32Array(nC),numT=new Int32Array(nC),numF=new Int32Array(nC);
for(let i=0;i<nC;i++){size[i]=clauses[i].length;for(const l of clauses[i])(l>0?occP[l]:occN[-l]).push(i);}
const assign=new Int8Array(V+1),trail=[];
let seed=12345>>>0;const rnd=()=>{seed=(seed*1103515245+12345)>>>0;return seed/4294967296;};
function lit(l){const v=l>0?l:-l;assign[v]=l>0?1:-1;trail.push(v);const t=l>0?occP[v]:occN[v];for(const ci of t)numT[ci]++;const f=l>0?occN[v]:occP[v];for(const ci of f)numF[ci]++;}
function prop(h){while(h<trail.length){const v=trail[h++],val=assign[v],fcl=val===1?occN[v]:occP[v];
 for(const ci of fcl){if(numT[ci]>0)continue;const un=size[ci]-numF[ci];if(un===0)return false;if(un===1){let f=0;for(const l of clauses[ci])if(assign[l>0?l:-l]===0){f=l;break;}if(f)lit(f);}}}return true;}
function undo(m){while(trail.length>m){const v=trail.pop(),val=assign[v];const t=val===1?occP[v]:occN[v];for(const ci of t)numT[ci]--;const f=val===1?occN[v]:occP[v];for(const ci of f)numF[ci]--;assign[v]=0;}}
let order,nodes,budget;
function dpll(idx){if(++nodes>budget)return 2;while(idx<order.length&&assign[order[idx]]!==0)idx++;if(idx>=order.length)return 1;
 const v=order[idx],first=rnd()<0.5?1:-1;
 for(const val of [first,-first]){const m=trail.length;lit(val>0?v:-v);if(prop(m)){const r=dpll(idx+1);if(r===1)return 1;if(r===2){undo(m);return 2;}}undo(m);}
 return 0;}
const t0=process.hrtime.bigint();let ok=false,restarts=0;
for(let R=0;R<2000;R++){restarts=R;assign.fill(0);trail.length=0;numT.fill(0);numF.fill(0);
 order=Array.from({length:V},(_,i)=>i+1);for(let i=V-1;i>0;i--){const j=(rnd()*(i+1))|0;[order[i],order[j]]=[order[j],order[i]];}
 nodes=0;budget=200000;const r=dpll(0);if(r===1){ok=true;break;}if(r===0){ok=false;break;}}
const ms=Number(process.hrtime.bigint()-t0)/1e6;
let valide=true;if(ok)for(let a=1;a<=N&&valide;a++){const a2=a*a;for(let b=a+1;b<=N;b++){const c2=a2+b*b,c=Math.round(Math.sqrt(c2));if(c<=N&&c*c===c2&&assign[a]===assign[b]&&assign[b]===assign[c]){valide=false;break;}}}
console.log("N="+N+" : var="+V+" clauses="+nC.toLocaleString("fr-FR")+" -> "+(ok?"SATISFIABLE":"non resolu/UNSAT")+" en "+ms.toFixed(0)+" ms, "+(restarts+1)+" essai(s)"+(ok?"  valide ? "+(valide?"VRAI":"FAUX"):""));
