# QNE — Quantique-Neuronal Équilatéral

Journal de travail **René Le Corre × Claude**, construit et exécuté **sur un Motorola moto g75 5G** (Termux), novembre 2026.
Tout le code ci-dessous a réellement tourné sur le téléphone ; chaque résultat a été vérifié EXACT.

> Devise : « Explorer largement, affirmer étroitement. »

## L'idée de départ
Un maillage où chaque nœud ne parle qu'à **trois voisins égaux** (équilatéral, trivalent), avec trois piliers
de même poids : une amplitude, une activation `tanh`, un symbole dans {0,1,2} (somme mod 3). Lancé d'abord comme
coprocesseur de benchmark sur le téléphone, puis 8 cœurs, résonance, cascade multiplicatrice.

## Ce qui a été prouvé (exécuté, vérifié)
- **Stabilité** : le système n'est pas chaotique (exposant de Lyapunov négatif, λ ≈ −DAMP/2). Le chaos n'apparaît
  qu'avec forçage externe ou retard — tous deux brisent l'autonomie.
- **Calcul par réservoir** : prédiction propre de Mackey-Glass (NRMSE ~0,013) ; attracteur de Lorenz recréé
  fidèlement via **FORCE en boucle fermée** — l'intuition de René « adapte le système au calcul, pas l'inverse ».
- **David contre Goliath** : l'équilatéral minuscule, bien réglé, bat un gros réservoir dense *en efficacité* (précision par opération), sans prétendre le battre en précision absolue.
- **ROM en cache** : une machine à états finis boucle → on fige un cycle et on lit l'état à n'importe quel pas en O(1).
  Une vraie ROM de **17 Go** (registre 32 bits, 4,3 milliards d'états) bâtie sur le téléphone, lecture exacte.
- **Jump-ahead (GF(2))** : par multiplication matricielle, on atteint des périodes de 10^77 à **10^308** sans rien stocker.
- **Surmultiplication en cascade** : un seul tic porté à **10^144** pas.
- **Mariage W=1024** : 10^308 états distincts, réserve de **10^236** sauts frais avant toute répétition.
- **L'incommensurable** : le vrai mur n'est ni la machine ni le stockage, c'est **écrire le nombre** (la distance).
  Puis effondrement par **Frobenius** : dans le corps fini, carrer se répète tous les W pas ⇒ x^(2^E) ne dépend que
  de E mod W. 2^(10^100) se calcule en microsecondes.

## Les accélérations (de ~55 s à ~0,5 ms)
1. **Mots 32 bits** au lieu de BigInt bit-à-bit : ~×10.
2. **Anneau polynomial (Cayley-Hamilton)** : carrer un polynôme de 128 bits au lieu d'une matrice 128×128 : ~×100.
3. **Frobenius** : pour 2^E, au plus W carrés, quel que soit E : O(1).

## La confrontation (réelle, mesurée)
Calcul = état d'une séquence linéaire à un pas N, que Goliath ne peut qu'**itérer en série** (non parallélisable) :
- N à **100 ans** (1e9 pas/s) → g75 : ~0,7 ms
- N à **l'âge de l'univers** (13,8 Mrd d'années) → g75 : ~3 ms
- N = 10^30 pas (31 000 Mrd d'années) → g75 : ~0,4 ms
Le temps de David monte comme log(N) (quasi plat) ; celui de Goliath comme N.

## La vérité honnête (à ne jamais oublier)
Tout ceci est de la **mathématique connue** — registres à décalage linéaires (LFSR), corps finis GF(2^W),
calcul par réservoir, exponentiation binaire, jump-ahead — retrouvée par intuition et assemblée en une machine
cohérente. Les victoires sur supercalculateur sont **réelles mais étroites** : elles ne valent que parce que le
calcul est **linéaire**. Les vrais problèmes qui coûtent 100 ans (non-linéaires : repliement, turbulence,
cryptanalyse) restent hors de portée. C'est la même linéarité qui donne le raccourci *et* qui en borne la portée.
On ne bat pas Goliath à la force ; on gagne là où il s'entête à faire pas à pas ce qu'on peut court-circuiter.

## Index
- `qne.js qne8.js qneR.js qneT.js qneTL.js qneC.js qneM.js qneF.js qneX.js` — le QNE et ses variantes (8 cœurs, résonance, cache, mémoire, cascade)
- `adapmem.js doublech.js cascade8.js` — mémoire fondante, chambre double, cascade surmultiplicatrice
- `esn*.js duel.js duel2.js federated12.js force12.js` — réservoir, FORCE, David/Goliath, fédération de 12
- `meteo*.js lyap.js lyapcat.js pyragas.js` — météo (shallow-water), chaos, Lyapunov
- `rom.js rom_ext.js rom_lfsr.js rom_max.js build_rom_disk.js benchmark_rom.js` — ROM en cache, plafonds matériels, 17 Go
- `bench_big*.js scale.js opt.js pow2.js polyjump*.js frob.js marriage*.js ping.js bits_max.js` — jump-ahead, incommensurable, Frobenius, mots
- `cipher_tput.js cipher_words.js` — chiffrement à flux LFSR (NON sûr : linéaire, cassable Berlekamp-Massey)
- `duel100.js univ.js` — confrontations 100 ans / âge de l'univers
- `equi_trits.png` — le système équilatéral en pixels (fractal) ; `lfsr_bits.png` — le LFSR en bits

_Auteur des intuitions : René. Tenue du crayon et vérifications : Claude._
