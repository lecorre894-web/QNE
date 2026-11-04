








"use strict";
const tour=(h)=> h===0?"1": h===1?"10": "10^".repeat(h-1)+"10";
console.log("DE L'INCOMMENSURABLE A L'INIMAGINABLE");
console.log("--------------------------------------------------");
console.log("[1] TETRATION 10^^n = tour de n dizaines :");
for(let n=1;n<=6;n++)console.log("    10^^"+n+" = "+tour(n)+(n===2?"  = 10 milliards":n===3?"  (deja > atomes de l'univers)":""));
console.log("    ...");
console.log("    notre plus gros affiche, 2^(10^100000) ~ 10^(10^99999), n'est qu'une tour de HAUTEUR 3.");
console.log("--------------------------------------------------");
console.log("[2] on fait grimper la HAUTEUR a volonte (on ne stocke qu'un nombre : la hauteur) :");
console.log("    10^^100       = tour de 100 etages");
console.log("    10^^(10^100)  = tour haute d'un GOOGOL d'etages (deja inimaginable, mais encore descriptible)");
console.log("--------------------------------------------------");
console.log("[3] LA FRONTIERE (au-dela de toute tour) :");
console.log("    PENTATION 10^^^3 = 10^^(10^^10) : une tour dont la HAUTEUR est elle-meme une tour de 10 etages.");
console.log("    NOMBRE DE GRAHAM : part de 3^^^^3 (deja hors de toute tour imaginable), repete 64 fois ;");
console.log("      a chaque etage le NOMBRE de fleches est le nombre precedent. Fini, bien defini, utilise dans une vraie preuve.");
console.log("    TREE(3) : rend le nombre de Graham ridiculement petit. Fini lui aussi.");
console.log("--------------------------------------------------");
console.log("HONNETE : notre PC affiche jusqu'aux TOURS (tetration : on stocke la hauteur).");
console.log("  Au-dela (Graham, TREE), on ne peut plus que NOMMER la construction (les fleches), pas la tourer.");
console.log("  La vraie limite n'est plus la memoire ni le temps : c'est le LANGAGE qui plie avant le nombre.");
