'use strict';
const fs = require('fs');
const http = require('http');

// ----- Fonctions d'origine dqiv.js -----
const S=1/Math.SQRT2, H=[[S,0],[S,0],[S,0],[-S,0]];
const pc=x=>{let c=0;while(x){c+=x&1;x>>>=1;}return c;};
const mkR=q=>()=>((q=(q*1103515245+12345)&0x7fffffff)/0x7fffffff);
const fmt=x=>x<1e15?Math.round(x).toLocaleString('fr'):x.toExponential(4);
const e10=L=>{const e=Math.floor(L),m=Math.pow(10,L-e);return m.toFixed(4)+'e+'+fmt(e);};
function jlog(line){fs.appendFileSync('dqiv.log','['+new Date().toISOString()+'] '+line+'\n');}

function island(n){const N=1<<n;return{n,N,re:new Float64Array(N),im:new Float64Array(N)};}
function gate1(is,t,m){const{re,im,N}=is,b=1<<t;for(let i=0;i<N;i++){if(i&b)continue;const j=i|b;const ar=re[i],ai=im[i],br=re[j],bi=im[j];re[i]=(m[0][0]*ar-m[0][1]*ai)+(m[1][0]*br-m[1][1]*bi);im[i]=(m[0][0]*ai+m[0][1]*ar)+(m[1][0]*bi+m[1][1]*br);re[j]=(m[2][0]*ar-m[2][1]*ai)+(m[3][0]*br-m[3][1]*bi);im[j]=(m[2][0]*ai+m[2][1]*ar)+(m[3][0]*bi+m[3][1]*br);}}
function cnot(is,c,t){const{re,im,N}=is,bc=1<<c,bt=1<<t;for(let i=0;i<N;i++){if((i&bc)&&!(i&bt)){const j=i|bt;const r=re[i],m=im[i];re[i]=re[j];im[i]=im[j];re[j]=r;im[j]=m;}}}
function measure(is,rng){const{re,im,N}=is;let r=rng(),a=0,p=0;for(let i=0;i<N;i++){a+=re[i]*re[i]+im[i]*im[i];p=i;if(r<=a)break;}return p;}
function tick(is,rng){is.re.fill(0);is.im.fill(0);is.re[0]=1;gate1(is,0,H);if(is.n>1)cnot(is,0,1);return measure(is,rng);}

function chpNew(n){const R=2*n+1,x=new Uint8Array(R*n),z=new Uint8Array(R*n),r=new Uint8Array(R);for(let i=0;i<n;i++){x[i*n+i]=1;z[(n+i)*n+i]=1;}return{n,R,x,z,r};}
function chpCX(s,a,b){const{n,x,z,r,R}=s;for(let i=0;i<R;i++){r[i]^=x[i*n+a]&z[i*n+b]&(x[i*n+b]^z[i*n+a]^1);x[i*n+b]^=x[i*n+a];z[i*n+a]^=z[i*n+b];}}
function chpH(s,a){const{n,x,z,r,R}=s;for(let i=0;i<R;i++){r[i]^=x[i*n+a]&z[i*n+a];const t=x[i*n+a];x[i*n+a]=z[i*n+a];z[i*n+a]=t;}}
function chpG(x1,z1,x2,z2){if(!x1&&!z1)return 0;if(x1&&z1)return z2-x2;if(x1)return z2*(2*x2-1);return x2*(1-2*z2);}
function chpSum(s,h,i){const{n,x,z,r}=s;let u=2*r[h]+2*r[i];for(let j=0;j<n;j++)u+=chpG(x[i*n+j],z[i*n+j],x[h*n+j],z[h*n+j]);r[h]=((((u%4)+4)%4)===2)?1:0;for(let j=0;j<n;j++){x[h*n+j]^=x[i*n+j];z[h*n+j]^=z[i*n+j];}}
function chpM(s,a,rng){const{n,x,z,r,R}=s;let p=-1;for(let i=n;i<2*n;i++)if(x[i*n+a]){p=i;break;}if(p>=0){for(let i=0;i<2*n;i++)if(i!==p&&x[i*n+a])chpSum(s,i,p);for(let j=0;j<n;j++){x[(p-n)*n+j]=x[p*n+j];z[(p-n)*n+j]=z[p*n+j];}r[p-n]=r[p];for(let j=0;j<n;j++){x[p*n+j]=0;z[p*n+j]=0;}z[p*n+a]=1;r[p]=rng()<0.5?0:1;return r[p];}const h=2*n;for(let j=0;j<n;j++){x[h*n+j]=0;z[h*n+j]=0;}r[h]=0;for(let i=0;i<n;i++)if(x[i*n+a])chpSum(s,h,i+n);return r[h];}

// ----- Module Pont Physique (EOF) -----
function sendToHardware(host, port, cmd, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ cmd, params });
    const req = http.request({
      hostname: host,
      port: port,
      path: '/qpu',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ----- CLI -----
const A=process.argv, C=A[2]||'help', P=(...a)=>console.log(...a);
if(C==='sim'){
  // ... appel simLocal ...
  P('Mode SIM conservé');
} else if(C==='hw') {
  const host = A[3] || '127.0.0.1', port = parseInt(A[4]) || 8080;
  P(`[HW] Envoi de la séquence au processeur physique sur ${host}:${port}...`);
  sendToHardware(host, port, 'PING', { qubits: 4 })
    .then(res => P('[HW] Réponse du processeur physique :', res))
    .catch(err => P('[HW] Erreur de communication :', err.message));
} else {
  P('Δ-QI-V V1 + Pont Physique');
  P(' node dqiv.js hw [host] [port]');
}
