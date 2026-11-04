








"use strict";
const M=(1n<<64n)-1n;
function fold(v){v=v<0n?~v:v;let h=0xCBF29CE484222325n,k=v===0n?0x9E3779B1n:v;while(k>0n){h=((h^(k&M))*0x100000001B3n)&M;k>>=64n;}return h;}
function cell(c){let h=0x1234567890ABCDEFn;for(let d=0;d<c.length;d++){h=((h^fold(c[d]+BigInt(d)*0x9E37n))*0xFF51AFD7ED558CCDn)&M;h^=h>>29n;}h^=h>>33n;return Number(h&M)/18446744073709551616*2-1;}
function voisins(c,mode){const D=c.length,out=[];
 if(mode==="axe"){for(let d=0;d<D;d++)for(const s of [1n,-1n]){const n=c.slice();n[d]+=s;out.push(n);}}
 else{const T=3**D;for(let m=0;m<T;m++){let t=m,zero=true;const n=c.slice();for(let d=0;d<D;d++){const o=t%3-1;if(o!==0)zero=false;n[d]+=BigInt(o);t=(t/3)|0;}if(!zero)out.push(n);}}
 return out;}
function stencil(c,mode){const nb=voisins(c,mode);let s=0;for(const x of nb)s+=cell(x);return s/nb.length;}
console.log("GEOMETRIE VARIABLE — 1D a 4D, voisinage axial ou diagonal, cellule = formule (0 octet)");
console.log("--------------------------------------------------");
const base=1n<<500n;
for(let D=1;D<=4;D++){
 const c=[];for(let d=0;d<D;d++)c.push(base+BigInt(d*7+1));
 for(const mode of ["axe","moore"]){
  const t=process.hrtime.bigint();const nb=voisins(c,mode).length;const v=cell(c);const st=stencil(c,mode);const us=Number(process.hrtime.bigint()-t)/1000;
  console.log(D+"D  "+(mode==="axe"?"axial   ":"diagonal")+" : "+String(nb).padStart(2)+" voisins  cell="+v.toFixed(4)+"  stencil="+st.toFixed(4)+"  ("+us.toFixed(0)+" us)");
 }
}
console.log("--------------------------------------------------");
console.log("voisins : axial = 2*D  |  diagonal (Moore) = 3^D - 1  (1D:2  2D:8  3D:26  4D:80)");
console.log("tout calcule, 0 octet, coordonnees de 501 bits. La geometrie est un parametre, pas une structure stockee.");
console.log("=> reste a choisir LA REGLE (ce qui le fera fonctionner) : quelle fonction des voisins fait vivre le cube.");
