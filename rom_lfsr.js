"use strict";
// LFSR de Galois 16 bits, taps primitifs 0xB400 -> période maximale 2^16-1
function periodLFSR(bits,mask){const start=1;let s=start,n=0;do{const lsb=s&1;s>>=1;if(lsb)s^=mask;n++;}while(s!==start&&n<(1<<bits)+5);return n;}
const p16=periodLFSR(16,0xB400);
console.log("Vérif LFSR 16 bits : période mesurée = "+p16+"  (attendu 65535 = 2^16-1) -> "+(p16===65535?"MAXIMALE ✓":"non max"));
console.log("==================================================");
console.log("Carte mémoire d'une ROM à période maximale (période = 2^W - 1) :");
function tier(b){if(b<32n*10n**6n)return "cache (≤32 Mo)";if(b<64n*10n**9n)return "RAM étendue (≤64 Go, ta tour)";if(b<8n*10n**12n)return "disque NVMe (≤8 To)";if(b<10n**24n)return "au-delà d'un datacenter";return "AU-DELÀ de toute la mémoire sur Terre";}
function human(b){if(b<10n**6n)return b.toString()+" o";if(b<10n**9n)return (Number(b/10n**3n)/1e3).toFixed(1)+" Mo";if(b<10n**12n)return (Number(b/10n**6n)/1e3).toFixed(1)+" Go";if(b<10n**15n)return (Number(b/10n**9n)/1e3).toFixed(1)+" To";if(b<10n**18n)return (Number(b/10n**12n)/1e3).toFixed(1)+" Po";return "~10^"+(b.toString().length-1)+" octets";}
for(const W of [20,24,30,36,40,45,50,60,80]){
 const period=(2n**BigInt(W))-1n, bps=BigInt(Math.ceil(W/8)), bytes=period*bps;
 console.log("W="+String(W).padStart(2)+"  période=2^"+W+"-1 ≈ "+period.toString().length+" chiffres  ROM="+human(bytes).padStart(12)+"  -> "+tier(bytes));
}
console.log("--------------------------------------------------");
console.log("La frontière honnête : la richesse (longue période) et le stockage s'opposent.");
console.log("ROM stockable (cache→RAM→disque) => dynamique courte. Dynamique infinie => ROM instockable, il FAUT calculer.");
