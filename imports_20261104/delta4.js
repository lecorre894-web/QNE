'use strict';
const S=1/Math.SQRT2,H=[[S,0],[S,0],[S,0],[-S,0]];
const pc=x=>{let c=0;while(x){c+=x&1;x>>>=1;}return c;};
const mkR=s=>()=>((s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff);
function island(n){const N=1<<n;return{n,N,re:new Float64Array(N),im:new Float64Array(N)};}
function g1(is,t,m){const{re,im,N}=is,b=1<<t;for(let i=0;i<N;i++){if(i&b)continue;const j=i|b;
 const ar=re[i],ai=im[i],br=re[j],bi=im[j];
 re[i]=(m[0][0]*ar-m[0][1]*ai)+(m[1][0]*br-m[1][1]*bi);im[i]=(m[0][0]*ai+m[0][1]*ar)+(m[1][0]*bi+m[1][1]*br);
 re[j]=(m[2][0]*ar-m[2][1]*ai)+(m[3][0]*br-m[3][1]*bi);im[j]=(m[2][0]*ai+m[2][1]*ar)+(m[3][0]*bi+m[3][1]*br);}}
function cnot(is,c,t){const{re,im,N}=is,bc=1<<c,bt=1<<t;for(let i=0;i<N;i++){if((i&bc)&&!(i&bt)){const j=i|bt;
 const r=re[i],m=im[i];re[i]=re[j];im[i]=im[j];re[j]=r;im[j]=m;}}}
function measure(is,rng){const{re,im,N}=is;let r=rng(),a=0,p=0;for(let i=0;i<N;i++){a+=re[i]*re[i]+im[i]*im[i];p=i;if(r<=a)break;}return p;}
function tick(is,rng){is.re.fill(0);is.im.fill(0);is.re[0]=1;g1(is,0,H);if(is.n>1)cnot(is,0,1);return measure(is,rng);}
function tree(d,b,is,rng,acc){if(d===0){const p=tick(is,rng);acc.n++;acc.sig+=pc(p)*(0.8+0.4*rng());return;}
 for(let i=0;i<b;i++)tree(d-1,b,is,rng,acc);}
const branch=+process.argv[2]||10,depth=+process.argv[3]||7;
console.log('Δ fractal — branche '+branch+' ^ profondeur '+depth+' = '+Math.pow(branch,depth).toLocaleString('fr')+' îlots-feuilles');
const is=island(4),rng=mkR(Date.now()&0x7fffffff),acc={n:0,sig:0},t=Date.now();
tree(depth,branch,is,rng,acc);
const wall=(Date.now()-t)/1000;
console.log('îlots   : '+acc.n.toLocaleString('fr'));
console.log('Δ-sign  : '+acc.sig.toFixed(2));
console.log('temps   : '+wall.toFixed(2)+' s');
console.log('débit   : '+Math.round(acc.n/wall).toLocaleString('fr')+' îlots/s');
