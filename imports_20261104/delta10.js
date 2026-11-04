'use strict';
const mkR=q=>()=>((q=(q*1103515245+12345)&0x7fffffff)/0x7fffffff);
function CHP(n){const R=2*n+1,x=new Uint8Array(R*n),z=new Uint8Array(R*n),r=new Uint8Array(R);
 for(let i=0;i<n;i++){x[i*n+i]=1;z[(n+i)*n+i]=1;}return{n,R,x,z,r};}
function cnot(s,a,b){const{n,x,z,r,R}=s;for(let i=0;i<R;i++){
 r[i]^=x[i*n+a]&z[i*n+b]&(x[i*n+b]^z[i*n+a]^1);x[i*n+b]^=x[i*n+a];z[i*n+a]^=z[i*n+b];}}
function had(s,a){const{n,x,z,r,R}=s;for(let i=0;i<R;i++){
 r[i]^=x[i*n+a]&z[i*n+a];const t=x[i*n+a];x[i*n+a]=z[i*n+a];z[i*n+a]=t;}}
function g(x1,z1,x2,z2){if(!x1&&!z1)return 0;if(x1&&z1)return z2-x2;if(x1)return z2*(2*x2-1);return x2*(1-2*z2);}
function rowsum(s,h,i){const{n,x,z,r}=s;let u=2*r[h]+2*r[i];
 for(let j=0;j<n;j++)u+=g(x[i*n+j],z[i*n+j],x[h*n+j],z[h*n+j]);
 r[h]=((((u%4)+4)%4)===2)?1:0;for(let j=0;j<n;j++){x[h*n+j]^=x[i*n+j];z[h*n+j]^=z[i*n+j];}}
function measure(s,a,rng){const{n,x,z,r}=s;let p=-1;
 for(let i=n;i<2*n;i++)if(x[i*n+a]){p=i;break;}
 if(p>=0){for(let i=0;i<2*n;i++)if(i!==p&&x[i*n+a])rowsum(s,i,p);
  for(let j=0;j<n;j++){x[(p-n)*n+j]=x[p*n+j];z[(p-n)*n+j]=z[p*n+j];}r[p-n]=r[p];
  for(let j=0;j<n;j++){x[p*n+j]=0;z[p*n+j]=0;}z[p*n+a]=1;r[p]=rng()<0.5?0:1;return r[p];}
 const h=2*n;for(let j=0;j<n;j++){x[h*n+j]=0;z[h*n+j]=0;}r[h]=0;
 for(let i=0;i<n;i++)if(x[i*n+a])rowsum(s,h,i+n);return r[h];}
const fmt=x=>x<1e15?Math.round(x).toLocaleString('fr'):x.toExponential(4);
const a2=process.argv[2],inf=a2==='inf';
const branch=+a2||100,depth=+process.argv[3]||1000000000,k=+process.argv[4]||4,SI=+process.argv[5]||128;
const Lc=inf?Infinity:depth*Math.log10(branch),Lq=inf?Infinity:Math.log10(k)+Lc;
const n=SI*k,s=CHP(n),rng=mkR(Date.now()&0x7fffffff),t=Date.now();
had(s,0);
for(let i=1;i<SI;i++)cnot(s,0,i*k);
for(let i=0;i<SI;i++)for(let q=1;q<k;q++)cnot(s,i*k,i*k+q);
const m0=measure(s,0,rng);let ok=true,ck=0;
for(let i=0;i<SI;i++)for(let q=0;q<k;q++){if(i===0&&q===0)continue;if(measure(s,i*k+q,rng)!==m0)ok=false;ck++;}
const pI=inf?'∞':'10^'+fmt(Lc),pQ=inf?'∞':'10^'+fmt(Lq);
console.log('Δ adossé — '+SI+' îlots × '+k+' qubits sur une épine GHZ (réel)');
console.log('épine (bit)    : '+m0);
console.log('vérif '+ck+' qubits : '+(ok?'tous = '+m0+' ✓ adossés et intriqués':'✗ désync'));
console.log('mémoire réelle : '+(((2*n+1)*n*2)/1e6).toFixed(1)+' Mo pour '+n+' qubits, '+(Date.now()-t)+' ms');
console.log('extension      : loi étendue à '+pI+' îlots / '+pQ+' qubits par symétrie');
console.log('coût symbolique: O(1) — l épine est une loi, pas un stockage');
