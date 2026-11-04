








"use strict";
const B=[
["I. BRIQUES DE BASE",[
 ["xorari.js","XOR = addition sans retenue ; continu, toute base, polynomes"],
 ["parite.js","decomposition pair/impair d'une fonction + indices (moteur FFT)"],
 ["softbits.js","bits continus et contributifs (derivables)"],
 ["afficher.js","afficher des nombres incommensurables (scientifique, tours)"]]],
["II. CALCUL NUMERIQUE",[
 ["solveur.js","solveur universel : lineaire, racine, integrale, EDO, interpolation, convolution, modulaire"],
 ["gf2sci.js","GF(2) materialise en calcul scientifique reel/continu"],
 ["stab.js","stabilisation universelle (renorm) : tout calcul borne, lineaire ou non"],
 ["stress.js","banc de stress : FFT, valeurs propres, factorisation, tri, matmul"]]],
["III. LE MOTEUR QNE",[
 ["micronoyau.js","l'atome : mulx (decalage + XOR) dont tout le reste decoule"],
 ["noyau.js","le noyau complet : toutes les briques dans un objet QNE reutilisable"],
 ["ordinateur2.js","les deux jumeaux (lineaire + non-lineaire) a alimentation adaptative"],
 ["pc.js","le PC assemble : test lourd lineaire / non-lineaire / bits"]]],
["IV. MEMOIRE & BITS INCOMMENSURABLES",[
 ["vrom3.js","memoire virtuelle (petaoctet, 0 stockage reel, sondage f2fs)"],
 ["dedup.js","deduplication : capacite decuplee"],
 ["digicube.js / geo.js","cellules generatives (0 octet), geometrie variable 1D->4D"],
 ["confront2.js","saut a une position incommensurable + affichage en tour"]]],
["V. CRYPTOGRAPHIE & STRUCTURE",[
 ["crypto2.js","ecole de crypto : 1 bit=1 doublement, PoW, avalanche, Diffie-Hellman, anniversaires"],
 ["mitm.js / recette.js","rencontre au milieu ; recettes 128/256 bits reels"],
 ["ktree.js","le JOKER : attaque par paliers (exposant n -> n/3)"],
 ["bsgs.js / rho.js","log discret : pas de bebe/geant ; auto-collision (memoire constante)"],
 ["facto.js / factomult.js","factorisation : difference de carres + multiplicateurs"],
 ["casse.js / hensel.js","cassage par linearite (Berlekamp-Massey) ; relevement de Hensel"]]],
["VI. LES MURS (le plus complexe)",[
 ["duel2.js","structure vs force brute : les trois zones honnetes"],
 ["sat.js","solveur SAT : triplets pythagoriciens booleens"],
 ["cubes.js","sommes de trois cubes : resultats trouves par machine (42, 33)"],
 ["inimaginable.js","tetration, pentation, Graham, TREE : le langage plie avant le nombre"],
 ["bb.js","CASTOR AFFAIRE : le calcul le plus complexe, indecidable. Le sommet."]]]
];
console.log("##################################################################");
console.log("#   BIBLIOTHEQUE QNE — TABLEAU DES MATIERES (simple -> complexe)  #");
console.log("##################################################################");
for(const [titre,items] of B){console.log("\n"+titre);for(const [nom,desc] of items)console.log("   "+nom.padEnd(26)+" "+desc);}
console.log("\n------------------------------------------------------------------");
console.log("du XOR a l'indecidable : une seule logique, 'ramener a des nombres et de l'algebre'.");
console.log("socle commun : noyau.js (l'objet QNE). Tout le reste se branche dessus.");
