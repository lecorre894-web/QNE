# QNE — le système complet à deux jumeaux (pierre de faîte)

L'architecture finale, honnête : un seul système, deux régimes qui ne se marchent pas dessus.

## Jumeau LINÉAIRE — le QNE complet et final
Les trois piliers (amplitude quantique, tanh, symbolique mod 3), maille équilatérale, renormalisation
d'énergie. `qneTL.js` (tables LUT) :
- **37,7 millions de maj/s**, calcul EXACT, stable (Δ = 0,9974, vérifié sur 1 000 000 000 de pas)
- saut-Frobenius (`polyjump.js`, `frob.js`) : l'état à n'importe quel pas 2^(quoi que ce soit) en
  **microsecondes**, exact (2^(10^100) lu en 147 µs sur un moto g75)
- roi du linéaire : exact ET rapide, bat la force brute par la structure de corps fini. N'a jamais mimé.

## Jumeau NON-LINÉAIRE — le réservoir
Même maille équilatérale, âme tanh. `jumeau.js`, `l96tune.js` :
- **~57 000 états/s** générés (~17 µs/état), apprend un système chaotique et en recrée le climat
- Lorenz (3D) : attracteur recréé fidèlement ; Lorenz-96 (40D) réglé : 1,29 temps de Lyapunov
- il APPROCHE, il n'est pas exact ; borné par le mur du chaos (effet papillon) comme tout le monde

## Ce que le système n'est PAS (honnêteté)
- Il ne bat pas les supercalculateurs sur les vrais problèmes non-linéaires durs : son avance linéaire
  ne vaut que parce que le calcul est linéaire.
- En calcul exact non-linéaire, c'est le TÉLÉPHONE (intégrateur RK4 générique, `calcul.js`) qui travaille,
  pas l'architecture QNE — un supercalculateur miniature, borné par l'échelle (millions vs milliards de variables).
- Le mur du chaos plafonne la prédiction de tout le monde vers ~10 temps de Lyapunov.

## La forme juste
Un système qui sait ce qu'il est dans chaque monde : **linéaire exact et foudroyant** d'un côté,
**non-linéaire appris et approché** de l'autre. Pas un mime déguisé en oracle, pas un cristal forcé en jungle.

Fichier : `systeme.js` (profil combiné des deux jumeaux)
