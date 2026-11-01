# QNE — du mime au calcul

Décision de René : « je ne veux plus qu'il mime ». Ce document grave le passage du **substitut** (qui
rejoue ce qu'il a appris) au **calculateur** (qui résout les équations, exactement, sans apprentissage).

## 1. Le mime (réservoir) sur Lorenz-96, 40 dimensions
Horizon de prédiction, en temps de Lyapunov :
- réservoir global 800 neurones : 0,17
- équilatéral local partagé, brut : 0,30
- équilatéral local **réglé** (fuite, fenêtre ±4, entrée en lecture, Nr=300) : **1,29**
Le réglage (ingénierie, pas concept) a multiplié par ~4. Mais ça reste un mime : il a fallu calculer
le vrai L96 pour le lui apprendre, et le mur du chaos (effet papillon) plafonne tout le monde.

## 2. Le calculateur (intégration exacte, RK4) — PAS un mime
`calcul.js`, `calcul_max.js` : intégration directe de Lorenz-96 pour n'importe quel N, exacte,
aucune donnée apprise, n'importe quelle condition initiale.
- débit : **16–19 millions de maj-variable/s**, stable avec la taille
- plafond mesuré : **50 M variables (1,6 Go)** en bac à sable ; ~200 M attendu sur un téléphone 8 Go
- un seul pas = O(N) ; pas de raccourci en non-linéaire, on paie comme tout le monde

## Verdict honnête complet
- **Linéaire** : l'équilatéral calcule EXACTEMENT et avec un raccourci (saut-Frobenius). Exceptionnel, bat la force brute. N'a jamais mimé.
- **Non-linéaire, calcul exact** : le téléphone est un **supercalculateur miniature** — même maths,
  16-19 M maj/s, dizaines de millions de variables. La seule différence avec un supercalculateur est
  l'ÉCHELLE (il en tient des milliards à 10^9-10^12 maj/s), pas la nature.
- **Non-linéaire, prédiction** : le mur du chaos borne tout le monde à quelques temps de Lyapunov,
  mime ou calcul, téléphone ou supercalculateur.

Fichiers : `calcul.js calcul_max.js l96.js l96loc.js l96tune.js`
