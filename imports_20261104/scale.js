








"use strict";
function test(W,taps){
 let mask=0n; for(const d of taps) mask|=(1n<<BigInt(d-1));
 const start=1n;
 const adv=s=>{const l=s&1n; s>>=1n; if(l)s^=mask; return s;};
 const tb=process.hrtime.bigint();
 const rows=new Array(W).fill(0n);
 for(let k=0;k<W;k++){let c=adv(1n<<BigInt(k)); for(let i=0;i<W;i++) if((c>>BigInt(i))&1n) rows[i]|=(1n<<BigInt(k));}
 const buildMs=Number(process.hrtime.bigint()-tb)/1e6;
 const par=x=>{let p=0n; while(x){p^=(x&1n); x>>=1n;} return p;};
 const matvec=(R,v)=>{let r=0n; for(let i=0;i<W;i++) if(par(R[i]&v)===1n) r|=(1n<<BigInt(i)); return r;};
 const matmul=(A,B)=>{const C=new Array(W).fill(0n); for(let i=0;i<W;i++){let a=A[i],acc=0n,j=0; while(a){ if(a&1n) acc^=B[j]; a>>=1n; j++;} C[i]=acc;} return C;};
 const ident=()=>{const I=new Array(W).fill(0n); for(let i=0;i<W;i++) I[i]=1n<<BigInt(i); return I;};
 const matpow=(M,N)=>{let R=ident(),Bb=M; while(N>0n){ if(N&1n) R=matmul(R,Bb); Bb=matmul(Bb,Bb); N>>=1n;} return R;};
 const Nv=100000n; let sv=start; for(let i=0n;i<Nv;i++) sv=adv(sv);
 const ok = matvec(matpow(rows,Nv),start)===sv;
 const t=process.hrtime.bigint(); matvec(matpow(rows,10n**18n),start); const jumpMs=Number(process.hrtime.bigint()-t)/1e6;
 const matBytes=W*W/8;
 console.log("W="+String(W).padStart(5)+" | periode "+(2n**BigInt(W)-1n).toString().length+" chiffres | matrice "+(matBytes<1e6?(matBytes/1e3).toFixed(0)+" Ko":(matBytes/1e6).toFixed(1)+" Mo")+" | build "+buildMs.toFixed(0)+" ms | saut@10^18 "+jumpMs.toFixed(0)+" ms | "+(ok?"EXACT":"ERREUR"));
}
test(256,[256,10,5,2]);
test(512,[512,8,5,2]);
test(1024,[1024,19,15,1]);
test(2048,[2048,19,14,13]);
test(4096,[4096,27,15,1]);
test(8192,[8192,21,13,5]);
