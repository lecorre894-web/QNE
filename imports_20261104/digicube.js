








"use strict";
const M=(1n<<64n)-1n;
function cell(x,y,z){
 let h=((x&M)*0x9E3779B97F4A7C15n ^ (y&M)*0xC2B2AE3D27D4EB4Fn ^ (z&M)*0x165667B19E3779F9n)&M;
 h^=h>>33n; h=(h*0xFF51AFD7ED558CCDn)&M; h^=h>>29n; h=(h*0xC4CEB9FE1A85EC53n)&M; h^=h>>32n;
 return Number(h)/18446744073709551616*2-1;
}
function stencil(x,y,z){
 return (cell(x+1n,y,z)+cell(x-1n,y,z)+cell(x,y+1n,z)+cell(x,y-1n,z)+cell(x,y,z+1n)+cell(x,y,z-1n))/6;
}
console.log("CUBE DIGITALISE — la cellule est une formule, pas une case memoire");
console.log("--------------------------------------------------");
for(const [nom,S] of [["2^20",1n<<20n],["2^100",1n<<100n],["2^1000",1n<<1000n]]){
 const x=S/2n+123n,y=S/3n+7n,z=S-9n;
 const t=process.hrtime.bigint();const v=cell(x,y,z);const st=stencil(x,y,z);const us=Number(process.hrtime.bigint()-t)/1000;
 const chiffres=Math.round(3*(S.toString(2).length-1)*0.30103);
 console.log("cote "+nom.padEnd(6)+" (~"+chiffres.toLocaleString("fr-FR")+" chiffres de cellules) : cell="+v.toFixed(5)+"  stencil="+st.toFixed(5)+"  ("+us.toFixed(0)+" us, 0 octet)");
}
console.log("--------------------------------------------------");
console.log("rappel : la version STOCKEE tapait le mur a 512^3 (2,1 Go).");
console.log("ici le cote peut etre 2^1000 : plus de cellules que d'atomes^10, et 0 octet, chaque cellule en microsecondes.");
console.log("HONNETE : ca marche pour un CHAMP (valeur = formule des coordonnees, statique ou a formule fermee).");
console.log("  Une dynamique NON-LINEAIRE qui tourne librement, elle, exige de calculer/stocker l'etat -> la, le mur revient.");
