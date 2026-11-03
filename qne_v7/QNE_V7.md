# QNE V7 — calcul temporel par blocs, exactitude binaire, profil local

## Objectif

Étendre QNE V6, sans remplacer les versions précédentes, et améliorer le calcul **numérique** de Lorenz-96 (RK4, float64, F=8, dt=0.01). Le facteur x100 sur le RK4 **n'est pas atteint**.

## Pourquoi V7 ?

En V6, un bloc (avec halos périodiques) calcule un seul pas RK4 avant d'écrire son état. La V7 peut calculer **2 ou 4 pas consécutifs** directement dans le même bloc, et ne réécrire la RAM principale qu'après le groupe temporel. La dépendance de chaque pas s'étend jusqu'à huit indices à gauche et quatre à droite : pour T pas, le halo initial est [-8T,+4T]. À chaque pas, la plage interne admissible rétrécit d'autant, puis les valeurs obtenues pour les sites cibles sont transférées vers le tableau de sortie.

- Deux tailles de blocs compilées séparément : **512** et **1024** valeurs.
- Deux modes de répartition : blocs entrelacés pour 512, plages contiguës pour 1024.
- Deux ou quatre threads persistants, selon l'option testée.
- **Opérations flottantes strictement ordonnées**, sans `-ffast-math`, sans fusion FMA (`-ffp-contract=off`). L'identité bit à bit est vérifiée contre QNE V4 pour un ensemble de cas, et les SHA-256 finaux sont comparés avant chaque mesure.
- Repli possible vers V6 ou V4 si V7 est plus lente sur la machine cible ; les dimensions inférieures à 131 072 conservent V4 dans le sélecteur par prudence, conformément aux mesures précédemment obtenues sur le Motorola.

Le blocage temporel ne remplace pas le RK4 par une formule raccourcie. Il effectue chaque étape, avec un travail redondant sur les halos afin d'obtenir exactement les mêmes valeurs sur les sites utiles.

## Tests accomplis sur l'environnement de développement (pas sur Motorola)

**336 comparaisons binaires réussies** : 16 tailles (dont frontières de blocs), de 2 à 4 graines, et sept variantes comparées à V4, avec 8 à 200 pas selon N.

Benchmark à sept répétitions alternées, médiane retenue, compilation Clang -O3 float strict. **Exemple mesuré** :

| Nombre de variables | Meilleur V6 (M/s) | Meilleur V7 (M/s) | Gain V7 / V6 |
|---:|---:|---:|---:|
| 131 072 | 335,40 | 502,12 | x1,50 |
| 262 144 | 391,72 | 556,88 | x1,42 |
| 1 048 576 | 394,41 | 536,16 | x1,36 |

Ces débits ne sont **pas** des résultats du Motorola. En V6, la capture utilisateur indiquait 246,82 M/s sur Motorola, avec deux threads et N=1 048 576. La V7 devra surpasser cette mesure localement pour être retenue.

## Installation Termux

Télécharger **QNE_V7_Termux.zip** dans Téléchargements puis :

```bash
pkg install -y unzip clang nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V7_Termux.zip
bash qne_v7/lancement_qne_v7.sh
```

Le script compile quatre exécutables natifs, vérifie les sorties et effectue sept répétitions alternées pour chaque configuration pertinente. Il crée :

- `qne_v7/QNE_V7_RESULTATS.json` : rapport local avec toutes les mesures, états de validation et chronométrages bruts ;
- `qne_v7/QNE_V7_PROFIL.json` : choix du moteur selon la dimension mesurée ;
- les fichiers sources et anciens moteurs ne sont pas modifiés.

Pour réduire la durée de calibration :

```bash
bash qne_v7/lancement_qne_v7.sh --quick
```

Pour vérifier uniquement les identités binaires :

```bash
bash qne_v7/lancement_qne_v7.sh --verify-only
```

Pour sélectionner automatiquement le moteur le plus rapide sur la dimension voisine de celle mesurée :

```bash
node qne_v7/qne_v7_select.js --bench 262144 30 7
node qne_v7/qne_v7_select.js --state 262144 10 1 > /tmp/qne_v7_state.bin
```

`--state` émet des octets binaires sur la sortie standard : ne pas l'afficher directement dans le terminal. Le nom du moteur choisi est indiqué sur la sortie d'erreur.

## Limites de la validation

Une empreinte SHA-256 identique vérifie l'égalité des sorties des moteurs pour les cas calculés, **pas** la fidélité exacte à la solution continue de Lorenz-96. Le débit peut changer en cas d'échauffement, de limitation thermique, de changement de fréquence ou de charge de fond. Les mesures de plusieurs tailles ne constituent pas un gain universel. Le x100 reste une cible non atteinte sur le RK4.
