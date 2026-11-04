








"use strict";
let s=Date.now()>>>0;const rnd=()=>{s=(s*1103515245+12345)>>>0;return s/4294967296;};
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const lineaire=(A,b)=>{const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];for(let r=0;r<n;r++)if(r!==c){const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k];}}return M.map((r,i)=>r[n]/r[i]);};
const newton=(f,x)=>{for(let k=0;k<80;k++){const d=(f(x+1e-7)-f(x-1e-7))/2e-7;if(!d)break;const nx=x-f(x)/d;if(Math.abs(nx-x)<1e-12)return nx;x=nx;}return x;};
const simpson=(f,a,b,n=2000)=>{const h=(b-a)/n;let S=f(a)+f(b);for(let i=1;i<n;i++)S+=(i%2?4:2)*f(a+i*h);return S*h/3;};
const modinv=(a,m)=>{a=((a%m)+m)%m;let r0=a,r1=m,s0=1n,s1=0n;while(r1){const q=r0/r1;[r0,r1]=[r1,r0-q*r1];[s0,s1]=[s1,s0-q*s1];}return ((s0%m)+m)%m;};
const gfmul=(a,b)=>{const M=(1n<<128n)-1n;let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M)^0x87n;b>>=1n;}return r;};
const aireTri=(a,b,c)=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))/2;
const shoelace=(P)=>{let s=0;for(let i=0;i<P.length;i++){const j=(i+1)%P.length;s+=P[i][0]*P[j][1]-P[j][0]*P[i][1];}return Math.abs(s)/2;};
let tous=true;const L=(nom,ok,d)=>{if(!ok)tous=false;console.log("  "+nom.padEnd(12)+" concu -> resolu -> "+(ok?"VERIFIE OK":"ECHEC")+"   "+d);};
console.log("LE PC SE CONCOIT ET SE RESOUT");
console.log("--------------------------------------------------");
{const n=4,xv=Array.from({length:n},()=>ri(-9,9)),A=Array.from({length:n},()=>Array.from({length:n},()=>rnd()*2-1));
 const b=A.map(r=>r.reduce((a,w,j)=>a+w*xv[j],0));const x=lineaire(A,b);const err=Math.max(...x.map((v,i)=>Math.abs(v-xv[i])));
 L("LINEAIRE",err<1e-6,"systeme "+n+"x"+n+" -> solution exacte retrouvee");}
{const r=ri(-8,8)+rnd();const f=(x)=>(x-r)*(x*x+2);const t=newton(f,r+1.5);L("RACINE",Math.abs(t-r)<1e-6,"racine cachee "+r.toFixed(3)+" retrouvee "+t.toFixed(3));}
{const a=2+rnd()*3;const I=simpson(x=>3*x*x,0,a);L("INTEGRALE",Math.abs(I-a*a*a)<1e-3,"∫3x^2 = "+I.toFixed(3)+" vs a^3="+(a*a*a).toFixed(3));}
{const P=[[ri(-9,9),ri(-9,9)],[ri(-9,9),ri(-9,9)],[ri(-9,9),ri(-9,9)]];const a1=aireTri(P[0],P[1],P[2]),a2=shoelace(P);L("GEOMETRIE",Math.abs(a1-a2)<1e-9,"aire triangle = "+a1.toFixed(2)+" (2 methodes concordent)");}
{const m=1000000007n,a=BigInt(ri(2,1e8));const inv=modinv(a,m);L("MODULAIRE",(a*inv)%m===1n,"inverse de "+a+" mod p : a*inv mod p = 1");}
{const a=BigInt(ri(1,1e9)),b=BigInt(ri(1,1e9)),c=BigInt(ri(1,1e9));const g=gfmul(a,b^c),d=gfmul(a,b)^gfmul(a,c);L("GF(2^128)",g===d,"distributivite a(b+c)=ab+ac verifiee");}
console.log("--------------------------------------------------");
console.log(tous?"TOUT VERIFIE : le PC a concu, resolu et controle seul, dans tous les domaines.":"au moins un echec.");
