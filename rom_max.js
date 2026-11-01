"use strict";
// Construit une VRAIE ROM LFSR (W=24) en mémoire, puis lit n'importe quel pas en O(1).
const W=24, mask=0x80000D>>>0;           // polynôme 24 bits
const start=1>>>0; let s=start;
const t0=process.hrtime.bigint();
// période d'abord
let period=0; do{const lsb=s&1;s>>=1;if(lsb)s^=mask;period++;}while(s!==start&&period<=(1<<24)+5);
// construit la ROM (registre à chaque pas)
const ROM=new Uint32Array(period); s=start;
for(let i=0;i<period;i++){ROM[i]=s;const lsb=s&1;s>>=1;if(lsb)s^=mask;}
const ms=Number(process.hrtime.bigint()-t0)/1e6;
const bytes=period*4;
// vérif : pas direct M vs ROM
const M=1234567; let sv=start; for(let i=0;i<M%period;i++){const lsb=sv&1;sv>>=1;if(lsb)sv^=mask;}
const okV = sv===ROM[M%period];
// lecture O(1) au pas 10^15
const N=10n**15n, idx=Number(N%BigInt(period));
console.log("ROM LFSR W="+W+"  période="+period.toLocaleString("fr-FR")+(period===(1<<24)-1?" (MAXIMALE ✓)":" (non max)"));
console.log("taille ROM construite : "+(bytes/1e6).toFixed(1)+" Mo, bâtie en "+ms.toFixed(0)+" ms");
console.log("vérif pas "+M+" (direct vs ROM) : "+(okV?"EXACT ✓":"ERREUR"));
console.log("état (registre) au pas 10^15 = "+ROM[idx]+"  (index "+idx+", lu en O(1))");
console.log("==================================================");
console.log("PLAFOND RÉEL par matériel (ROM max = période × octets/état) :");
function maxW(limitBytes){let best=0;for(let W=8;W<=64;W++){const bps=BigInt(Math.ceil(W/8));const rom=(2n**BigInt(W)-1n)*bps;if(rom<=limitBytes)best=W;}return best;}
for(const [nom,lim] of [["moto g75 (RAM ~8 Go)",8n*10n**9n],["tour (RAM 64 Go)",64n*10n**9n],["tour (NVMe 8 To)",8n*10n**12n]]){
 const Wm=maxW(lim),per=2n**BigInt(Wm)-1n,rom=per*BigInt(Math.ceil(Wm/8));
 console.log("  "+nom.padEnd(22)+" -> W max="+Wm+"  période="+per.toLocaleString("fr-FR")+" états  ROM="+(Number(rom/10n**9n)).toLocaleString("fr-FR")+" Go");
}
console.log("--------------------------------------------------");
console.log("Au maximum de ta tour : un cycle de ~1000 milliards d'états figé sur disque, et le pas 10^(n'importe quoi) lu instantanément dedans.");
