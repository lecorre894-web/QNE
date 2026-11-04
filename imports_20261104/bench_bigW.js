"use strict";
function run(W,taps,exps){
 let mask=0n; for(const d of taps) mask|=(1n<<BigInt(d-1));
 const start=1n;
 const adv=s=>{const l=s&1n; s>>=1n; if(l)s^=mask; return s;};
 const rows=new Array(W).fill(0n);
 for(let k=0;k<W;k++){let c=adv(1n<<BigInt(k)); for(let i=0;i<W;i++) if((c>>BigInt(i))&1n) rows[i]|=(1n<<BigInt(k));}
 const par=x=>{let p=0n; while(x){p^=(x&1n); x>>=1n;} return p;};
 const matvec=(R,v)=>{let r=0n; for(let i=0;i<W;i++) if(par(R[i]&v)===1n) r|=(1n<<BigInt(i)); return r;};
 const matmul=(A,B)=>{const C=new Array(W).fill(0n); for(let i=0;i<W;i++){let a=A[i],acc=0n,j=0; while(a){ if(a&1n) acc^=B[j]; a>>=1n; j++;} C[i]=acc;} return C;};
 const ident=()=>{const I=new Array(W).fill(0n); for(let i=0;i<W;i++) I[i]=1n<<BigInt(i); return I;};
 const matpow=(M,N)=>{let R=ident(),Bb=M; while(N>0n){ if(N&1n) R=matmul(R,Bb); Bb=matmul(Bb,Bb); N>>=1n;} return R;};
 const stateAt=N=>matvec(matpow(rows,N),start);
 const Nv=1000000n; let sv=start; for(let i=0n;i<Nv;i++) sv=adv(sv);
 const ok=stateAt(Nv)===sv;
 const period=(2n**BigInt(W))-1n;
 console.log("=== W="+W+" === periode "+period.toString().length+" chiffres | verif deroule : "+(ok?"EXACT":"ERREUR"));
 for(const [nom,N] of exps){const t=process.hrtime.bigint(); const e=stateAt(N); const ms=Number(process.hrtime.bigint()-t)/1e6; console.log("   "+nom+" : "+ms.toFixed(0)+" ms  (etat "+e.toString().slice(0,20)+"...)");}
}
run(512,[512,8,5,2],[["10^100",10n**100n]]);
run(1024,[1024,19,15,1],[["10^100",10n**100n]]);
