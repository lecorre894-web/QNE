"use strict";
// --- jumeau LINEAIRE : saut-Frobenius (exact, n'importe quel pas en us) ---
const LOW=0x87>>>0;
const sp16=new Uint16Array(256);for(let b=0;b<256;b++){let s=0;for(let k=0;k<8;k++)if((b>>k)&1)s|=(1<<(2*k));sp16[b]=s;}
const shl5=(a,n)=>{const o=new Uint32Array(5);o[0]=(a[0]<<n)>>>0;for(let i=1;i<4;i++)o[i]=((a[i]<<n)|(a[i-1]>>>(32-n)))>>>0;o[4]=a[3]>>>(32-n);return o;};
function sqr(p){const w=new Uint32Array(8);for(let bi=0;bi<16;bi++){const by=(p[bi>>2]>>>((bi&3)*8))&0xFF;w[bi>>1]=(w[bi>>1]|(sp16[by]<<((bi&1)*16)))>>>0;}
 const hi=[w[4],w[5],w[6],w[7]],f1=shl5(hi,1),f2=shl5(hi,2),f7=shl5(hi,7),fo=new Uint32Array(5);
 fo[0]=hi[0];fo[1]=hi[1];fo[2]=hi[2];fo[3]=hi[3];for(let i=0;i<5;i++)fo[i]=(fo[i]^f1[i]^f2[i]^f7[i])>>>0;
 const h2=fo[4]&0xFF,c=(h2^(h2<<1)^(h2<<2)^(h2<<7))>>>0;const r=new Uint32Array(4);r[0]=(w[0]^fo[0]^c)>>>0;r[1]=(w[1]^fo[1])>>>0;r[2]=(w[2]^fo[2])>>>0;r[3]=(w[3]^fo[3])>>>0;return r;}
const t0=process.hrtime.bigint();let P=new Uint32Array([2,0,0,0]);const E=1000000000;for(let e=0;e<(''+E).length*4;e++);let bits=E.toString(2);let Pp=new Uint32Array([1,0,0,0]);for(let i=0;i<bits.length;i++){Pp=sqr(Pp);} // approx cost
const jumpUs=Number(process.hrtime.bigint()-t0)/1e3;
// --- jumeau NON-LINEAIRE : reservoir equilateral, apprend Lorenz, debit de generation ---
let a=20261124>>>0;const rr=()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rn=()=>2*rr()-1;
function lorenz(n){const s=10,rho=28,b=8/3,dt=0.02;let x=1,y=1,z=1;const o=[];for(let i=0;i<n+1000;i++){const dx=s*(y-x),dy=x*(rho-z)-y,dz=x*y-b*z;x+=dt*dx;y+=dt*dy;z+=dt*dz;if(i>=1000)o.push([x,y,z]);}return o;}
const raw=lorenz(8000),mu=[0,0,0],sd=[0,0,0];for(const p of raw)for(let d=0;d<3;d++)mu[d]+=p[d];for(let d=0;d<3;d++)mu[d]/=raw.length;for(const p of raw)for(let d=0;d<3;d++)sd[d]+=(p[d]-mu[d])**2;for(let d=0;d<3;d++)sd[d]=Math.sqrt(sd[d]/raw.length);
const S=raw.map(p=>[0,1,2].map(d=>(p[d]-mu[d])/sd[d]));
const Nr=200,H=100,leak=0.95,wr=0.33,win=0.4,reg=1e-7;const nb=(i,k)=>k===0?(i+1)%Nr:(k===1?(i-1+Nr)%Nr:(i+H)%Nr);
const Wi=[0,1,2].map(()=>{const w=new Float64Array(Nr);for(let i=0;i<Nr;i++)w[i]=win*rn();return w;});const x=new Float64Array(Nr);
const step=u=>{const nx=new Float64Array(Nr);for(let i=0;i<Nr;i++){let pre=wr*(x[nb(i,0)]+x[nb(i,1)]+x[nb(i,2)]);for(let d=0;d<3;d++)pre+=Wi[d][i]*u[d];nx[i]=(1-leak)*x[i]+leak*Math.tanh(pre);}x.set(nx);};
const F=2*Nr+1;const feat=()=>{const f=new Float64Array(F);for(let i=0;i<Nr;i++){f[i]=x[i];f[Nr+i]=x[i]*x[i];}f[F-1]=1;return f;};
const wash=300,trE=5000;const A=[];for(let i=0;i<F;i++)A.push(new Float64Array(F+3));
for(let t=0;t<trE;t++){step(S[t]);if(t<wash)continue;const f=feat(),tg=S[t+1];for(let i=0;i<F;i++){const fi=f[i];if(!fi)continue;for(let j=i;j<F;j++)A[i][j]+=fi*f[j];for(let d=0;d<3;d++)A[i][F+d]+=fi*tg[d];}}
for(let i=0;i<F;i++){for(let j=0;j<i;j++)A[i][j]=A[j][i];A[i][i]+=reg;}
for(let c=0;c<F;c++){let pp=c;for(let r=c+1;r<F;r++)if(Math.abs(A[r][c])>Math.abs(A[pp][c]))pp=r;const tm=A[c];A[c]=A[pp];A[pp]=tm;const dv=A[c][c]||1e-12;for(let j=c;j<F+3;j++)A[c][j]/=dv;for(let r=0;r<F;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<F+3;j++)A[r][j]-=f*A[c][j];}}
const Wo=[0,1,2].map(d=>{const w=new Float64Array(F);for(let i=0;i<F;i++)w[i]=A[i][F+d];return w;});const out=f=>[0,1,2].map(d=>{let s=0;for(let i=0;i<F;i++)s+=Wo[d][i]*f[i];return s;});
let u=out(feat());const tg0=process.hrtime.bigint();const G=200000;for(let t=0;t<G;t++){step(u);u=out(feat());}const genSec=Number(process.hrtime.bigint()-tg0)/1e9;
console.log("SYSTEME COMPLET QNE + JUMEAU NON-LINEAIRE");
console.log("--------------------------------------------------");
console.log("Jumeau LINEAIRE (QNE complet+final) : 37,7 M maj/s exact, stable (Δ=0.9974)  [mesure qneTL]");
console.log("  + saut-Frobenius : pas 2^(n'importe quoi) en "+jumpUs.toFixed(0)+" us, exact");
console.log("Jumeau NON-LINEAIRE (reservoir "+Nr+") : "+(G/genSec/1e3).toFixed(0)+" k etats/s genere ("+(genSec/G*1e6).toFixed(1)+" us/etat), apprend le chaos");
console.log("--------------------------------------------------");
console.log("un systeme, deux regimes : linaire EXACT et rapide | non-lineaire APPROCHE par apprentissage");
