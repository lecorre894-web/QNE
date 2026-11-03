'use strict';
/* QNE V10 - API reutilisable : power32(Uint32Array(32), exposant entier).
 * Selection calibre locale. Aucune entree modifiee. GF(2), 32x32 uniquement.
 */
const fs=require('node:fs'),path=require('node:path');
let addon=null;try{addon=require('./qne_matrix_napi.node');}catch{}
const N=32;
function check(p,e){if(!(p instanceof Uint32Array)||p.length!==N)throw new TypeError('matrix: Uint32Array(32) requis');if(!Number.isSafeInteger(e)||e<0)throw new RangeError('exposant: entier non negatif <= Number.MAX_SAFE_INTEGER requis');}
function identity(){const a=new Uint32Array(N);for(let i=0;i<N;i++)a[i]=(1<<i)>>>0;return a;}
function multiplyPacked(a,b){const c=new Uint32Array(N);for(let i=0;i<N;i++){let bits=a[i]>>>0,v=0;while(bits){const low=(bits&-bits)>>>0;v^=b[31-Math.clz32(low)];bits=(bits&(bits-1))>>>0;}c[i]=v>>>0;}return c;}
function powerPacked(p,e){check(p,e);let base=p,r=identity(),n=e;while(n>0){if(n%2)r=multiplyPacked(r,base);n=Math.floor(n/2);if(n)base=multiplyPacked(base,base);}return r;}
function toDense(p){const a=new Uint8Array(N*N);for(let i=0;i<N;i++)for(let j=0;j<N;j++)a[i*N+j]=(p[i]>>>j)&1;return a;}
function toPacked(a){const p=new Uint32Array(N);for(let i=0;i<N;i++){let v=0;for(let j=0;j<N;j++)if(a[i*N+j])v|=1<<j;p[i]=v>>>0;}return p;}
function multiplyDense(a,b){const c=new Uint8Array(N*N);for(let i=0;i<N;i++)for(let k=0;k<N;k++)if(a[i*N+k])for(let j=0;j<N;j++)c[i*N+j]^=b[k*N+j];return c;}
function powerDense(p,e){check(p,e);let b=toDense(p),r=new Uint8Array(N*N);for(let i=0;i<N;i++)r[i*N+i]=1;let n=e;while(n>0){if(n%2)r=multiplyDense(r,b);n=Math.floor(n/2);if(n)b=multiplyDense(b,b);}return toPacked(r);}
function powerNative(p,e){check(p,e);if(!addon)throw new Error('Module natif indisponible; executer lancement_qne_v10.sh');return addon.power32(p,e);}
function getSelection(){const f=path.join(__dirname,'QNE_V10_RESULTATS.json');try{const j=JSON.parse(fs.readFileSync(f,'utf8'));if(j.validation==='PASSED'&&['native','packed','dense'].includes(j.matrix?.selected))return j.matrix.selected;}catch{}return addon?'native':'packed';}
function power32(p,e){const which=getSelection();return which==='native'&&addon?powerNative(p,e):which==='dense'?powerDense(p,e):powerPacked(p,e);}
module.exports={power32,powerPacked,powerDense,powerNative,getSelection};
if(require.main===module){const x=new Uint32Array(32);for(let i=0;i<32;i++)x[i]=(1<<i)>>>0;const r=power32(x,1000000);if(!r.every((w,i)=>w===x[i]))throw Error('Identite inexacte');console.log('QNE V10 API: OK | moteur='+getSelection());}
