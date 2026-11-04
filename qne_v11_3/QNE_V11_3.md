# QNE V11.3 — intégration contrôlée, additive

## Origine / limites

- Fondé sur le rapport authentique `QNE_V11_2_INTERFACES.json` fourni le 4 novembre 2026, réintégré comme `QNE_V11_2_SNAPSHOT.json`. Le rapport fournit 72 noms, alias, états syntaxiques et SHA-256 **mais pas les sources JS elles-mêmes**.
- Le paquet ne contient ni ne réécrit les 72 originaux de `~/QNE/imports_20261104`. Il ne remplace ni V11, ni V11.2, ni V10, ni l'historique Git.
- Le rapport liste **70 scripts autonomes**, 1 CommonJS avec exports candidats `math.mathlib` (`GEO`, `VAR`) et 1 CommonJS dont les exports restent inconnus (`core.noyau`). `core.micronoyau` et `library.bibliio` (`biblio.js`) sont des scripts.
- 12 modules Δ-QIV sont identifiés par alias, **sans preuve d'exécution matérielle quantique**, ni d'interopérabilité intégrale.

## Commande d'installation et audit (sans exécution des 72 scripts)

```sh
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V11_3_Termux.zip
bash qne_v11_3/lancement_qne_v11_3.sh
```

Le lanceur effectue 16 tests du pont avec des **fichiers factices**, puis `node --check` et SHA-256 sur les 72 vrais scripts, enfin un test de puissance de matrice avec V10 si disponible. Il écrit `qne_v11_3/QNE_V11_3_INTEGRATION.json`. Ce rapport indique `INVENTORY_VERIFIED` si tous les originaux sont présents, syntaxiquement valides et identiques aux empreintes de V11.2. Il indique toujours `dynamic_interoperability: NOT_VERIFIED` tant que les interfaces n'ont pas été appelées sur les vraies sources.

Copie optionnelle du rapport :

```sh
cp ~/QNE/qne_v11_3/QNE_V11_3_INTEGRATION.json ~/storage/downloads/
```

## Appels dynamiques **uniquement sur demande explicite**

L'analyse n'exécute pas le code. Avant les commandes suivantes, inspecter les modules de confiance : **`require()` et l'exécution d'un script peuvent avoir des effets de bord, écrire dans des fichiers ou accéder au réseau.** Les sous-processus ont un timeout et une limite de mémoire, mais ce n'est pas une barrière de sécurité contre un module malveillant.

```sh
cd ~/QNE
# Observer les véritables exports CommonJS. Peut exécuter le code de chargement.
node qne_v11_3/qne_v11_3.js probe math.mathlib --allow-exec
node qne_v11_3/qne_v11_3.js probe core.noyau --allow-exec

# Exemple de syntaxe de l'appel : remplacer "nomFonction" par une
# fonction qui figure RÉELLEMENT dans le résultat probe.
node qne_v11_3/qne_v11_3.js call math.mathlib GEO.nomFonction '[2,3]' --allow-exec

# Test volontaire d'un script autonome, avec délai maximum 3 secondes :
node qne_v11_3/qne_v11_3.js run dqiv.dqiv_telemetry --allow-exec --timeout 3000
```

Un écart SHA-256 bloque les chargements par défaut. Après vérification des changements, l'option `--accept-drift` permet un appel mais le désaccord reste inscrit dans le résultat. Rien n'est effacé, réparé ou modifié automatiquement.

### Formats des arguments

Les fonctions appelables prennent des arguments JSON. Pour `BigInt`, utiliser `[{"type":"BigInt","decimal":"12345678901234567890"}]`. Pour `Uint32Array`, utiliser `[{"type":"Uint32Array","data":[0,1,2]}]`. Les retours sont sérialisés de façon explicite. Les résultats numériques n'ont pas de vérification mathématique indépendante tant qu'un test différentiel précis n'est pas ajouté.

### Pipeline de fonctions réellement exportées

Créer un manifeste JSON tel que :

```json
{
  "input": 8,
  "stages": [
    {"alias":"core.noyau", "method":"nomDeFonctionVerifie"},
    {"alias":"math.mathlib", "method":"GEO.autreFonctionVerifiee"}
  ]
}
```

Ne pas exécuter ce *modèle* tel quel : les noms de fonctions sont à remplacer d'après `probe`. Lancer :

```sh
node qne_v11_3/qne_v11_3.js pipeline /chemin/vers/pipeline.json --allow-exec
```

Les 70 scripts autonomes ne sont **pas** promus artificiellement en fonctions appelables. Ils sont exécutables isolément par `run` sous contrôle volontaire. Une interopérabilité de données entre eux nécessite de créer des adaptateurs fondés sur leurs sources réelles et leurs sorties mesurées.

## Objectifs de validation

1. Inventaire exact et identification des divergences SHA-256 (automatique, sans exécuter les modules).
2. `probe` sur `noyau.js` et `mathlib.js` (avec consentement `--allow-exec`) pour identifier signatures et types réels.
3. Ajouter les adaptateurs des scripts autonomes uniquement à partir de comportements vérifiés.
4. Établir un jeu fixe d'entrées/sorties et un contrôle différentiel sur chaque fonction avant toute optimisation.
5. Chronométrer charges égales avec plusieurs répétitions et consigner distinctement chaque gain. **Aucun ×100 global n'est mesuré par ce paquet.**

## Fichiers

- `lib/catalogue.js` : alias contrôlés, hashes et audit des 72 fichiers.
- `lib/runtime.js` : processus Node de durée contrôlée, sorties structurées.
- `lib/worker.js` : découverte dynamique (exports) et invocation ciblée CJS, `BigInt`/`Uint32Array`.
- `qne_v11_3.js` : CLI `audit`, `matrix`, `probe`, `call`, `run`, `pipeline`, `selftest`.
- `tests/selftest.js` : 16 contrôles reproductibles avec **5 modules factices**.
- `QNE_V11_2_SNAPSHOT.json` : copie inchangée du fichier V11.2 fourni.
- `QNE_V11_3_TESTS_REFERENCE.json` : preuve des contrôles dans l'environnement de préparation (pas Motorola).

Aucun envoi à GitHub n'est effectué par ces scripts.
