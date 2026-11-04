








"use strict";
let H=0;const bump=(v)=>{H=(Math.imul(H^(v|0),2654435761))>>>0;};
const hex=()=>("00000000"+H.toString(16)).slice(-8);
const now=()=>process.hrtime.bigint();
function stress(nom,taille,ops,fn){H=0;const t=now();fn();const ms=Number(now()-t)/1e6;const bits=ops*64;
 console.log(nom.padEnd(13)+" | taille "+String(taille).padStart(10)+" | "+ms.toFixed(0).padStart(6)+" ms | bits "+(bits/1e6).toFixed(0).padStart(7)+" M | "+(bits/1e6/(ms/1e3)).toFixed(0).padStart(6)+" Mbit/s | emp "+hex());}
function lineaire(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];for(let r=0;r<n;r++)if(r!==c){const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k];}}return M.map((r,i)=>r[n]/r[i]);}
const integrale=(f,a,b,n)=>{const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;};
const edo=(f,y,t0,t1,h)=>{for(let t=t0;t<t1-1e-12;t+=h){const k1=f(t,y),k2=f(t+h/2,y+h/2*k1),k3=f(t+h/2,y+h/2*k2),k4=f(t+h,y+h*k3);y+=h/6*(k1+2*k2+2*k3+k4);}return y;};
const modexp=(b,e,m)=>{b%=m;let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;};
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
 for(let len=2;len<=n;len<<=1){const ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang);for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<len/2;k++){const ur=re[i+k],ui=im[i+k],vr=re[i+k+len/2]*cr-im[i+k+len/2]*ci,vi=re[i+k+len/2]*ci+im[i+k+len/2]*cr;re[i+k]=ur+vr;im[i+k]=ui+vi;re[i+k+len/2]=ur-vr;im[i+k+len/2]=ui-vi;const ncr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=ncr;}}}}
function eigen(A,it){const n=A.length;let v=new Float64Array(n).fill(1),lam=0;for(let k=0;k<it;k++){const w=new Float64Array(n);for(let i=0;i<n;i++){let s=0;for(let j=0;j<n;j++)s+=A[i][j]*v[j];w[i]=s;}let nr=Math.hypot(...w);lam=nr;for(let i=0;i<n;i++)v[i]=w[i]/nr;}return lam;}
function rho(N){let x=2n,y=2n,d=1n;const f=(a)=>(a*a+1n)%N;const abs=(a)=>a<0n?-a:a;const g=(a,b)=>{while(b){[a,b]=[b,a%b];}return a;};while(d===1n){x=f(x);y=f(f(y));d=g(abs(x-y),N);}return d;}
function matmul(A,B){const n=A.length,C=Array.from({length:n},()=>new Float64Array(n));for(let i=0;i<n;i++)for(let k=0;k<n;k++){const a=A[i][k];for(let j=0;j<n;j++)C[i][j]+=a*B[k][j];}return C;}
console.log("============ STRESS TEST DE LA GRANDE SUITE ============");
let s=1>>>0;const rnd=()=>{s=(s*1103515245+12345)>>>0;return (s>>>8)/16777216;};
{const n=220,A=Array.from({length:n},()=>Array.from({length:n},()=>rnd()*2-1)),b=Array.from({length:n},()=>rnd());stress("1 LINEAIRE",n+"x"+n,n*n*n/3,()=>{const x=lineaire(A,b);for(const v of x)bump(v*1e6);});}
stress("2 INTEGRALE","1e7 pts",1e7,()=>{bump(integrale(x=>Math.sin(x)*Math.exp(-x*0.1),0,50,1e7)*1e6);});
stress("3 EDO","1e6 pas",1e6*4,()=>{bump(edo((t,y)=>Math.cos(t)-0.1*y,0,0,1000,1e-3)*1e6);});
stress("4 MODEXP","1000x2048b",1000*2048,()=>{for(let k=0;k<1000;k++)bump(Number(modexp(3n+BigInt(k),(1n<<256n)+BigInt(k),(1n<<2048n)-189n)&0xffffffffn));});
{const n=1<<18,re=new Float64Array(n),im=new Float64Array(n);for(let i=0;i<n;i++)re[i]=rnd()-0.5;stress("5 FFT","2^18="+n,n*18,()=>{fft(re,im);for(let i=0;i<8;i++)bump(re[i]*1e6);});}
{const n=250,A=Array.from({length:n},()=>Array.from({length:n},()=>rnd()*2-1));stress("6 VAL.PROPRE",n+"x"+n,n*n*400,()=>{bump(eigen(A,400)*1e4);});}
{const p=1000003n,q=1000033n,N=p*q;stress("7 FACTO rho","~40 bits",50000,()=>{bump(Number(rho(N)&0xffffffffn));});}
{const a=Array.from({length:2e6},()=>rnd());stress("8 TRI","2e6",2e6*21,()=>{a.sort((x,y)=>x-y);bump(a[1000]*1e6);});}
{const n=220,A=Array.from({length:n},()=>Array.from({length:n},()=>rnd())),B=Array.from({length:n},()=>Array.from({length:n},()=>rnd()));stress("9 MATMUL",n+"x"+n,n*n*n,()=>{const C=matmul(A,B);for(let i=0;i<n;i++)bump(C[i][i]*1e3);});}
console.log("=======================================================");
console.log("chaque solveur pousse a grande taille : bits generes et empreinte visibles.");
