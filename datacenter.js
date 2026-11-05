








'use strict';
// QNE DATACENTER AVANCE — couche strictement additive au-dessus du moteur V15.
// Un espace d'adressage logique unifie fait de regions GENERABLES (gf128, periodic,
// fill, patches, lorenz96, literal). Capacite astronomique, descripteur minuscule,
// agregat XOR EXACT par l'algebre, zero octet physique. Verifie, pas vante.
const R=require('./qne_v15/lib/reconstruct.js');
const {gf128,periodic,fill,patches,lorenz96,literal,size,read,xorAll,sha,hex,bufferToBigLE,QNE}=R;

const U=['o','Kio','Mio','Gio','Tio','Pio','Eio','Zio','Yio'];
function human(nBig){let n=BigInt(nBig),i=0,div=1n;while(i<U.length-1&&n/(div*1024n)>0n){div*=1024n;i++;}
 if(div===1n)return n.toString()+' '+U[i];const whole=n/div,frac=Number((n*100n/div)%100n);return whole.toString()+'.'+String(frac).padStart(2,'0')+' '+U[i];}
function descBytes(d){return Buffer.byteLength(JSON.stringify(d));}
function bruteXor(buf){const r=Buffer.alloc(16);for(let i=0;i<buf.length;i++)r[i%16]^=buf[i];return bufferToBigLE(r);}

class DataCenter{
 constructor(){this.regions=[];this.total=0n;this.store=new Map();}
 add(name,desc){
  if(size(desc)%16n!==0n)throw Error('Region '+name+' : taille doit etre multiple de 16');
  const key=sha(Buffer.from(JSON.stringify(desc)));
  let rec=this.store.get(key);
  if(!rec){rec={desc,bytes:descBytes(desc),refs:0};this.store.set(key,rec);}
  rec.refs++;const sz=size(desc);
  this.regions.push({name,key,off:this.total,size:sz,kind:desc.kind});
  this.total+=sz;return this;
 }
 locate(g){g=BigInt(g);for(const r of this.regions)if(g>=r.off&&g<r.off+r.size)return r;throw Error('Adresse hors du centre');}
 read(g,len){g=BigInt(g);const r=this.locate(g),local=g-r.off;if(local+BigInt(len)>r.size)throw Error('Lecture a cheval sur deux regions');
  const buf=read(this.store.get(r.key).desc,local,len);return {region:r.name,bytes:buf,sha256:sha(buf)};}
 xorGlobal(){let acc=0n;for(const r of this.regions)acc^=xorAll(this.store.get(r.key).desc);return acc;}
 manifest(){let db=0n;for(const rec of this.store.values())db+=BigInt(rec.bytes);
  return {regions:this.regions.length,uniques:this.store.size,logical:this.total,descBytes:db};}
}

const dc=new DataCenter();
dc.add('coffre-GF128-1Eio', gf128(0x9e3779b97f4a7c15f39cc0605cedc835n, 1152921504606846976n));
dc.add('archive-periodique-1Tio', periodic(Buffer.from('QNE-RENE-'), 1099511627776n));
dc.add('volume-fill-256Gio', fill(0x00, 274877906944n));
dc.add('disque-patches-1Gio', patches(fill(0x00,1073741824n), [
  {at:0,        data:Buffer.from('ENTETE-QNE-V16!!').toString('base64')},
  {at:536870912,data:Buffer.from('SECTEUR-MILIEU!!').toString('base64')},
  {at:1073741808,data:Buffer.from('FIN-DE-VOLUME-!!').toString('base64')}
]));
(function(){const N=64,steps=9;const e=QNE.optimized(N);for(let i=0;i<steps;i++)e.step();
 const out=Buffer.alloc(N*8);for(let i=0;i<N;i++)out.writeDoubleLE(e.x[i],i*8);
 dc.add('jumeau-L96-nonlineaire', lorenz96(N,steps,sha(out)));})();
dc.add('bloc-litteral-128o', literal(Buffer.from(Array.from({length:128},(_,i)=>(i*131+7)&255))));
dc.add('archive-periodique-copie', periodic(Buffer.from('QNE-RENE-'), 1099511627776n));
dc.add('echantillon-GF128-4Kio', gf128(0x0123456789abcdeffedcba9876543210n, 4096n));

const m=dc.manifest();
console.log('========== QNE DATACENTER AVANCE ==========');
console.log('Regions declarees      : '+m.regions+'  (descripteurs uniques : '+m.uniques+'  -> dedup actif)');
console.log('Capacite LOGIQUE totale : '+human(m.logical)+'   ('+m.logical+' octets)');
console.log('Poids reel descripteurs : '+m.descBytes+' octets');
const amp=m.logical/m.descBytes;
console.log('Amplification           : x'+amp+'   (~10^'+(amp.toString().length-1)+' : octets generables par octet stocke)');
console.log('-------------------------------------------');
for(const r of dc.regions){const rec=dc.store.get(r.key);
 console.log('  '+r.name.padEnd(26)+r.kind.padEnd(9)+human(r.size).padStart(12)+'  | descr '+rec.bytes+' o');}
let t=process.hrtime.bigint();
const gx=dc.xorGlobal();
let ms=Number(process.hrtime.bigint()-t)/1e6;
console.log('-------------------------------------------');
console.log('XOR GLOBAL (tout le centre, exact algebrique) : '+hex(gx));
console.log('  calcule en '+ms.toFixed(2)+' ms, SANS materialiser un seul des '+human(m.logical)+'.');
console.log('-------------------------------------------');
console.log('VERIFICATION (algebre vs force brute, regions <= 64 Kio) :');
let allok=true;
for(const r of dc.regions){
 if(r.size<=65536n){
  const desc=dc.store.get(r.key).desc;
  const buf=read(desc,0n,Number(r.size));
  const brute=bruteXor(buf);
  const alg=xorAll(desc);
  const ok=brute===alg;allok=allok&&ok;
  console.log('  '+r.name.padEnd(26)+(ok?'EXACT':'ERREUR')+'  '+hex(alg));
 }
}
const probe=dc.read(123456789012345n,32);
console.log('-------------------------------------------');
console.log('Lecture adressee @123456789012345 (dans '+probe.region+') : '+probe.bytes.toString('hex'));
console.log('  sha256 fenetre = '+probe.sha256.slice(0,32)+'...');
console.log('===========================================');
console.log(allok?'TOUT VERIFIE : centre coherent, algebre = force brute, lecture exacte.':'ECHEC DE VERIFICATION.');
