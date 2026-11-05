








'use strict';
// QNE LASER — le miroir a une LOUPE : la reflexion AMPLIFIE (c'est un vrai laser).
// On montre honnetement ce que le gain change... et ce qu'il ne change pas.
// Tout en log10 de l'intensite (L) pour encaisser l'astronomique.
const show=L=>{
 if(!isFinite(L))return 'deborde';
 if(L<6)return 'I ~ '+Math.pow(10,L).toExponential(2);
 if(L<1e6)return 'I ~ 10^'+L.toFixed(0)+'  ('+Math.round(L)+' chiffres)';
 return 'I ~ 10^(10^'+Math.log10(L).toFixed(2)+')   (tour de puissances)';
};
console.log('================= QNE LASER (miroir a loupe) =================');
console.log('');
console.log('A. MIROIR SEUL (gain = 1) : la lumiere rebondit, rien ne naît.');
{let L=0; for(let n=0;n<64;n++)L+=Math.log10(1.0); console.log('   apres 64 rebonds : '+show(L)+'   -> BORNE');}
console.log('');
console.log('B. MIROIR + LOUPE constante (gain = 2) : chaque passage DOUBLE.');
{let L=0; for(let n=0;n<256;n++)L+=Math.log10(2); console.log('   apres 256 rebonds : '+show(L)+'   -> EXPONENTIEL (niveau f_2)');}
console.log('');
console.log('C. LOUPE QUI GROSSIT AVEC LE FAISCEAU (gain croit avec I) :');
console.log('   log(gain) = 0.3 x L   ->   L_{n+1} = 1.3 x L_n');
{let L=1; for(let n=1;n<=40;n++){L*=1.3; if(n%8===0)console.log('   rebond '+String(n).padStart(2)+' : '+show(L));}
 console.log('   -> SUR-EXPONENTIEL : chaque etage ecrase le precedent (vers la tetration, f_3+)');}
console.log('');
console.log('D. LA PHYSIQUE HONNETE : un vrai milieu a gain a une ENERGIE FINIE.');
console.log('   le gain retombe quand le milieu se vide -> SATURATION, pas l infini.');
{let L=0,g=2.0; for(let n=0;n<200;n++){L+=Math.log10(g); g=1+(g-1)*0.95;} console.log('   apres 200 rebonds, pompe epuisee : '+show(L)+'   -> PLATEAU');}
console.log('');
console.log('E. CE QUE LA LOUPE CHANGE... ET CE QU ELLE NE CHANGE PAS :');
console.log('   - Elle change la VITESSE : borne -> exponentiel -> tetration. Enorme, reel.');
console.log('   - Elle NE change PAS le MONDE : une loupe suit une loi FIXE, donc tout');
console.log('     ceci reste CALCULABLE -> sous le Busy Beaver -> infiniment sous omega_1^CK.');
console.log('   Pour passer au transfini, il ne faut pas un faisceau plus rapide :');
console.log('   il faut changer la LOI de la loupe a chaque tour (une bibliotheque neuve).');
console.log('   Le gain accelere dans le monde calculable ; seul, il n en sort jamais.');
console.log('=============================================================');
