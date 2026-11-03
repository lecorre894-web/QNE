# QNE V8 — tuilage temporel RK4 à huit pas, avec repli V7

## Statut et périmètre

Extension **additive** du projet QNE : ne remplace pas V2, V3, V4, V5, V6, V7 ni le dépôt GitHub. Même système Lorenz-96, `F=8.0`, `dt=0.01`, `float64`, RK4, sans `-ffast-math` et sans contraction FMA (`-ffp-contract=off`).

V8 conserve les noyaux V4 et V7 comme références et essaie le tuilage **T=8** avec halo temporel de huit sites à gauche et quatre sites à droite *par pas RK4*. Le calcul réalise effectivement chaque étape RK4 : les calculs redondants aux halos servent à préserver l'identité numérique sur la zone cible. Deux largeurs de tuiles (1024, 2048) et deux nombres de threads (2, 4) sont comparés.

La sélection V8 retient V4 pour les petites dimensions (`N < 131072`, conformément aux mesures du Motorola), et ne retient une nouvelle variante V8 pour les grandes dimensions que si sa médiane est au moins 5 % plus rapide que le meilleur moteur historique V4/V7. Le profil est calculé **sur l'appareil local**. Si aucune amélioration suffisante n'est observée, V7 (ou V4) reste le moteur sélectionné. Le profil pour des dimensions non testées choisit la taille mesurée la plus proche en échelle logarithmique ; le meilleur moteur réel hors de ces points n'est pas garanti.

## Validation x86-64 réalisée le 1er novembre 2026

- **360 comparaisons binaires réussies** : 16 dimensions, 60 jeux dimension/graine/pas, six alternatives V7/V8 contre V4 ; y compris des frontières de blocs et un million de variables.
- **Sept répétitions alternées** sur six dimensions pour le benchmark ; SHA-256 final concordant avant chaque mesure.
- `VALIDATION : PASSED`. Les valeurs ci-dessous ne sont **pas** des résultats du Motorola.

| N | Meilleure V7 (M/s) | Meilleure V8 (M/s) | V8/V7 | Moteur retenu |
|---:|---:|---:|---:|---|
| 131 072 | 389,90 | 524,03 | x1,34 | V8 t4, T8, blocs 1024 |
| 262 144 | 472,45 | 537,30 | x1,14 | V8 t4, T8, blocs 2048 |
| 1 048 576 | 549,18 | 558,89 | x1,02 | **V7** (gain insuffisant, seuil 5 %) |

Les résultats x86-64 dépendent du processeur, de la mémoire, de la concurrence sur l'hôte et de la température. Ils ne prédisent pas directement le gain sur Android. L'objectif x100 sur le jumeau non linéaire n'est pas atteint.

## Installation sur Android / Termux

Après avoir téléchargé l'archive dans Téléchargements :

```bash
pkg install -y unzip clang nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V8_Termux.zip
bash qne_v8/lancement_qne_v8.sh
```

`--quick` réduit la calibration à trois répétitions ; `--verify-only` vérifie l'identité binaire sans benchmark ; `--bench-only` mesure sans relancer la suite de validation (à utiliser uniquement après une validation).

Sorties créées **localement** : `qne_v8/QNE_V8_RESULTATS.json` et `qne_v8/QNE_V8_PROFIL.json`.

Pour exécuter le moteur choisi automatiquement d'après le profil du Motorola :

```bash
node qne_v8/qne_v8_select.js --bench 262144 30 7
node qne_v8/qne_v8_select.js --state 262144 10 1 > /tmp/qne_v8_etat.bin
```

Attention : le mode `--state` émet des octets binaires ; il ne faut pas l'afficher directement dans la console.

## Ce que signifient les résultats

`SHA256 OK` signifie que les tableaux binaires produits pour les cas vérifiés sont identiques à ceux de la référence V4. Cela ne prouve pas que l'intégration numérique correspond exactement à la solution continue d'une équation différentielle. Le x100 ne peut être revendiqué qu'en comparant le **même N, les mêmes pas, les mêmes précisions et le même matériel**. L'exécution de V8 sur Motorola n'a pas encore été mesurée dans ce rapport.
