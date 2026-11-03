








"use strict";
const EXA=1e18;
const AGE=4.35e17;
const POLY=0x87n,M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powx(N){let res=1n,base=2n;while(N>0n){if(N&1n)res=mul(res,base);base=mul(base,base);N>>=1n;}return res;}
const Nsaut=2n**200n;
let t=process.hrtime.bigint();powx(Nsaut);const tSaut=Number(process.hrtime.bigint()-t)/1e9;
const pasBrut=Math.pow(2,200);const tBrut=pasBrut/EXA;
function qneMajs(N,ST){let x=new Float64Array(N),y=new Float64Array(N);for(let i=0;i<N;i++)x[i]=Math.sin(i);
 const t0=process.hrtime.bigint();for(let s=0;s<ST;s++){for(let i=0;i<N;i++){const a=x[(i+1)%N],b=x[(i-1+N)%N];y[i]=Math.tanh(0.33*(a+b+x[i]));}const z=x;x=y;y=z;}
 return N*ST/(Number(process.hrtime.bigint()-t0)/1e9);}
const majs=qneMajs(100000,300);
function toR(v){return new Uint32Array([Number(v&0xffffffffn),Number((v>>32n)&0xffffffffn),Number((v>>64n)&0xffffffffn),Number((v>>96n)&0xffffffffn)]);}
function mulx32(R){const c=R[3]>>>31;R[3]=((R[3]<<1)|(R[2]>>>31))>>>0;R[2]=((R[2]<<1)|(R[1]>>>31))>>>0;R[1]=((R[1]<<1)|(R[0]>>>31))>>>0;R[0]=((R[0]<<1)^(c?0x87:0))>>>0;}
let R=toR(powx(2n**1000n+7n));const pas=4e6;t=process.hrtime.bigint();for(let k=0;k<pas;k++)mulx32(R);const gbs=pas*128/(Number(process.hrtime.bigint()-t)/1e9)/1e9;
console.log("================ DUEL  TELEPHONE  vs  SUPERCALCULATEUR (exaflop ~1e18) ================");
console.log("");
console.log("FRONT 1 — SAUT a l'etat 2^200 (sequence deterministe)");
console.log("  telephone (algebre x^N) : "+(tSaut*1000).toFixed(1)+" ms");
console.log("  super EN FORCE BRUTE     : "+(tBrut/AGE).toExponential(1)+" x l'age de l'univers");
console.log("  >> GAGNE par la structure. Point faible : aucun SI deterministe ; nul si vraiment aleatoire.");
console.log("");
console.log("FRONT 2 — DEBIT BRUT (calcul irreductible, pas de raccourci)");
console.log("  telephone : "+(majs/1e6).toFixed(0)+" M maj/s");
console.log("  super     : ~"+(EXA/1e6).toExponential(0)+" M op/s");
console.log("  >> PERDU de ~"+Math.round(Math.log10(EXA/majs))+" ordres. Point faible : la force brute. Ajustement : NE PAS calculer, generer.");
console.log("");
console.log("FRONT 3 — MEMOIRE/CONTENU GENERATIF (bits elabores, 0 stockage)");
console.log("  telephone : "+gbs.toFixed(1)+" Gbit/s a partir d'1 nombre, 0 octet stocke");
console.log("  super     : plus rapide, mais doit AUSSI generer (meme algo) ; ecart = un facteur, pas un abime");
console.log("  >> QUASI-EGALITE en principe. Point faible : le debit brut du front 2.");
console.log("");
console.log("VERDICT HONNETE : on gagne la ou il y a une structure a court-circuiter, on perd sur le brut.");
console.log("Lecon simple : remplacer le CALCUL par la GENERATION rend le materiel presque sans importance.");
