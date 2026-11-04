








"use strict";
const n=128, TN=Math.sqrt(n)*0.3;
let s=777>>>0;const rnd=()=>{s=(s*1103515245+12345)>>>0;return (s>>>8)/16777216*2-1;};
const W=Array.from({length:n},()=>Array.from({length:n},()=>rnd()/Math.sqrt(n)));
const mix=(x)=>{const y=new Float64Array(n);for(let i=0;i<n;i++){let a=0;const Wi=W[i];for(let j=0;j<n;j++)a+=Wi[j]*x[j];y[i]=a;}return y;};
const norme=(x)=>Math.sqrt(x.reduce((a,c)=>a+c*c,0));
const renorm=(y)=>{const k=TN/(norme(y)||1e-12);for(let i=0;i<n;i++)y[i]*=k;return y;};
const activ=(x)=>x.reduce((a,c)=>a+(Math.abs(c)<0.95?1:0),0)/n;
const POLY=0x87n,M=(1n<<128n)-1n;
const gmul=(a,b)=>{let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M)^POLY;b>>=1n;}return r;};
const sqr=(a)=>gmul(a,a);
const mulx=(R)=>{const c=R[3]>>>31;R[3]=((R[3]<<1)|(R[2]>>>31))>>>0;R[2]=((R[2]<<1)|(R[1]>>>31))>>>0;R[1]=((R[1]<<1)|(R[0]>>>31))>>>0;R[0]=((R[0]<<1)^(c?0x87:0))>>>0;};
console.log("================= LE PC ASSEMBLE — TEST LOURD =================");
let x=new Float64Array(n);for(let i=0;i<n;i++)x[i]=rnd()*0.3;
let K=6000,t0=process.hrtime.bigint();for(let p=0;p<K;p++)x=renorm(mix(x));
let el=Number(process.hrtime.bigint()-t0)/1e9;
console.log("LINEAIRE     : "+Math.round(K*n*n/el/1e6)+" M maj/s   stable (norme="+norme(x).toFixed(2)+") sur "+K.toLocaleString("fr-FR")+" pas");
x=new Float64Array(n);for(let i=0;i<n;i++)x[i]=rnd()*0.3;
t0=process.hrtime.bigint();for(let p=0;p<K;p++){let y=mix(x);for(let i=0;i<n;i++)y[i]=Math.tanh(5*y[i]);x=renorm(y);}
el=Number(process.hrtime.bigint()-t0)/1e9;
console.log("NON-LINEAIRE : "+Math.round(K*n*n/el/1e6)+" M maj/s   stable (norme="+norme(x).toFixed(2)+", activite "+(activ(x)*100).toFixed(0)+"%) sur "+K.toLocaleString("fr-FR")+" pas");
let r=2n,P=150000;t0=process.hrtime.bigint();for(let p=0;p<P;p++)r=sqr(r);el=Number(process.hrtime.bigint()-t0)/1e9;
const pal=Math.round(P/el);
let R=new Uint32Array([1,2,3,4]),F=3e6;const t1=process.hrtime.bigint();for(let k=0;k<F;k++)mulx(R);const gb=F*128/(Number(process.hrtime.bigint()-t1)/1e9)/1e9;
console.log("BITS         : "+pal.toLocaleString("fr-FR")+" paliers/s -> en 1 min, position 2^"+Math.round(pal*60).toLocaleString("fr-FR")+" (~"+Math.round(pal*60*0.30103).toLocaleString("fr-FR")+" chiffres)");
console.log("               flot genatif = "+gb.toFixed(1)+" Gbit/s depuis 1 nombre, 0 stockage");
console.log("--------------------------------------------------------------");
console.log("un seul PC : le lineaire file, le non-lineaire tient (renorm), les bits visent l'astronomique. Tout assemble.");
