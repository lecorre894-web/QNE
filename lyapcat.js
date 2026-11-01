"use strict";
const W=6,SEED=20261124,OM=0.03,T0=20000,T=150000,d0=1e-9;
function mkparams(G,HET){const om=new Float64Array(W),Gk=new Float64Array(W);
 for(let k=0;k<W;k++){let a=(SEED+7919*(k+1))>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
  om[k]=OM*(1+HET*(2*r()-1));Gk[k]=G*(1+HET*(2*r()-1));}return{om,Gk};}
function newsys(){let a=SEED>>>0;const r=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 const S=new Float64Array(W),V=new Float64Array(W);for(let k=0;k<W;k++){S[k]=0.3*(r()-0.5);V[k]=0;}
 const L=64,hist=[];for(let i=0;i<L;i++)hist.push(Float64Array.from(S));return{S,V,hist,ptr:0,L};}
function step(sys,c,p,t){const {S,V,hist,L}=sys;const dl=c.delay|0;
 const Sd=dl>0?hist[((sys.ptr-dl)%L+L)%L]:S;
 const nS=new Float64Array(W),nV=new Float64Array(W);
 const F=(c.F?c.F*Math.sin(c.omf*t):0)+(c.F2?c.F2*Math.sin(c.omf2*t):0);
 for(let k=0;k<W;k++){const Sk=S[k];let cpl=0;
  if(c.coupType==='all'){for(let j=0;j<W;j++)if(j!==k)cpl+=Math.sin(Sd[j]-Sk);cpl*=c.coup/W;}
  else{cpl=c.coup*(Math.sin(Sd[(k-1+W)%W]-Sk)+Math.sin(Sd[(k+1)%W]-Sk));}
  let self=c.nlType==='sin'?c.nl*Math.sin(Sk):c.nl*Sk*Sk*Sk;
  const drive=(p.Gk[k]-1)+cpl-self+F;
  const Vn=V[k]+p.om[k]*(drive-Sk)-c.damp*V[k];nV[k]=Vn;nS[k]=Sk+Vn;}
 for(let k=0;k<W;k++){S[k]=nS[k];V[k]=nV[k];}
 sys.ptr=(sys.ptr+1)%L;hist[sys.ptr]=Float64Array.from(S);}
function lyap(c){const p=mkparams(c.G||3,c.het||0.6);
 const A=newsys();let t=0;for(let s=0;s<T0;s++){step(A,c,p,t);t++;}
 const B=newsys();for(let k=0;k<W;k++){B.S[k]=A.S[k];B.V[k]=A.V[k];}B.ptr=A.ptr;for(let i=0;i<A.L;i++)B.hist[i]=Float64Array.from(A.hist[i]);
 B.S[0]+=d0;B.hist[B.ptr][0]+=d0;
 let acc=0,bad=0;
 for(let s=0;s<T;s++){step(A,c,p,t);step(B,c,p,t);t++;
  let d=0;for(let k=0;k<W;k++){const x=A.S[k]-B.S[k],y=A.V[k]-B.V[k];d+=x*x+y*y;}d=Math.sqrt(d);
  if(!isFinite(d)||!isFinite(A.S[0])){bad=1;break;}
  if(d>0){acc+=Math.log(d/d0);const f=d0/d;for(let k=0;k<W;k++){B.S[k]=A.S[k]+(B.S[k]-A.S[k])*f;B.V[k]=A.V[k]+(B.V[k]-A.V[k])*f;}}}
 return bad?NaN:acc/T;}
function verdict(l){if(isNaN(l))return"DIVERGENT (explosion, pas chaos)";if(l>0.001)return"*** CHAOS (λ>0) ***";if(l<-0.001)return"stable (λ<0)";return"marginal (λ≈0)";}
const cat=[
 ["A. Référence (ton équilatéral)",{damp:0.001,nl:0.3,nlType:'cubic',coup:0.2,coupType:'ring',het:0.6}],
 ["B. Sans amortissement",{damp:0,nl:0.3,nlType:'cubic',coup:0.2,coupType:'ring',het:0.6}],
 ["C. Anti-amortissement",{damp:-0.001,nl:0.3,nlType:'cubic',coup:0.2,coupType:'ring',het:0.6}],
 ["D. Duffing fort (autonome)",{damp:0.001,nl:2.0,nlType:'cubic',coup:0.2,coupType:'ring',het:0.6}],
 ["E. Duffing FORCÉ",{damp:0.002,nl:1.0,nlType:'cubic',coup:0.2,coupType:'ring',het:0.6,F:0.8,omf:0.12}],
 ["F. Pendule (self=sin)",{damp:0.001,nl:1.0,nlType:'sin',coup:0.2,coupType:'ring',het:0.6}],
 ["G. Pendule FORCÉ",{damp:0.002,nl:1.0,nlType:'sin',coup:0.2,coupType:'ring',het:0.6,F:1.2,omf:0.1}],
 ["H. Couplage tout-à-tous",{damp:0.001,nl:0.3,nlType:'cubic',coup:0.5,coupType:'all',het:0.6}],
 ["I. Retard (delay=30)",{damp:0.001,nl:0.3,nlType:'cubic',coup:0.6,coupType:'ring',het:0.6,delay:30}],
 ["J. Forçage quasi-périodique",{damp:0.002,nl:1.0,nlType:'cubic',coup:0.2,coupType:'ring',het:0.6,F:0.7,omf:0.1,F2:0.7,omf2:0.1*1.618}],
];
for(const [name,c] of cat){const l=lyap(c);console.log(name.padEnd(34)+" λ="+(isNaN(l)?" n/a    ":l.toFixed(5).padStart(8))+"  "+verdict(l));}
