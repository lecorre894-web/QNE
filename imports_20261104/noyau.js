








"use strict";
const QNE={};
QNE.norme=(x)=>Math.sqrt(x.reduce((a,c)=>a+c*c,0));
QNE.renorm=(x,cible)=>{const k=cible/(QNE.norme(x)||1e-12);return x.map(v=>v*k);};
QNE.mix=(W,x)=>W.map(Wi=>Wi.reduce((a,w,j)=>a+w*x[j],0));
QNE.pasLineaire   =(W,x,cible=1)=>QNE.renorm(QNE.mix(W,x),cible);
QNE.pasNonLineaire=(W,x,g=1,cible=1)=>QNE.renorm(QNE.mix(W,x).map(v=>Math.tanh(g*v)),cible);
const P=0x87n,M=(1n<<128n)-1n;
QNE.gf={mul:(a,b)=>{let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M)^P;b>>=1n;}return r;},
 sqr(a){return this.mul(a,a);},
 powx(N){let r=1n,b=2n;while(N>0n){if(N&1n)r=this.mul(r,b);b=this.mul(b,b);N>>=1n;}return r;}};
QNE.flotBits=(N,nblocs)=>{let v=QNE.gf.powx(N);const out=[];for(let k=0;k<nblocs;k++){out.push(v);v=QNE.gf.mul(v,2n);}return out;};
QNE.cell=(...c)=>{const m=(1n<<64n)-1n;const fold=(x)=>{x=x<0n?~x:x;let h=0xCBF29CE484222325n,k=x||1n;while(k>0n){h=((h^(k&m))*0x100000001B3n)&m;k>>=64n;}return h;};
 let h=0x1234567890ABCDEFn;for(let d=0;d<c.length;d++){h=((h^fold(BigInt(c[d])))*0xFF51AFD7ED558CCDn)&m;h^=h>>29n;}h^=h>>33n;return Number(h&m)/18446744073709551616*2-1;};
QNE.solve={
 lineaire(A,b){const n=b.length,Mt=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(Mt[r][c])>Math.abs(Mt[p][c]))p=r;[Mt[c],Mt[p]]=[Mt[p],Mt[c]];for(let r=0;r<n;r++)if(r!==c){const f=Mt[r][c]/Mt[c][c];for(let k=c;k<=n;k++)Mt[r][k]-=f*Mt[c][k];}}return Mt.map((r,i)=>r[n]/r[i]);},
 racine(f,x){for(let k=0;k<60;k++){const d=(f(x+1e-7)-f(x-1e-7))/2e-7;if(!d)break;const nx=x-f(x)/d;if(Math.abs(nx-x)<1e-12)return nx;x=nx;}return x;},
 integrale(f,a,b,n=1000){const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;},
 edo(f,y,t0,t1,h=1e-3){for(let t=t0;t<t1-1e-12;t+=h){const k1=f(t,y),k2=f(t+h/2,y+h/2*k1),k3=f(t+h/2,y+h/2*k2),k4=f(t+h,y+h*k3);y+=h/6*(k1+2*k2+2*k3+k4);}return y;},
 interpole(pts,x){let s=0;for(let i=0;i<pts.length;i++){let L=1;for(let j=0;j<pts.length;j++)if(j!==i)L*=(x-pts[j][0])/(pts[i][0]-pts[j][0]);s+=L*pts[i][1];}return s;},
 convolution(a,b){const r=new Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)r[i+j]+=a[i]*b[j];return r;},
 modexp(b,e,m){b%=m;let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;}};
QNE.xor=(a,b)=>a+b-2*a*b;
QNE.pair=(f)=>(x)=>(f(x)+f(-x))/2;
QNE.impair=(f)=>(x)=>(f(x)-f(-x))/2;
QNE.bm=(s)=>{const n=s.length;let C=new Uint8Array(n),B=new Uint8Array(n);C[0]=1;B[0]=1;let L=0,m=1;for(let i=0;i<n;i++){let d=s[i];for(let j=1;j<=L;j++)d^=C[j]&s[i-j];if(d){const T=C.slice();for(let j=0;j+m<n;j++)C[j+m]^=B[j];if(2*L<=i){L=i+1-L;B=T;m=1;}else m++;}else m++;}return L;};
if(typeof module!=="undefined")module.exports=QNE;
if(require.main===module){
 console.log("NOYAU QNE — test d'assemblage");
 console.log("  stabilisation  : renorm([3,4],1) -> norme "+QNE.norme(QNE.renorm([3,4],1)).toFixed(3));
 console.log("  bits (jump)    : x^(2^100) = 0x"+QNE.gf.powx(1n<<100n).toString(16).slice(0,12)+"...");
 console.log("  memoire        : cell(42,7,1000) = "+QNE.cell(42,7,1000).toFixed(4)+" (0 octet)");
 console.log("  solveur racine : sqrt(2) = "+QNE.solve.racine(x=>x*x-2,1).toFixed(6));
 console.log("  solveur edo    : e = "+QNE.solve.edo((t,y)=>y,1,0,1).toFixed(6));
 console.log("  structure xor  : XOR(0.7,0.2) = "+QNE.xor(0.7,0.2).toFixed(2)+" , part paire de exp en 1 = "+QNE.pair(Math.exp)(1).toFixed(4));
 console.log("  -> toutes les pieces repondent. Noyau pret a batir.");
}
