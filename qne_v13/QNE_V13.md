# QNE V13 — amplificateurs coopératifs et gains cumulés mesurés

## État

Livraison **additive** : ce dossier `qne_v13/` s'ajoute à `~/QNE/` et réutilise les moteurs et les workers de `qne_v12/` sans modifier les moteurs publiés. Les 72 modules V11 restent inchangés. Les essais ont été effectués sur une machine Linux de préparation ; les performances **sur le Motorola** doivent encore être relevées.

### Les trois amplificateurs, réellement coordonnés

1. **A0 : calcul validé** — QNE V12 réalise les opérations `qne.sha256`, `qne.gcd` et `qne.modpow` (et les opérations déjà autorisées par V12 selon les composants présents). V13 ne change pas le résultat mathématique attendu.
2. **A1 : distribution V12** — un coordinateur donne du travail à plusieurs processus. Les workers V13 appellent **les fonctions de calcul de V12**. Le réseau reste compatible avec le protocole HTTPS/V12.
3. **A2 : coopération V13** — tâches identiques en vol regroupées (un seul calcul effectif, plusieurs identifiants préservés), résultats cache partagés entre workers et réutilisés après redémarrage (cache limité à 512 entrées, 24 heures par défaut).
4. **A3 : profil local** — à partir des mesures de ce téléphone, choisir le nombre de workers le plus rapide pour une charge `repeated` ou `unique`. Cette sélection n'est pas une accélération magique ; les cas non calibrés doivent être mesurés.

Important : cache et regroupement sont autorisés **uniquement pour SHA-256, PGCD et exponentiation modulaire**. Les résultats de matrices V10, Mathlib, Noyau et Δ-QIV ne sont pas cachés automatiquement : leurs comportements ou métadonnées peuvent dépendre des moteurs et demandent une validation spécifique. Aucune exécution arbitraire de code distant, aucune prétention d'accès à du matériel quantique, aucun cryptomining caché.

## Installation (Termux)

```bash
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V13_Termux.zip
bash qne_v13/lancement_qne_v13.sh --test
bash qne_v13/lancement_qne_v13.sh --bench
```

Les deux commandes écrivent `qne_v13/QNE_V13_TESTS_LOCAL.json` et `qne_v13/QNE_V13_BENCH_LOCAL.json`. Les tests restent sur `127.0.0.1`. L'exécution ne modifie pas `qne_v12/` ni les originaux V2–V11.

Pour démarrer localement, **après avoir arrêté toute instance V13 utilisant déjà le port** :

```bash
bash qne_v13/lancement_qne_v13.sh --local auto repeated
# Ou pour forcer 4 travailleurs : bash qne_v13/lancement_qne_v13.sh --local 4
```

Dans **un deuxième Termux** :

```bash
cd ~/QNE
QNE_V12_URL=http://127.0.0.1:17849 node qne_v12/client.js status
QNE_V12_URL=http://127.0.0.1:17849 node qne_v12/client.js batch 30
```

Le secret du cluster réutilise la configuration V12 et n'est jamais empaqueté. Le stockage durable V13 est séparé dans `~/.qne_v13_data/`. Ne publie pas ces répertoires secrets ni les journaux des tâches sensibles.

### Vérifier et publier dans le même dépôt GitHub

```bash
bash qne_v13/publication_qne_v13.sh
```

Le script ne publie pas avant d'avoir trouvé des résultats locaux **PASSED** pour les tests et les benchmarks. Il ne prépare que le dossier V13 dans Git et refuse de publier si d'autres fichiers sont déjà dans l'index. Il n'ajoute **jamais** les six gros `vr_*.bin`.

## Mesurer le gain cumulé sans double comptage

Le benchmark mesure la même charge et le même résultat avec V12/1 worker, V12/4 workers et V13/1,2,4 workers ; deux passes de 24 tâches, deux répétitions par configuration, en inversant l’ordre des configurations une répétition sur deux. Il distingue :

- `repeated` : tâches répétées (réutilisation du cache).
- `unique` : tâches **distinctes sur les deux passes**, cache peu utile et surcoût possible.

Soit `T12_1` le temps de V12 avec un worker, `T12_4` le temps V12 à quatre workers et `T13_4` le temps V13 à quatre workers, pour **la même charge** :

- Gain du premier amplificateur : `G_dist = T12_1/T12_4`.
- Gain ajouté par la coopération : `G_coop = T12_4/T13_4`.
- Gain cumulé réel : `G_total = T12_1/T13_4 = G_dist × G_coop`.

Cette multiplication est une **identité de rapports mesurés**, et non une multiplication fictive de performances de benchmarks différents. Si le second moteur ralentit, `G_coop < 1` et le gain cumulé baisse. Les temps incluent file, soumission HTTP et exécution, mais pas le démarrage des services.

### Mesures de référence de la machine de préparation (PAS Motorola)

| Charge | V12/1 | V12/4 | V13/4 | Gain distribution | Gain coopération | Gain total |
|---|---:|---:|---:|---:|---:|---:|
| Répétée | 2 184.46 ms | 738.01 ms | 237.04 ms | ×2.96 | ×3.11 | **×9.22** |
| Distincte | 1 869.82 ms | 711.93 ms | 712.88 ms | ×2.63 | ×1.00 | **×2.62** |

Les gains varient avec la température, l'ordonnanceur, les E/S et les cache. Deux répétitions constituent une première référence, **pas** une preuve statistique forte. Le ×100 global QNE **n'est pas atteint ni démontré**. Pour mesurer les anciens gains algorithmiques V10 sur les mêmes tâches, il faudra élaborer une batterie incluant réellement ces opérations ; multiplier ×5,87 (V10) par ×9,94 (V13) serait incorrect.

## Réseau et extension vers datacenter

Le coordinateur supporte le protocole de workers V12, avec authentification par jeton, TLS obligatoire pour écoute non locale, bail et reprise, file persistante et cache. Il peut donc coordonner plusieurs processus/machines de confiance. Un exemple Docker Compose **sur un seul serveur** est fourni dans `datacenter/`. Déploiement :

```bash
cd ~/QNE
bash qne_v13/datacenter/prepare_context.sh
bash qne_v13/datacenter/setup_demo_certs.sh  # nécessite openssl, certs valables 2 jours
cd qne_v13/datacenter
docker compose up -d --build --scale worker=4
# Depuis le conteneur d'un worker :
docker compose exec worker node qne_v12/client.js batch 30
```

**Attention :** la démo ne fournit pas la haute disponibilité d'un datacenter. Pour cela : files/états partagés, base transactionnelle, supervision, équilibrage, authentification par identité de worker, ressources/mémoire par job, TLS/mTLS gérés, métriques d'erreur, isolation des tenants, limites de débit, intégrité des résultats, déploiement orchestré multi-hôtes et pannes réseau doivent être conçus puis testés. Ici, un coordinateur unique et des workers de confiance constituent la preuve d'architecture.

## Sécurité et limites

- Les workers ont le **même secret de cluster** : ceci convient uniquement à un environnement privé de confiance ; ce n'est pas du multi-tenant Internet.
- Un worker malveillant pouvant soumettre un faux résultat peut polluer le cache ; un contrôle indépendant de sortie côté coordinateur est à développer pour des clusters non fiables.
- La cache contient des entrées issues des tâches : n'exécuter que des données non sensibles sur un cluster partagé.
- Les opérations réseau sont définies par une liste blanche stricte de V12, jamais par des chemins de scripts arbitraires.
- La cache locale conserve une copie sur disque (`.qne_v13_data/cooperative_cache.json` en mode 0600). Ne pas la committer.
- Le nombre de workers peut pénaliser un téléphone thermiquement contraint. `--local auto` sélectionne selon les mesures locales ; il n'extrapole pas.
