








'use strict';
// QNE REPRISE — un "wait suffisant pour la reprise, mais qui ne ralentit rien".
// Secret : tout l'avenir de la machine tient dans son petit ETAT. Donc :
//  (1) pause/reprise = recharger l'etat -> O(1), zero rejoue ;
//  (2) rattraper un trou de N pas (resync a vide) = SAUT matriciel -> O(log N), pas N.
const N=16, FULL=(1<<N)-1, TAPS=[16,15,13,4];
const MASK=TAPS.reduce((m,t)=>m|(1<<(t-1)),0);
const fb=s=>{let x=s&MASK,p=0;while(x){p^=x&1;x>>=1;}return p;};
const step=(s,inp)=>(((s<<1)|((fb(s)^(inp&1))&1))&FULL); // lineaire sur GF(2) quand inp=0
const seed=0xACE1;

const stream=[1,0,1,1,0,0,1,0,1,1,1,0,0,1,0,1,1,0,1,0];
let a=seed; for(let i=0;i<8;i++)a=step(a,stream[i]);
const checkpoint=a;
let b=checkpoint; for(let i=8;i<stream.length;i++)b=step(b,stream[i]);
let ref=seed; for(const bit of stream)ref=step(ref,bit);
console.log('(1) PAUSE/REPRISE par checkpoint ('+N+' bits) :');
console.log('    reprise = 0x'+b.toString(16)+'  | sans coupure = 0x'+ref.toString(16)+'  -> '+(b===ref?'IDENTIQUE':'ECHEC')+'  (O(1), zero rejoue)');

const matFromStep=()=>{const cols=[];for(let c=0;c<N;c++)cols.push(step(1<<c,0));return cols;};
const applyCols=(cols,v)=>{let r=0;for(let c=0;c<N;c++)if((v>>c)&1)r^=cols[c];return r;};
const mulCols=(A,B)=>{const C=[];for(let c=0;c<N;c++)C.push(applyCols(A,B[c]));return C;};
const ident=()=>{const I=[];for(let c=0;c<N;c++)I.push(1<<c);return I;};
const powCols=(M,e)=>{let R=ident(),P=M;while(e>0n){if(e&1n)R=mulCols(R,P);P=mulCols(P,P);e>>=1n;}return R;};
const M=matFromStep();
let v=checkpoint; for(let i=0;i<1000;i++)v=step(v,0);
const jumped=applyCols(powCols(M,1000n),checkpoint);
console.log('(2) RATTRAPER un trou a vide par SAUT matriciel O(log N) :');
console.log('    1000 pas : naif=0x'+v.toString(16)+'  saut=0x'+jumped.toString(16)+'  -> '+(v===jumped?'IDENTIQUE':'ECHEC'));
const bigN=10n**12n; const t=process.hrtime.bigint();
const far=applyCols(powCols(M,bigN),checkpoint); const ms=Number(process.hrtime.bigint()-t)/1e6;
console.log('    10^12 pas sautes INSTANTANEMENT -> 0x'+far.toString(16)+'  en '+ms.toFixed(2)+' ms');
console.log('');
console.log('HONNETE : le "wait" de reprise n est JAMAIS un ralentissement, parce que tout');
console.log('l avenir tient dans l etat. Reprendre = recharger l etat (O(1)). Rattraper un');
console.log('trou = sauter en O(log N), pas rejouer en O(N). Suffisant (exact), jamais lent.');
