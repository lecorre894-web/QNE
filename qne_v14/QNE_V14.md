# QNE V14 — gains progressifs mesurés palier par palier

## Principes

Version **strictement additive** : `qne_v14/` réutilise les coordinateurs et travailleurs de `qne_v12/` et `qne_v13/`. Aucun fichier V2–V13 ou bibliothèque des 72 modules n'est modifié. Le dépôt GitHub n'est modifié qu'avec une commande de publication explicite.

### Les six paliers reproductibles

| Palier | Algorithme | Communication | Exécutants |
|---|---|---|---|
| P0 | V12 | un appel par tâche et par contrôle | 1 worker |
| P1 | V12 | identique | 4 workers |
| P2 | V13 | cache partagé + fusion des tâches | 4 workers |
| P3 | V14 | P2 + dépôt groupé (maximum 32), écritures d'état groupées | 4 workers |
| P4 | V14 | P3 + lecture groupée des résultats (maximum 64) | 4 workers |
| P5 | V14 | P4 + exécution locale **bornée** des opérations très courtes | 4 workers présents et routage de secours pour tâches non éligibles |

Une tâche P5 éligible n'est **plus envoyée** aux workers : le coordinateur calcule directement. Il conserve les workers pour les tâches non éligibles et la compatibilité avec les protocoles V12/V13. Les gains P5 sont principalement la suppression de création de threads, de requêtes réseau internes et de files d'attente sur de petites tâches. Ils ne signifient ni multiplication de puissance brute du CPU ni accélération universelle de toutes les opérations.

Les limites P5 sont volontairement strictes : SHA-256 ≤4 096 octets ; PGCD ≤40 chiffres par argument ; exponentiation modulaire avec base ≤20 chiffres, exposant ≤160 chiffres, modulo ≤20 chiffres. Le budget local vise environ 15 ms par lot (contrôle entre deux tâches, sans préemption pendant une opération) ; les tâches suivantes sont alors confiées aux workers. Aucun script externe et aucune tâche arbitraire ne sont exécutés dans le coordinateur.

## Installer dans Termux

```bash
pkg install -y unzip nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V14_Termux.zip
bash qne_v14/lancement_qne_v14.sh --test
bash qne_v14/lancement_qne_v14.sh --bench
bash qne_v14/publication_qne_v14.sh
```

Les rapports `QNE_V14_TESTS_LOCAL.json` et `QNE_V14_BENCH_LOCAL.json` sont générés **sur le Motorola**. Ils ne sont pas préinstallés dans l'archive. `publication_qne_v14.sh` ne pousse rien sur GitHub si les contrôles échouent, si le benchmark local manque, ou si des fichiers extérieurs à `qne_v14/` sont déjà préparés dans l'index. Les gros fichiers `vr_*.bin` restent non suivis.

### Activer après benchmark

Première session Termux (arrêter les services V12/V13 occupant la même configuration réseau si nécessaire) :

```bash
cd ~/QNE
bash qne_v14/lancement_qne_v14.sh --local auto repeated
# Ou : bash qne_v14/lancement_qne_v14.sh --local auto unique
```

Le profil automatique choisit, pour la charge indiquée, le palier le plus rapide **parmi P2, P3, P4, P5** d'après les mesures locales. Les workers V13 sont toujours présents ; P5 n'est activé que si le benchmark le recommande.

Deuxième session :

```bash
cd ~/QNE
node qne_v14/client.js status
node qne_v14/client.js batch 30 repeated
node qne_v14/client.js batch 30 unique
```

Le coordinateur écoute exclusivement sur 127.0.0.1:17859 en mode local. Il réutilise le secret V12 en mode 0600, et stocke ses états dans `~/.qne_v14_data`, pas dans Git. Les sorties calculées sont vérifiées avec le moteur de référence V12 avant qu'un test soit déclaré conforme.

## Résultats de référence Linux, **pas** Motorola

Benchmark : deux répétitions alternées par palier, 24 tâches dans chaque passe (48 tâches logiques), deux charges : `repeated` (6 tâches répétées) et `unique` (48 tâches distinctes). Le temps inclut soumission HTTP, files, calcul et observation de fin ; il exclut lancement des services. Chaque résultat de chaque palier est comparé au calcul de référence V12.

| Palier | Répétées (ms, médiane de 2) | Gain cumulé | Distinctes (ms, médiane de 2) | Gain cumulé |
|---|---:|---:|---:|---:|
| P0 | 1 901,51 | ×1,00 | 1 927,19 | ×1,00 |
| P1 | 714,97 | ×2,66 | 673,47 | ×2,86 |
| P2 | 227,28 | ×8,37 | 661,04 | ×2,92 |
| P3 | 215,61 | ×8,82 | 709,61 | ×2,72 |
| P4 | 179,20 | ×10,61 | 665,80 | ×2,89 |
| P5 | 11,75 | **×161,89** | 14,58 | **×132,16** |

**Attention :** les écarts de quelques pour cent entre P2–P4 peuvent provenir du bruit de mesure ; les paliers ne progressent pas toujours. La sélection locale évite d'imposer un palier mesuré comme plus lent. Les grands gains P5 concernent uniquement une charge de **petites** tâches adaptées au fastpath ; les travaux lourds sont renvoyés aux workers et n'ont aucune garantie de gain. P5 peut saturer le coordinateur s'il est utilisé au-delà des limites prévues. Ce n'est pas une démonstration d'un système datacenter ×100, ni un résultat de puissance de calcul brute, ni une nouvelle mesure globale QNE V2–V14.

### Définition du cumul

Pour les temps `T(P0)` à `T(P5)` de la même charge : `g_i = T(P(i-1))/T(Pi)` et `G_total = Πg_i = T(P0)/T(P5)`. La multiplication est uniquement une identité de temps télescopique, pas le produit de gains issus de benchmarks hétérogènes. À partir de P2, les ratios peuvent descendre sous 1.

## Garantie de fonctionnement et limites

- Opérations autorisées uniquement : les fonctions déterministes explicitement acceptées par V12 (`qne.sha256`, `qne.gcd`, `qne.modpow` et autres chemins legacy déjà contrôlés en amont). Les autres moteurs restent pilotés par les workers et ne passent pas dans le fastpath.
- Protocole V12 inchangé pour les workers ; support des anciens endpoints. Ajout de `/v1/tasks/batch` et `/v1/tasks/status` avec validation préalable et restrictions de taille. Le traitement d'un lot est synchrone et écrit un état consolidé ; ce n'est **pas** une transaction ACID multi-fichiers ni de la haute disponibilité.
- Persistance locale par fichier, baux et reprise V13 conservés ; pas de broker distribué, de stockage partagé multi-coordonnateurs, d'identité individuelle des travailleurs ou de haute disponibilité datacenter.
- Ne pas exposer un coordinateur sur Internet en HTTP. Pour plusieurs machines : HTTPS, CA vérifiée, authentification forte, contrôle réseau et surveillance. Le jeton partagé V12 convient seulement aux machines de confiance.
- Tests de laboratoire vérifient résultat, cache, atomicité de validation, redémarrage de registre, refus d'accès sans secret, partage V12/V13 et retour vers un worker quand la tâche est trop grande.
- Les benchmarks et les traces sont des observations sur une machine spécifique. Pour l'objectif ×100 général, il reste à bâtir une batterie réellement représentative des calculs lourds et des modules QNE 72/72, sur plusieurs machines physiques.
