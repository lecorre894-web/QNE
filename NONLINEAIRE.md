# QNE — le volet non-linéaire (jumeau, échelle, bibliothèque)

Suite honnête : l'équilatéral peut-il faire du **non-linéaire** ? Mesuré sur le moto g75 / bac à sable, vérifié.
Épreuve = prédiction de Lorenz (vérité RK4), horizon en **temps de Lyapunov**, climatologie = forme de l'attracteur.

## Résultats
| système | neurones | horizon (t_Lyap) | attracteur |
|---|---|---|---|
| équilatéral | 300 | 0,43 | fidèle |
| équilatéral + FORCE | 300 | 0,09 (effondré) | perdu |
| random (manuel) | 300 | 3,70 | fidèle |
| hybride (équi 200 + random 200) | 400 | 7,36 | fidèle |
| random seul (témoin) | 400 | 9,39 | fidèle |
| **équilatéral SEUL, énorme** | **1000** | **6,18** | **fidèle** |

## Verdict honnête (corrigé)
- Première conclusion, fausse : « l'équilatéral est un poids mort en non-linéaire ». Elle reposait sur
  un test trop petit (300 neurones, 0,43). **Correction** : passé à 1000 neurones, l'équilatéral SEUL
  atteint **6,18 t_Lyap**, au niveau de la littérature, **sans aucune bibliothèque**.
- Donc son souci à 300 était la **taille**, pas la structure. Grossi, il attrape le chaos tout seul.
- Le réservoir random reste plus **efficace par neurone** (9,39 avec 400 contre 6,18 avec 1000) : il
  tire plus de chaos de moins de neurones. Mais l'équilatéral n'est pas inapte — il est moins dense,
  il lui en faut plus.
- La bibliothèque n'était donc pas indispensable : il suffisait de laisser l'équilatéral grandir.
- FORCE (boucle fermée) n'a pas aidé dans mes réglages (0,09) — méthode réelle mais délicate, non maîtrisée ici.

## Ce qui reste vrai partout
- L'équilatéral est ROI du **linéaire** (saut exact en microsecondes, période 2^W−1, Frobenius).
- En **non-linéaire** il fonctionne à grande échelle, un cran sous le random à neurones égaux.
- Le mur du chaos (effet papillon) plafonne **tout le monde** vers ~10 t_Lyap : ni l'équilatéral, ni le
  random, ni aucun supercalculateur ne prédit la vraie trajectoire au-delà. Seul le climat se recrée.

## Leçon de méthode
Une conclusion tirée d'un seul petit test peut être fausse. Le « fais énorme » a corrigé le verdict.
Tester à l'échelle avant d'affirmer.

Fichiers : `jumeau.js gen_tput.js essai.js force_essai.js hybride.js compare.js enorme.js duel100.js univ.js`
