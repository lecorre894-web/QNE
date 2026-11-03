# QNE V6 — hybride direct / blocs parallèles, validation binaire

**Statut** : extension expérimentale additive, destinée à Termux Android et Linux. Aucune modification des scripts QNE V2–V5 ni des sources canoniques.

## Observations réelles sur Motorola (captures de l'utilisateur)

En V5, `VALIDATION : PASSED` et empreintes SHA-256 concordantes :

| N | V4 (M mises à jour/s) | V5 (M mises à jour/s) | V5/V4 |
|--:|--:|--:|--:|
| 40 | 190,89 | 163,64 | 0,86 |
| 4 096 | 209,36 | 208,28 | 0,99 |
| 65 536 | 174,41 | 135,79 | 0,78 |
| 262 144 | 94,77 | 129,83 | 1,37 |
| 1 048 576 | 78,46 | 130,15 | 1,66 |

Ces mesures motivent un **choix adaptatif**, plutôt qu'un remplacement global de V4 par V5.

## V6

- `qne_v6_native.cpp` : même schéma RK4 et mêmes opérations flottantes que V4/V5 (double IEEE 754, `F=8.0`, `dt=0.01`) ; chemin direct si `N<131072`, sinon blocs de 512 éléments, halos périodiques, sortie séparée, 1/2/4 threads persistants. Les threads ne partagent ni sommes réduites ni zones d'écriture.
- `qne_v4_native.cpp` et `qne_v5_native.cpp` : copies figées dans ce paquet pour compiler et comparer sur une base identique ; **aucun remplacement** des fichiers du dépôt QNE.
- `qne_v6.js` : comparaison octet par octet de V4 avec V5 et V6 (1/2/4 threads), 12 dimensions, 4 graines, puis benchmark alterné à 7 répétitions (3 en `--quick`). Sauvegarde du rapport et du profil de sélection.
- `qne_v6_select.js` : après calibration, envoie une exécution complète vers le moteur le plus rapide mesuré à la dimension la plus proche sur une échelle log2. Sans profil, utilise V4 avant 131072 variables et V5 à partir de 131072.
- `lancement_qne_v6.sh` : compile avec `clang++ -O3 -std=c++17 -ffp-contract=off -fno-fast-math -pthread` puis lance la validation et les benchmarks.

La sélection est une heuristique fondée sur les points réellement mesurés. Elle n'est pas une preuve d'optimalité pour les tailles intermédiaires ni un engagement de performance stable lors d'une chauffe thermique.

## Installation Termux

Télécharger `QNE_V6_Termux.zip`, puis :

```bash
pkg install -y unzip clang nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V6_Termux.zip
bash qne_v6/lancement_qne_v6.sh
```

Résultats : `~/QNE/qne_v6/QNE_V6_RESULTATS.json` et `~/QNE/qne_v6/QNE_V6_PROFIL.json`.

Utilisation du profil :

```bash
node qne_v6/qne_v6_select.js --bench 262144 30 7
node qne_v6/qne_v6_select.js --state 4096 40 1 > /tmp/qne_state.bin
```

La commande `--state` écrit des doubles binaires sur `stdout`, la sélection sur `stderr`. Ne pas l'exécuter sans redirection du `stdout`.

Pour raccourcir la calibration : `bash qne_v6/lancement_qne_v6.sh --quick`. Validation sans benchmark : `--verify-only`.

## Validations de référence (environnement local de l'assistant, pas le Motorola)

- **192 comparaisons** exactes : 12 tailles × 4 graines × 4 moteurs alternatifs (V5, V6 1 thread, V6 2 threads, V6 4 threads) contre V4.
- Benchmarks alternés à trois répétitions, même état final binaire, compilation préalable. Dans cet environnement, gain maximal observé **5,44×** contre V4 à `N=1048576` (comparaison V6 4 threads). Résultats non transposables directement au téléphone.
- Le facteur **×100 n'est pas atteint** pour le RK4 Lorenz-96. Le saut algébrique LFSR relève d'un autre problème.
- L'identité des sorties pour un ensemble fini de cas ne prouve pas que l'intégrateur est mathématiquement exact pour l'équation différentielle continue.

## Précautions

Les benchmarks multithread peuvent échauffer le téléphone ; ne pas utiliser des temps trop longs ni exécuter en cas de forte chauffe. Si V6 multithread est moins performant, le profil désigne V4 ou V5. Les fichiers de profils sont locaux au téléphone : les profils de la machine de développement ne sont pas inclus dans l'archive.
