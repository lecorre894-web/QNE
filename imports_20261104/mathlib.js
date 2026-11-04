








"use strict";
const GEO={
 distance:(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]),
 milieu:(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2],
 norme:(v)=>Math.hypot(...v),
 scalaire:(u,v)=>u.reduce((a,x,i)=>a+x*v[i],0),
 angle:(u,v)=>Math.acos(GEO.scalaire(u,v)/(GEO.norme(u)*GEO.norme(v))),
 aireTriangle:(a,b,c)=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))/2,
 airePolygone:(P)=>{let s=0;for(let i=0;i<P.length;i++){const j=(i+1)%P.length;s+=P[i][0]*P[j][1]-P[j][0]*P[i][1];}return Math.abs(s)/2;},
 rotation:(p,t)=>[p[0]*Math.cos(t)-p[1]*Math.sin(t),p[0]*Math.sin(t)+p[1]*Math.cos(t)],
 dansPolygone:(pt,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){if(((P[i][1]>pt[1])!==(P[j][1]>pt[1]))&&(pt[0]<(P[j][0]-P[i][0])*(pt[1]-P[i][1])/(P[j][1]-P[i][1])+P[i][0]))c=!c;}return c;},
 vectoriel3:(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
};
const ALG={
 pgcd:(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a;},
 ppcm:(a,b)=>a/ALG.pgcd(a,b)*b,
 modexp:(b,e,m)=>{b%=m;let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;},
 modinv:(a,m)=>{a=((a%m)+m)%m;let r0=a,r1=m,s0=1n,s1=0n;while(r1){const q=r0/r1;[r0,r1]=[r1,r0-q*r1];[s0,s1]=[s1,s0-q*s1];}return ((s0%m)+m)%m;},
 horner:(c,x)=>c.reduce((a,k)=>a*x+k,0),
 polyMul:(a,b)=>{const r=new Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)r[i+j]+=a[i]*b[j];return r;},
 quadratique:(a,b,c)=>{const d=b*b-4*a*c;if(d<0)return null;const s=Math.sqrt(d);return [(-b+s)/(2*a),(-b-s)/(2*a)];},
 matMul:(A,B)=>{const n=A.length,p=B[0].length,q=B.length,C=A.map(()=>new Array(p).fill(0));for(let i=0;i<n;i++)for(let k=0;k<q;k++)for(let j=0;j<p;j++)C[i][j]+=A[i][k]*B[k][j];return C;},
 determinant:(A)=>{const n=A.length,M=A.map(r=>[...r]);let det=1;for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;if(M[p][c]===0)return 0;if(p!==c){[M[c],M[p]]=[M[p],M[c]];det=-det;}det*=M[c][c];for(let r=c+1;r<n;r++){const f=M[r][c]/M[c][c];for(let k=c;k<n;k++)M[r][k]-=f*M[c][k];}}return det;},
 gfmul:(a,b)=>{const M=(1n<<128n)-1n;let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M)^0x87n;b>>=1n;}return r;}
};
const VAR={
 PI:Math.PI, E:Math.E, PHI:(1+Math.sqrt(5))/2, SQRT2:Math.SQRT2, GAMMA:0.5772156649015329,
 GF_POLY:"x^128+x^7+x^2+x+1 (masque 0x87)", RENORM_CIBLE:"racine(n) (Delta~1)", VOISINS:"axial 2D | diagonal 3^D-1",
 TYPES:"reel(Float64) | bit | GF(2^128) | BigInt | soft-bit [0,1]"
};
if(typeof module!=="undefined")module.exports={GEO,ALG,VAR};
if(require.main===module){
 const ok=(x,y,e=1e-6)=>Math.abs(x-y)<e?"OK":"ECHEC("+x+")";
 console.log("MATHLIB — GEOMETRIE");
 console.log("  distance (0,0)-(3,4) = "+GEO.distance([0,0],[3,4])+"  "+ok(GEO.distance([0,0],[3,4]),5));
 console.log("  aire triangle (0,0)(4,0)(0,3) = "+GEO.aireTriangle([0,0],[4,0],[0,3])+"  "+ok(GEO.aireTriangle([0,0],[4,0],[0,3]),6));
 console.log("  aire carre unite (shoelace) = "+GEO.airePolygone([[0,0],[1,0],[1,1],[0,1]])+"  "+ok(GEO.airePolygone([[0,0],[1,0],[1,1],[0,1]]),1));
 console.log("  rotation (1,0) de 90deg = ["+GEO.rotation([1,0],Math.PI/2).map(v=>v.toFixed(2))+"]  (attendu 0,1)");
 console.log("  point (0.5,0.5) dans carre ? "+GEO.dansPolygone([0.5,0.5],[[0,0],[1,0],[1,1],[0,1]]));
 console.log("MATHLIB — ALGEBRE");
 console.log("  pgcd(48,36)="+ALG.pgcd(48,36)+" ppcm="+ALG.ppcm(48,36)+"  "+(ALG.pgcd(48,36)===12?"OK":"X"));
 console.log("  modinv(3,7)="+ALG.modinv(3n,7n)+"  (3*5=15=1 mod7)  "+(ALG.modinv(3n,7n)===5n?"OK":"X"));
 console.log("  horner x^2+2x+3 en 2 = "+ALG.horner([1,2,3],2)+"  "+ok(ALG.horner([1,2,3],2),11));
 console.log("  racines x^2-5x+6 = ["+ALG.quadratique(1,-5,6)+"]  (3,2)");
 console.log("  det [[1,2],[3,4]] = "+ALG.determinant([[1,2],[3,4]])+"  "+ok(ALG.determinant([[1,2],[3,4]]),-2));
 console.log("MATHLIB — VARIABLES");
 console.log("  PI="+VAR.PI.toFixed(5)+" E="+VAR.E.toFixed(5)+" PHI(nombre d'or)="+VAR.PHI.toFixed(5));
 console.log("  QNE : GF_POLY="+VAR.GF_POLY+" | types = "+VAR.TYPES);
 console.log("--------------------------------------------------");
 console.log("3 librairies pretes : require -> {GEO, ALG, VAR}. La bibliotheque est complete.");
}
