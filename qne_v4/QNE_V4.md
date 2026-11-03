# QNE V4 — Moteur natif strict + benchmark des deux jumeaux

## Objectif et statut (2026-11-01)

Objectif utilisateur: gain x100 en restant mathematiquement/numeriquement valide.

- **Jumeau lineaire LFSR (GF(2^128))**: gain algorithmique mesure en local de x842 709 (mediane) contre 1 048 576 pas directs. L'appel du saut utilise un cache calcule a l'import (precalcul **exclu du chrono**). Validation du meme etat final. Ce gain est restreint a la recurrence lineaire et a cet horizon et cet etat initial, et ne peut pas etre extrapole au systeme Lorenz-96.
- **Jumeau non lineaire Lorenz-96 RK4**: backend C++ natif strict; gain moyen par taille x2.13–x4.02 sur cet environnement; **x100 NON ATTEINT**. Comparaison **bit a bit** avec JS V3 sur 32 cas et comparaison des empreintes SHA256 apres le benchmark.

## Fichiers

- `qne_v4_native.cpp` : code C++17, double, 4 tableaux de N doubles, memes DT=0.01 et F=8.
- `qne_v4.js` : verification V3 vs C++ et benchmark chronometre en 7 repetitions (ordre alterne) ; genere `QNE_V4_RESULTATS.json`.
- `qne_v4_lineaire.js` : benchmark special du saut LFSR; genere `QNE_V4_LINEAIRE_RESULTATS.json`.
- `qne_v3.js`, `qne_v2.js` : copies de reference autonomes pour benchmark seulement; **aucun fichier QNE existant n'est ecrase**.
- `lancement_qne_v4.sh` : compile strictement le moteur puis lance les validations.
- `QNE_V4_RESULTATS_REFERENCE.json`, `QNE_V4_LINEAIRE_REFERENCE.json` : mesures localement executees sur Intel Xeon et Node v22 (ne representent PAS le telephone Motorola).

## Termux

Prérequis: `pkg install clang nodejs`. Une archive `.tar.gz` contenant le dossier `qne_v4/` est installee **dans `~/QNE/qne_v4`**, et non en remplacement du projet.

```bash
cd ~/QNE
tar -xzf ~/storage/downloads/QNE_V4_additif.tar.gz
bash qne_v4/lancement_qne_v4.sh
node qne_v4/qne_v4_lineaire.js
```

Pour la verification sans les chronometres : `bash qne_v4/lancement_qne_v4.sh --verify-only`.

## Regles de reproductibilite

Compilation: `clang++ -O3 -std=c++17 -ffp-contract=off -fno-fast-math`.

- Le code natif effectue les memes pas RK4 avec association arithmetique conservee (pas de FMA ni de fast-math).
- Validation des 32 combinaisons de dimensions/graines avec `Buffer.equals`, sur les bits `Float64` des etats, pas seulement une tolerance numerique.
- Chaque benchmark controle une empreinte SHA256 de l'etat final (meme horizon, incluant 5 pas de chauffe).
- 7 repetitions et medians ; temps natif mesure a l'interieur du processus C++ (compilation et lancement exclus), JS mesure via performance.now() (warmup V8 avant les essais).
- Les temps pris sur processeurs differents ne doivent pas etre compares directement.
- Le facteur x100 ne peut pas etre annonce pour le jumeau non lineaire sans mesures reelles a precision et travail egaux.

## Limites

La comparaison bit a bit avec le code V3 valide l'equivalence de ces deux implementations dans les cas testes, pas l'exactitude analytique du modele Lorenz-96. Les tests ne prouvent pas une acceleration x100 du systeme entier. Le gain du saut LFSR inclut l'utilisation d'un cache qui existe deja dans V2; il ne represente donc pas un nouveau gain additionnel V4/V3 pour cette operation.
