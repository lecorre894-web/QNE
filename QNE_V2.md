# QNE V2 — correction mathématique, performance et validation

**Version additive — 1er novembre 2026.** Compatible Node.js >= 18 / Termux. Ne remplace **aucun** fichier du dépôt QNE existant.

## Ce qui change

### 1. Jumeau linéaire : correction du saut `2^E`

Dans `systeme.js` (état observé du dépôt public le 1/11/2026), l'estimation `jumpUs` initialise `Pp` à `1` puis effectue des élévations au carré. Elle ne mesure donc pas le calcul réel de `x^(2^E)`.

Plus important, dans `polyjump.js`, le registre droit (`advV`, décalage vers la droite + XOR du masque) utilise le masque de rétroaction aux positions `[127, 6, 1, 0]`, mais le polynôme employé pour le saut est `x^128+x^7+x^2+x+1`. **Ce polynôme n'est pas le polynôme caractéristique de ce registre avec cette convention de représentation.** Le polynôme caractéristique est son réciproque :

`P_R(x) = x^128 + x^127 + x^126 + x^121 + 1`.

Conséquence : les sauts polynomiaux et la référence LFSR divergent dès la vérification du saut de `2^7=128` pas depuis le vecteur unité en position 0. Le défaut se reproduit à `2^20` pas (benchmark présent dans `polyjump.js`).

La V2 :
- garde **l'ancien LFSR à l'identique**, avec sa convention de bits ;
- calcule le saut dans le corps défini par le polynôme **réciproque correct** ;
- pré-calcule les 128 états `2^E` pour `E mod 128` ;
- expose `jumpSeed2pow(E, seed)` pour avancer **n'importe quelle graine** de quatre mots 32 bits, sans dérouler les `2^E` étapes ;
- valide le caractère irréductible des deux polynômes par le critère de Rabin ;
- compare les résultats contre une référence BigInt et un déroulement du LFSR ;
- accepte des exposants décimaux gigantesques comme une **chaîne** de chiffres, sans construire le nombre `2^(10^100)`.

`at2pow(E)` retourne l'état exact du LFSR original au pas `2^E` pour une graine e0. `jumpSeed2pow(E, seed)` applique le même saut à un état arbitraire. `at2powField(E)` retourne le polynôme du corps GF(2^128), distinct. **Cela ne calcule pas le comportement du jumeau non linéaire** ni une trajectoire chaotique à cette distance.

### 2. Jumeau non linéaire : moteur RK4 plus efficace

Le moteur `calcul_max.js` existant réutilise déjà 4 tableaux `Float64Array`. La V2 conserve cette qualité et spécialise le calcul des indices circulaires de Lorenz-96 en éliminant les conditions et le modulo de la boucle intérieure des dérivées : 3 éléments de bord traités séparément, centre traité en boucle directe.

Le modèle reste `dx[i]/dt=(x[i+1]-x[i-2])*x[i-1]-x[i]+8`, intégration **RK4 à pas fixe `dt=0,01`**. La V2 est validée à l'identique contre l'implémentation existante pour N=4,5,7,40,100,4096, sur 20 pas. Il s'agit d'une **intégration numérique**, pas d'une solution mathématique exacte en temps continu.

Les benchmarks utilisent 5 répétitions, un échauffement et la **médiane**, avec alternance de l'ordre des moteurs. Les résultats varient selon l'architecture, la fréquence, la température et la mémoire disponible ; il n'existe aucun gain de vitesse garanti sur un autre appareil.

## Installation additive dans Termux

Télécharger `QNE_V2_additif.tar.gz` dans *Téléchargements*, puis :

```sh
cd ~/QNE
tar -xzf ~/storage/downloads/QNE_V2_additif.tar.gz --strip-components=1
node qne_v2.js
```

Le programme crée `QNE_V2_RESULTATS.json` dans le dossier courant, avec informations sur la machine, résultats de validation, débits et statut global. Aucune dépendance npm externe.

Tests indépendants :

```sh
node qne_v2.js --linear
node qne_v2.js --nonlinear
node qne_v2.js --large   # jusqu'à 1 048 576 variables, ne lance PAS 100 millions
node qne_v2.js --help
```

**Important :** lancer `node qne_v2.js` depuis `~/QNE` ; ne pas utiliser `node ~/qne_v2.js` si le fichier est dans `~/QNE`.

Si le statut est `PASSED`, pour publier seulement les nouveaux fichiers sur GitHub sans réécrire les historiques :

```sh
git status --short
git add qne_v2.js QNE_V2.md lancement_qne_v2.sh .github/workflows/qne-v2.yml
git commit -m "QNE V2 : corriger saut LFSR et valider RK4"
git push
```

Les fichiers `systeme.js`, `polyjump.js`, `calcul.js`, `calcul_max.js` et tous les autres restent inchangés. Le fichier `QNE_V2_RESULTATS.json` reste local pour ne pas publier accidentellement des détails sur la machine.

## Fichiers
- `qne_v2.js` : nouveau moteur et tests reproductibles, Node >= 18.
- `lancement_qne_v2.sh` : lanceur Termux.
- `QNE_V2.md` : documentation et portée des corrections.
- `.github/workflows/qne-v2.yml` : exécute le contrôle automatiquement sur GitHub Actions pour les changements futurs (Node 20 et 22).
- `QNE_V2_RESULTATS_REFERENCE.json` : exemple d'exécution sur un hôte **Linux x64 de test**, non sur le Motorola.

## Règles de preuve

- **MESURÉ** : chronométrage effectué sur l'hôte nommé dans le JSON ; aucun temps mesuré sur le Motorola par cette distribution.
- **EXACT** : égalité des états dans le modèle discret GF(2) / LFSR validée contre la référence ; pas une affirmation d'exactitude infinie de RK4.
- **APPROCHÉ** : simulation RK4 et apprentissage d'un système chaotique ; les erreurs et l'horizon prédictif demandent des tests spécifiques.
- **INCONNU** : accélération obtenue sur le Motorola avant exécution locale du benchmark.
