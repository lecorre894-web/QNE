








"use strict";
function lineaire(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
 for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];
  for(let r=0;r<n;r++)if(r!==c){const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k];}}
 return M.map((r,i)=>r[n]/r[i]);}
function racine(f,x){for(let k=0;k<60;k++){const d=(f(x+1e-7)-f(x-1e-7))/2e-7;if(d===0)break;const nx=x-f(x)/d;if(Math.abs(nx-x)<1e-12)return nx;x=nx;}return x;}
function minimise(f,a,b){const g=(Math.sqrt(5)-1)/2;let c=b-g*(b-a),d=a+g*(b-a);for(let k=0;k<200;k++){if(f(c)<f(d))b=d;else a=c;c=b-g*(b-a);d=a+g*(b-a);}return (a+b)/2;}
function integrale(f,a,b,n=1000){const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
function edo(f,y,t0,t1,h=1e-3){for(let t=t0;t<t1-1e-12;t+=h){const k1=f(t,y),k2=f(t+h/2,y+h/2*k1),k3=f(t+h/2,y+h/2*k2),k4=f(t+h,y+h*k3);y+=h/6*(k1+2*k2+2*k3+k4);}return y;}
const pgcd=(a,b)=>{while(b){[a,b]=[b,a%b];}return a;};
const modexp=(b,e,m)=>{b%=m;let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;};
function interpole(pts,x){let s=0;for(let i=0;i<pts.length;i++){let L=1;for(let j=0;j<pts.length;j++)if(j!==i)L*=(x-pts[j][0])/(pts[i][0]-pts[j][0]);s+=L*pts[i][1];}return s;}
function convolution(a,b){const r=new Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)r[i+j]+=a[i]*b[j];return r;}
const ok=(x,y,e=1e-4)=>Math.abs(x-y)<e?"OK":"ECHEC("+x+")";
console.log("================= SOLVEUR UNIVERSEL — verifications =================");
console.log("1 LINEAIRE   : x de {2x+y=3, x+3y=5} = "+lineaire([[2,1],[1,3]],[3,5]).map(v=>v.toFixed(2))+"   (attendu 0.80,1.40) "+ok(lineaire([[2,1],[1,3]],[3,5])[0],0.8));
console.log("2 RACINE     : sqrt(2) via x^2-2 = "+racine(x=>x*x-2,1).toFixed(6)+"   "+ok(racine(x=>x*x-2,1),Math.SQRT2));
console.log("3 MINIMISE   : min de (x-3)^2 = "+minimise(x=>(x-3)**2,0,6).toFixed(4)+"   "+ok(minimise(x=>(x-3)**2,0,6),3));
console.log("4 INTEGRALE  : \u222b0..1 4/(1+x^2) = "+integrale(x=>4/(1+x*x),0,1).toFixed(6)+"   (=pi) "+ok(integrale(x=>4/(1+x*x),0,1),Math.PI));
console.log("5 EDO        : y'=y, y(0)=1 -> y(1) = "+edo((t,y)=>y,1,0,1).toFixed(6)+"   (=e) "+ok(edo((t,y)=>y,1,0,1),Math.E));
console.log("6 MODULAIRE  : pgcd(48,36)="+pgcd(48,36)+"  3^100 mod 1e9+7 = "+modexp(3n,100n,1000000007n)+"   "+(pgcd(48,36)===12?"OK":"ECHEC"));
console.log("7 INTERPOLE  : parabole x^2 aux pts {1,2,3} -> f(5) = "+interpole([[1,1],[2,4],[3,9]],5).toFixed(2)+"   (=25) "+ok(interpole([[1,1],[2,4],[3,9]],5),25));
console.log("8 CONVOLUTION: [1,2,3]*[1,1] = ["+convolution([1,2,3],[1,1])+"]   (attendu 1,3,5,3)");
console.log("--------------------------------------------------------------------");
console.log("une seule boite : tout probleme ramene a des nombres+algebre, chacun sa methode. Extensible a volonte.");
