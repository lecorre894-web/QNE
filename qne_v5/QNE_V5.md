# QNE V5 — moteur Lorenz-96 RK4 natif par blocs

## Objectif

Accélérer Lorenz-96 sans modifier ni les équations RK4, ni F=8, DT=0,01, ni l'ordre des opérations flottantes. L'objectif de gain ×100 sur le **moteur non linéaire** est une cible de recherche : **non atteint**.

## Principe algorithmique

- V4 calcule chaque étape RK4 par passages globaux sur plusieurs tableaux de longueur N.
- V5 traite les variables par blocs de 512, avec halos périodiques pour respecter les voisins sur les quatre stades RK4.
- Les quatre stades et les accumulations RK4 conservent les mêmes expressions et le même ordre d'arrondi en double précision.
- V5 produit sa sortie dans un tampon distinct : aucune valeur mise à jour ne peut contaminer l'entrée du pas courant.
- Pour N < 8192, V5 garde un chemin direct afin d'éviter le surcoût des halos.
- `-ffp-contract=off -fno-fast-math` évitent notamment les différences de résultat liées aux contractions FMA et aux transformations algébriques non strictes.
- Un seul thread ; aucun GPU, accélérateur ou réduction de nombre de pas utilisé.

## Tests

Exécuter `bash qne_v5/lancement_qne_v5.sh` depuis la racine QNE. Le script compile les deux sources C++ contenues dans le dossier V5, puis vérifie leurs états complets **octet par octet**, pour 18 tailles et quatre graines par taille, avec plusieurs pas RK4. Une empreinte SHA-256 est inscrite dans le rapport pour chaque cas qui passe.

Cinq tailles sont mesurées (40, 4096, 65536, 262144 et 1048576), sept répétitions par moteur avec alternance de l'ordre, et cinq pas d'amorçage hors chronométrage. Les temps correspondent uniquement au coeur du calcul natif. Les modes `--verify-only`, `--bench-only` et `--quick` sont acceptés par `qne_v5.js` via le script.

Le rapport est `qne_v5/QNE_V5_RESULTATS.json`. `QNE_V5_RESULTATS_REFERENCE.json` contient seulement les valeurs obtenues sur l'environnement de développement x86-64 : ce ne sont pas des mesures du Motorola.

## Notes importantes

- Le rendement de V5 dépend de la taille du système, des caches et du processeur. Les améliorations x86-64 **ne préjugent pas** des résultats ARM64.
- Une validation bit-à-bit contre V4 ne démontre pas une précision analytique absolue de la résolution différentielle.
- Le gain du jumeau linéaire précalculé ne s'applique pas au jumeau non linéaire.
- Pour évaluer un éventuel gain « ×100 », préciser la référence : V3, V4, ou calcul original, et conserver exactement le même problème résolu.
- Le dossier est **additif** ; il ne touche ni QNE V2, ni V3, ni V4, ni aux fichiers canoniques.

## Installation Termux

```sh
pkg install -y unzip clang nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V5_Termux.zip
bash qne_v5/lancement_qne_v5.sh
```
