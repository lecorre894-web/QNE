








'use strict';
// QNE HARDTEST — le tir de barrage. Des centaines de cas ALEATOIRES (reproductibles),
// chacun capable de faire echouer la formule-worker. Si tout passe, l'edifice tient.
// 4 fronts : (A) formule==brute, (B) partition==global, (C) raffinement zetta, (D) primitive geometrique.
const R=require('./qne_v15/lib/reconstruct.js');
const {mul,pow,geometrical,gf128,read,hex}=R;
const g=2n, MASK=(1n<<128n)-1n;

let S=0x243f6a8885a308d313198a2e03707344n;
const rnd=()=>{S=(S*6364136223846793005n+1442695040888963407n)&MASK;return S;};
const rndRange=m=>rnd()%m;

const worker=(seed,L,W,k)=>{if(k>=L)return 0n;const c=(L-1n-k)/W+1n;return mul(mul(seed,pow(g,k)),geometrical(pow(g,W),c).s);};
const cellLE=(buf,n)=>{let v=0n;const base=Number(n*16n);for(let i=0;i<16;i++)v|=BigInt(buf[base+i])<<(8n*BigInt(i));return v;};
const bruteWorker=(buf,L,W,k)=>{let a=0n;for(let n=k;n<L;n+=W)a^=cellLE(buf,n);return a;};
const bruteGlobal=(buf,L)=>{let a=0n;for(let n=0n;n<L;n++)a^=cellLE(buf,n);return a;};

console.log('================= QNE HARDTEST =================');
const T=process.hrtime.bigint();

let okA=0;const nA=400;
for(let i=0;i<nA;i++){
 const seed=rnd(),L=1n+rndRange(512n),nb=L*16n;
 const buf=read(gf128(hex(seed),nb),0n,Number(nb));
 const W=1n+rndRange(L+5n),k=rndRange(W);
 if(worker(seed,L,W,k)===bruteWorker(buf,L,W,k))okA++;
}
console.log('A. formule == brute        : '+okA+'/'+nA+'  '+(okA===nA?'OK':'### ECHEC'));

let okB=0;const nB=80;
for(let i=0;i<nB;i++){
 const seed=rnd(),L=16n+rndRange(2000n),nb=L*16n;
 const buf=read(gf128(hex(seed),nb),0n,Number(nb));
 const gl=bruteGlobal(buf,L),W=2n+rndRange(64n);
 let acc=0n;for(let k=0n;k<W;k++)acc^=worker(seed,L,W,k);
 if(acc===gl)okB++;
}
console.log('B. partition == global     : '+okB+'/'+nB+'  '+(okB===nB?'OK':'### ECHEC'));

let okC=0;const nC=60,seedZ=BigInt('0x0123456789abcdeffedcba9876543210'),Lz=(10n**40n)/16n,Wz=10n**21n;
for(let i=0;i<nC;i++){
 const k=rndRange(Wz),parent=worker(seedZ,Lz,Wz,k);
 const e0=worker(seedZ,Lz,2n*Wz,k),e1=worker(seedZ,Lz,2n*Wz,k+Wz);
 if((e0^e1)===parent)okC++;
}
console.log('C. raffinement zetta       : '+okC+'/'+nC+'  '+(okC===nC?'OK':'### ECHEC'));

let okD=0;const nD=200;
for(let i=0;i<nD;i++){
 const w=1n+rndRange(50n),G=pow(g,w),n=rndRange(80n);
 const S1=geometrical(G,n).s;let S2=0n,gi=1n;for(let j=0n;j<n;j++){S2^=gi;gi=mul(gi,G);}
 if(S1===S2)okD++;
}
console.log('D. primitive geometrique   : '+okD+'/'+nD+'  '+(okD===nD?'OK':'### ECHEC'));

const total=okA+okB+okC+okD,attendu=nA+nB+nC+nD;
const ms=Number(process.hrtime.bigint()-T)/1e6;
console.log('-----------------------------------------------');
console.log('TOTAL : '+total+'/'+attendu+' cas aleatoires passes, en '+ms.toFixed(0)+' ms.');

const k=rndRange(Wz),t2=process.hrtime.bigint(),val=worker(seedZ,Lz,Wz,k),wus=Number(process.hrtime.bigint()-t2)/1e3;
const cpw=Lz/Wz,bruteAns=Number(cpw)/1e9/(3600*24*365.25);
console.log('');
console.log('CERTIFICAT : worker zetta #'+k);
console.log('  = '+hex(val));
console.log('  calcule en '+wus.toFixed(0)+' us ; la force brute (1 GHz) replierait ses '+cpw+' cellules en '+bruteAns.toExponential(1)+' ANNEES.');
console.log('');
console.log((total===attendu)
 ? 'VERDICT : edifice coherent de bout en bout. Le joli tient scientifiquement. Chef-d oeuvre.'
 : 'VERDICT : une fissure detectee -- a inspecter avant de pavoiser.');
console.log('===============================================');
