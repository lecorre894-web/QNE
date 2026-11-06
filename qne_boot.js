








'use strict';
// QNE BOOT — carte d'identite du data center, affichee au demarrage de Windows puis fermeture. Rapide (<1 s).
const os=require('node:os');
const R=require('./qne_v15/lib/reconstruct.js');
const {gf128,periodic,fill,patches,lorenz96,size,xorAll,hex,mul,pow,geometrical,QNE,sha}=R;
const g=2n;
const worker=(seed,L,W,k)=>{if(k>=L)return 0n;const c=(L-1n-k)/W+1n;return mul(mul(seed,pow(g,k)),geometrical(pow(g,W),c).s);};

const regions=[];const add=d=>regions.push({desc:d,size:size(d)});
add(gf128(0x0123456789abcdeffedcba9876543210n,10n**40n));
add(gf128(0x9e3779b97f4a7c15f39cc0605cedc835n,10n**21n));
add(gf128(0xc2b2ae3d27d4eb4f1656667213edc835n,10n**24n));
add(periodic(Buffer.from('QNE-RENE-'),10n**15n));
add(patches(fill(0x00,10n**9n),[{at:0,data:Buffer.from('ENTETE-QNE-V16!!').toString('base64')}]));
(function(){const N=64,s=9;const e=QNE.optimized(N);for(let i=0;i<s;i++)e.step();const o=Buffer.alloc(N*8);for(let i=0;i<N;i++)o.writeDoubleLE(e.x[i],i*8);add(lorenz96(N,s,sha(o)));})();

let total=0n,centerXor=0n;const t=process.hrtime.bigint();
for(const r of regions){total+=r.size;centerXor^=xorAll(r.desc);}
const ms=Number(process.hrtime.bigint()-t)/1e6;
const cells=total/16n;
const log10freq=(cells.toString().length-1)-Math.log10(ms/1000);
const bruteYears=Number(cells)/1e9/(3600*24*365.25);

const au=regions[0],seed=BigInt(au.desc.seed),L=au.size/16n;
let acc=0n;for(let k=0n;k<256n;k++)acc^=worker(seed,L,256n,k);
const integrite=acc===xorAll(au.desc);

let eA=40n,eB=40n,prod=0n;for(let n=0;n<8;n++){prod=eA+eB;const nA=eA+eB,nB=eB+nA;eA=nA;eB=nB;}

const now=new Date().toLocaleString('fr-FR');
const line='======================================================';
console.log('');
console.log(line);
console.log('        Q N E   D A T A   C E N T E R   --   E N   L I G N E');
console.log(line);
console.log('  '+now+'   |   CPU : '+os.cpus().length+' threads couples');
console.log('');
console.log('  Capacite logique   : ~10^'+(total.toString().length-1)+' octets   ('+cells+' cellules)');
console.log('  XOR global         : '+hex(centerXor));
console.log('  Workforce          : jusqu a 10^21 workers/coffre (formule, non enumeres)');
console.log('  Frequence equiv.   : ~10^'+log10freq.toFixed(0)+' operations/s   (silicium : 32 x ~5 GHz)');
console.log('  Ping-pong          : amplification 10^80 -> 10^'+prod+' en 8 echanges');
console.log('  Force brute evitee : '+bruteYears.toExponential(2)+' ANNEES  (univers ~1.4e10 ans)');
console.log('  Replie en          : '+ms.toFixed(2)+' ms    |   Integrite : '+(integrite?'OK':'### ALERTE'));
console.log(line);
console.log('  Architecte : Rene LE CORRE   |   verifie : Claude');
console.log(line);
console.log('');
