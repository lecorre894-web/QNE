"use strict";
const W=parseInt(process.argv[2]||"32",10);
const MM={28:0x9000000,29:0x10000002,30:0x20000029,31:0x40000004,32:0x80200003};
const mask=MM[W]>>>0,start=1>>>0,MAX=2**W-1;
const adv=x=>{const l=x&1;x=x>>>1;if(l)x=(x^mask)>>>0;return x;};
// --- A : debit brut (coprocesseur) ---
const NB=200_000_000; let s=start; const tA=process.hrtime.bigint();
for(let i=0;i<NB;i++)s=adv(s);
const secA=Number(process.hrtime.bigint()-tA)/1e9;
// --- matrice de transition GF(2) : colonne k = adv(1<<k) ---
const rows=new Uint32Array(W);
for(let k=0;k<W;k++){const c=adv((1<<k)>>>0);for(let i=0;i<W;i++)if((c>>>i)&1)rows[i]=(rows[i]|(1<<k))>>>0;}
const pc=x=>{x=x>>>0;x=x-((x>>>1)&0x55555555);x=(x&0x33333333)+((x>>>2)&0x33333333);return (((x+(x>>>4))&0x0f0f0f0f)*0x01010101)>>>24;};
const matvec=(R,v)=>{let r=0;for(let i=0;i<W;i++)if(pc(R[i]&v)&1)r=(r|(1<<i))>>>0;return r>>>0;};
const matmul=(A,B)=>{const C=new Uint32Array(W);for(let i=0;i<W;i++){let acc=0,a=A[i];while(a){const j=31-Math.clz32(a);acc=(acc^B[j])>>>0;a=(a&~(1<<j))>>>0;}C[i]=acc;}return C;};
const ident=()=>{const I=new Uint32Array(W);for(let i=0;i<W;i++)I[i]=(1<<i)>>>0;return I;};
const matpow=(M,N)=>{let R=ident(),B=M;while(N>0n){if(N&1n)R=matmul(R,B);B=matmul(B,B);N>>=1n;}return R;};
const stateAt=N=>matvec(matpow(rows,N),start);
// --- B : verif jump-ahead contre deroule ---
const Nv=5_000_000n; let sv=start; for(let i=0;i<Nv;i++)sv=adv(sv);
const okJump = stateAt(Nv)===sv;
// --- C : jump-ahead a des pas astronomiques, chrono ---
const cibles=[["10^15",10n**15n],["10^100",10n**100n],["10^1000",10n**1000n]];
const res=cibles.map(([nom,N])=>{const t=process.hrtime.bigint();const e=stateAt(N%BigInt(MAX===0?1:MAX));const us=Number(process.hrtime.bigint()-t)/1e3;return nom+" -> registre "+e+"  ("+us.toFixed(0)+" us)";});
console.log("BENCHMARK W="+W+"  (periode max "+MAX.toLocaleString("fr-FR")+")");
console.log("A/ debit brut : "+(NB/secA/1e6).toFixed(0)+" M pas/s  ("+NB.toLocaleString("fr-FR")+" pas en "+secA.toFixed(2)+" s)");
console.log("B/ jump-ahead vs deroule au pas 5 000 000 : "+(okJump?"EXACT":"ERREUR"));
console.log("C/ etat lu directement, sans stocker :");
for(const r of res)console.log("   "+r);
