# QNE V11 — intégrateur additif pour la bibliothèque de 72 modules

**Cible : Android / Termux avec Node.js.** Cette livraison installe un *pont d'exécution et un catalogue* pour les fichiers déjà présents dans `~/QNE/imports_20261104/`, sans modifier les sources originales ni les moteurs V2 à V10.

## État des sources et limites

Au moment de construire ce paquet, les fichiers JavaScript du commit public `f76eb5c` ne pouvaient pas être téléchargés depuis l'environnement de préparation. Le paquet ne contient donc pas de copie supposée de ces fichiers. **Leur audit réel s'effectue sur ton téléphone** et produit un rapport JSON. Les 11 contrôles de l'outil ont été exécutés sur des fichiers de test synthétiques ; ils ne certifient pas encore la compatibilité des 72 modules réels.

## Installation

Depuis `~/QNE`, après téléchargement :

```sh
pkg install -y unzip nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V11_Termux.zip
bash qne_v11/lancement_qne_v11.sh
```

L'archive ne contient que `qne_v11/`, et ne remplace pas les fichiers antérieurs. Le lancement réalise les tests de l'intégrateur, un examen statique des scripts, la vérification des dépendances relatives et, si V10 est présent, un calcul d'identité matricielle à travers l'API de V10.

## Ce que fait l'intégration

1. Le **catalogue** attribue des alias durables : `core.noyau`, `core.micronoyau`, `math.mathlib`, `library.bibliio`, `dqiv.dqiv_master`, etc. Les autres scripts reçoivent `legacy.nom`.
2. La **vérification syntaxique** utilise `node --check` sur tous les scripts, sans les exécuter.
3. Les **dépendances statiques** `require`, `import`, `export ... from` sont repérées et les chemins relatifs sont vérifiés ; le résultat est heuristique et peut manquer les imports dynamiques.
4. Le **pont d'exécution** utilise un processus Node.js séparé, un délai maximal et une limite de mémoire JavaScript. Il peut lancer un ancien script inchangé, ou appeler un export d'un module CommonJS/ESM. Il ne lance jamais les scripts simplement parce qu'ils sont découverts.
5. Le **pipeline** relie les sorties d'une fonction exportée aux entrées de la suivante, à condition que ces fonctions existent et acceptent les paramètres prévus. Les anciens scripts sans `module.exports` / `export` peuvent être exécutés, mais ne deviennent **pas automatiquement** des fonctions interopérables.
6. Le **moteur matrices V10** est accessible directement par le pont (`matrix`), et le sélecteur RK4 de V9 est utilisable (`numeric`), sans recompilation automatique ni chiffres fictifs.

## Commandes

```sh
cd ~/QNE
node qne_v11/qne_v11.js audit
node qne_v11/qne_v11.js catalog
node qne_v11/qne_v11.js selftest
node qne_v11/qne_v11.js matrix 1000000
node qne_v11/qne_v11.js numeric 4096 30 2
```

Commandes volontaires, **susceptibles d'exécuter le code réel** :

```sh
# Script autonome, dans un processus séparé (attention aux effets de bord du script)
node qne_v11/qne_v11.js run dqiv.dqiv_master --timeout 10000

# Si mathlib.js exporte effectivement la fonction add(a,b)
node qne_v11/qne_v11.js call math.mathlib add '[3,4]'

# Pipeline explicite : fichier JSON que tu définis
node qne_v11/qne_v11.js pipeline mon_pipeline.json
```

Exemple de *format* de pipeline, **non garanti compatible avec les fonctions réelles** :

```json
{"input":3,"stages":[
  {"alias":"core.noyau","method":"double"},
  {"alias":"core.micronoyau","method":"plus","args":[4]}
]}
```

## Fichiers produits localement

- `qne_v11/QNE_V11_AUDIT.json` — liste de fichiers, empreintes SHA-256, diagnostics syntaxiques et dépendances.
- `qne_v11/QNE_V11_REGISTRE.json` — noms d'alias et chemins relatifs, plus statuts.
- Aucun envoi GitHub automatique ; aucun fichier du répertoire importé n'est modifié.

Pour copier le rapport vers Téléchargements :

```sh
cp ~/QNE/qne_v11/QNE_V11_AUDIT.json ~/storage/downloads/
```

## Critères pour déclarer l'intégration complète

- Chaque fichier critique est syntaxiquement valide.
- Les dépendances relatives importantes sont résolues ; les interfaces des fonctions sont explicites et testées.
- Les modules de calcul peuvent être invoqués avec des données réalistes et leur sortie est vérifiée indépendamment.
- Les benchmarks comportent référence, quantité de travail identique, mesure complète (y compris transferts, initialisation et éventuelle compilation), plusieurs répétitions et absence de régression masquée.
- La mention **×100 global** exige une charge QNE définie à l'avance et un gain sur le temps total, pas la multiplication de gains locaux.

**Sécurité :** la commande `audit` ne charge pas les scripts ; `run`, `call` et `pipeline` les exécutent volontairement. Le processus séparé et son délai sont des protections opérationnelles, pas un bac à sable de sécurité. N'exécute que des modules que tu as vérifiés. Avant GitHub, inspecte les fichiers pour détecter d'éventuels secrets. Les fichiers géants `vr_*.bin` ne sont ni archivés ni ajoutés par ce paquet.
