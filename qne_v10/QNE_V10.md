# QNE V10 — Correction des matrices GF(2), API native pour Termux

## Etat et objectif

V9 a reussi 314 comparaisons sur le Motorola le 1er novembre 2026, mais le moteur matriciel JS compact y etait plus lent que la reference dense (`×0,55`). V10 apporte un module **Node-API C++** pour l'exponentiation des matrices 32×32 sur GF(2), puis recalcule le score de la batterie V9 en substituant les **mesures locales** de la famille matrices. **Le ×100 general reste un objectif non etabli.** La livraison est additive : elle ne modifie pas V2-V9 ni le depot distant.

## Installation

Prérequis : V9 deja installee dans `~/QNE/qne_v9`, avec un rapport `QNE_V9_RESULTATS.json` de statut PASSED pour obtenir un score multifamille.

```sh
pkg install -y unzip clang nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V10_Termux.zip
bash qne_v10/lancement_qne_v10.sh
```

Le compilateur utilise les headers Node-API locaux (`$PREFIX/include/node`), **sans node-gyp, npm, ni telechargement de dependances par le script**. En cas d'absence des headers, il s'arrete avec un message; aucun binaire Linux de la machine de developpement n'est livre.

Pour refaire V9 avant la calibration des matrices :

```sh
bash qne_v10/lancement_qne_v10.sh --refresh-v9
```

Pour un test court :

```sh
bash qne_v10/lancement_qne_v10.sh --quick
```

## API generale

Dans un module Node.js :

```js
const { power32, getSelection } = require('./qne_v10/qne_v10_matrix.js');
const M = new Uint32Array(32);
for (let i=0;i<32;i++) M[i] = (1 << i) >>> 0;
const result = power32(M, 1000000); // matrice identite^1000000
console.log(getSelection(), result);
```

Cette API prend une matrice `Uint32Array(32)` (un mot de 32 bits par ligne) et un exposant **entier sûr**, dans l'intervalle `[0, Number.MAX_SAFE_INTEGER]`. Calcul exact sur GF(2), retour `Uint32Array(32)`. Elle choisit la variante inscrite dans `QNE_V10_RESULTATS.json` seulement si la validation est PASSED; sinon natif si disponible, compact JavaScript en solution de repli. **La matrice d'entree n'est pas modifiee.**

## Validations et benchmarks

- Puissances `0,1,2,3,17,255,65537,1000000` et 16 matrices pseudoaleatoires identiques; resultat dense independant contre compact JS, C++ natif et API selectionnee.
- 384 comparaisons de resultat (3 alternatives × 8 exposants × 16 matrices), cinq tests de plage invalide et un controle d'identite : **390 controles** dans la validation locale complete.
- Sept passages alternes par moteur. Mesures independantes en temps par appel pour dense, compacte et natif. Seuil de selection : meilleur moteur seulement s'il bat la reference dense de 5 % au moins, sinon reference conservee.
- Cache LFSR, compilation et chargement initial natif non inclus dans les gains. Le benchmark matriciel mesure des appels repetes. Le score global prend les autres categories dans le fichier V9 local; c'est une **recomposition inter-tests**, pas un passage unique chronometre de bout en bout.

### Resultat de reference sur la machine de preparation (PAS Motorola)

| Element | Resultat |
|---|---:|
| Controles de validation | 390 PASS |
| Matrices 32×32 native / dense JS | ×35,77 |
| Matrices JS compact / dense JS | ×12,41 |
| Batterie V9 + matrice V10, score estime | ×5,01 |

Le score de reference depend des durees des autres familles du rapport V9 de la machine de preparation. Il ne doit pas etre compare directement au score V9 du Motorola (`×3,25`) : ce sont des machines et instants de mesure distincts.

## Limites

1. L'acceleration ne s'applique qu'aux matrices **32×32 GF(2)**, pas aux matrices reelles ou arbitraires.
2. Les benchmarks de cette famille comparent la reference dense JS a un moteur C++ natif. Ils ne prouvent pas un gain sur toutes les applications QNE.
3. La batterie reste synthetique; selection de ses poids et implementations de base peut modifier radicalement le score global. Aucun ×100 universel ne peut etre revendique.
4. La compilation du module Node-API utilise un ABI stable, mais doit etre controlee sur le Motorola pour valider le comportement et la vitesse reels.

## Contenu

- `qne_v10_matrix.js` : API selectionne automatiquement le moteur.
- `qne_matrix_napi.cpp` : implementation C++ Node-API, compilee dans Termux.
- `qne_v10.js` : verifications independantes, mesure alternee et rapport.
- `lancement_qne_v10.sh` : compilation et execution.
- `QNE_V10_RESULTATS_REFERENCE.json` : mesures de la machine de preparation.
- `SHA256SUMS.txt` : empreintes des fichiers distribues.

Les versions originales restent intactes. Aucune publication GitHub n'est effectuee automatiquement.
