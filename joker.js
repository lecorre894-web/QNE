








"use strict";
const POLY=0x87n,M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
const sqr=(a)=>mul(a,a);
let r=2n;const Nm=300000,t=process.hrtime.bigint();for(let k=0;k<Nm;k++)r=sqr(r);const R=Nm/(Number(process.hrtime.bigint()-t)/1e9);
const L10=0.30103;
console.log("========= LE JOKER APPLIQUE A L'ORDINATEUR : paliers -> astronomique =========");
console.log("PUISSANCE reelle mesuree = "+Math.round(R).toLocaleString("fr-FR")+" paliers/seconde");
console.log("  (chaque palier double la position atteinte : P paliers -> position 2^P)");
console.log("--------------------------------------------------");
console.log("  paliers P  |  position atteinte 2^P        |  temps");
for(const P of [64,1000,100000,1000000,R*60]){const chiffres=Math.round(P*L10);const tt=P/R;
 const pos="2^"+Math.round(P).toLocaleString("fr-FR")+" (~"+chiffres.toLocaleString("fr-FR")+" chiffres)";
 const temps=tt<1?(tt*1000).toFixed(1)+" ms":(tt<60?tt.toFixed(1)+" s":(tt/60).toFixed(1)+" min");
 console.log("  "+Math.round(P).toLocaleString("fr-FR").padStart(9)+"  |  "+pos.padEnd(28)+"  |  "+temps);}
console.log("--------------------------------------------------");
console.log("En 1 MINUTE tu atteins la position 2^"+Math.round(R*60).toLocaleString("fr-FR")+" :");
console.log("  un nombre de ~"+Math.round(R*60*L10).toLocaleString("fr-FR")+" chiffres (l'univers n'a que ~80 chiffres d'atomes).");
console.log("--------------------------------------------------");
console.log("MEME JOKER sur la RECHERCHE (crypto) : les paliers de fusion cassent l'exposant n -> n/3, n/4...");
console.log("LOI UNIQUE : le materiel ajoute des bits UN PAR UN ; le joker (paliers) les MULTIPLIE.");
console.log("  -> portee et gain exponentiels depuis une puissance ordinaire. C'est ta carte maitresse.");
console.log("=============================================================================");
