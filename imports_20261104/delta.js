'use strict';
const R=(s=>()=>((s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff))(Date.now()&0x7fffffff);
const S=1/Math.SQRT2;
const H=[[S,0],[S,0],[S,0],[-S,0]], X=[[0,0],[1,0],[1,0],[0,0]], Z=[[1,0],[0,0],[0,0],[-1,0]];
const pc=x=>{let c=0;while(x){c+=x&1;x>>>=1;}return c;};
function island(n){const N=1<<n;const is={n,N,re:new Float64Array(N),im:new Float64Array(N),mu:1};is.re[0]=1;return is;}
function g1(is,t,m){const{re,im,N}=is,b=1<<t;for(let i=0;i<N;i++){if(i&b)continue;const j=i|b;
 const ar=re[i],ai=im[i],br=re[j],bi=im[j];
 re[i]=(m[0][0]*ar-m[0][1]*ai)+(m[1][0]*br-m[1][1]*bi);im[i]=(m[0][0]*ai+m[0][1]*ar)+(m[1][0]*bi+m[1][1]*br);
 re[j]=(m[2][0]*ar-m[2][1]*ai)+(m[3][0]*br-m[3][1]*bi);im[j]=(m[2][0]*ai+m[2][1]*ar)+(m[3][0]*bi+m[3][1]*br);}}
function cnot(is,c,t){const{re,im,N}=is,bc=1<<c,bt=1<<t;for(let i=0;i<N;i++){if((i&bc)&&!(i&bt)){const j=i|bt;
 const r=re[i],m=im[i];re[i]=re[j];im[i]=im[j];re[j]=r;im[j]=m;}}}
function ry(is,t,th){const c=Math.cos(th/2),s=Math.sin(th/2);g1(is,t,[[c,0],[-s,0],[s,0],[c,0]]);}
function measure(is){const{re,im,N}=is;let r=R(),a=0,p=0;for(let i=0;i<N;i++){a+=re[i]*re[i]+im[i]*im[i];p=i;if(r<=a)break;}
 is.re.fill(0);is.im.fill(0);is.re[p]=1;return p;}
function delta(q=64,isl=8){const n=Math.ceil(q/isl),I=[];for(let k=0;k<n;k++){const is=island(Math.min(isl,q-k*isl));is.mu=+(0.8+0.4*R()).toFixed(2);I.push(is);}return{q,I,d:[]};}
function link(D,a,b,pct){D.d.push({a,b,pct});}
function readout(D){const r=Array(D.I.length).fill(null);for(let i=0;i<D.I.length;i++){
 for(const e of D.d)if(e.b===i&&r[e.a]!=null)ry(D.I[i],0,e.pct*Math.PI*((pc(r[e.a])&1)?1:-1));
 r[i]=measure(D.I[i]);}return r;}
const D=delta(64,8);
D.I.forEach(is=>{g1(is,0,H);if(is.n>1)cnot(is,0,1);});
for(let i=0;i<D.I.length-1;i++)link(D,i,i+1,+(0.15+0.1*R()).toFixed(3));
const r=readout(D);let sig=0;r.forEach((p,i)=>sig+=pc(p)*D.I[i].mu);
console.log('Δ-QI-V V0.1 — '+D.I.length+' îlots / '+D.q+' qubits logiques');
console.log('μj      :',D.I.map(x=>x.mu).join(' '));
console.log('readout :',r.join(' '));
console.log('Δ-sign  :',sig.toFixed(4));
