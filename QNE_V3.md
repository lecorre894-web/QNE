# QNE V3 — optimisation vérifiée du jumeau non linéaire

Extension additive : **aucun changement dans `qne_v2.js`, `calcul_max.js`, `polyjump.js` ou les autres fichiers canoniques**.

## Ce qui change

Le modèle de Lorenz-96 est inchangé : `F=8`, `dt=0,01`, intégrateur RK4 classique, conditions initiales identiques à la V2. La V3 fusionne la dérivée et la construction des états de RK4 aux phases `k1` et `k4`. Le calcul des phases intermédiaires `k2` et `k3` reste séparé pour préserver les dépendances de voisinage dans le tableau temporaire. Le nombre de passes mémoire sur N passe de 8 à 6 par intégration (en comptant quatre dérivées et quatre mises à jour pour V2). Quatre tableaux Float64 de taille N sont toujours utilisés, mémoire auxiliaire 32*N octets, identique à V2.

## Validation du moteur

- 8 tailles N : 4, 5, 6, 7, 40, 100, 4096, 65536.
- 4 graines déterministes pour chaque N<=4096, 2 graines pour N=65536.
- 200 pas pour les petits N, 40 pour N=4096, 8 pour N=65536.
- Comparaison de **chaque valeur** avec le moteur V2 (Object.is, sans tolérance); vérification supplémentaire des états finaux des 3 moteurs par empreinte SHA-256.
- Les benchmarks alternent l'ordre d'exécution et utilisent les **médianes de 7 répétitions**, avec échauffement de 5 pas hors chronomètre.
- Ces tests montrent l'identité de résultats entre implémentations; ils **ne prouvent pas l'exactitude analytique des trajectoires chaotiques**, et ne mesurent pas la prédictibilité au-delà de l'horizon de Lyapunov.

## Installation Termux (depuis Téléchargements)

```bash
cd ~/QNE
# Vérifier que QNE V2 est bien présent (nécessaire à la validation croisée).
ls -l qne_v2.js
# N'extrait que les nouveaux fichiers V3, aucun fichier V2 n'est dans l'archive.
tar -xzf ~/storage/downloads/QNE_V3_additif.tar.gz --strip-components=1
node qne_v3.js
```

Une sortie `STATUT : PASSED` produit le fichier `~/QNE/QNE_V3_RESULTATS.json` avec toutes les mesures locales. Le tableau de performance affiche `original`, `V2`, `V3` et `V3/V2`.

Options : `node qne_v3.js --verify-only` (sans benchmark), `node qne_v3.js --bench-only` (sans validation), `node qne_v3.js --large` (ajoute N=1048576), `node qne_v3.js --no-save`.

## Statut et limitations

- **PASSED** sur la machine de développement de l'assistant ; résultats détaillés dans `QNE_V3_RESULTATS_REFERENCE.json`.
- **Mesures sur Motorola à obtenir** en exécutant `node qne_v3.js` depuis Termux.
- Dans un environnement mobile, DVFS, échauffement et tâches en arrière-plan peuvent modifier les gains observés. Préférer plusieurs sessions à température comparable.
- La V3 est un moteur numérique CPU JavaScript single-thread ; le champ de Galois/LFSR de la V2 n'est pas modifié.

## Publication GitHub (facultatif, après vérification sur l'appareil)

```bash
cd ~/QNE
git add qne_v3.js lancement_qne_v3.sh QNE_V3.md QNE_V3_RESULTATS.json
git commit -m 'QNE V3 additive RK4 fused passes + comparative validation'
git push
```
