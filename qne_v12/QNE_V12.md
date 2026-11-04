# QNE V12 — Connexion multiple et execution distribuee, additive

## Niveau de validation

**Fonctionnel sur deux processus travailleurs locaux** : coordinateur TCP HTTP sur l'interface loopback uniquement, authentification, file de taches, attribution par capacites, bail/heartbeat, reprise apres expiration, idempotence, persistance des taches, preuves cryptographiques et calculs independants.

**Pas un datacenter deploye.** Aucun calcul a distance n'est revendique tant que les machines ne sont pas connectees et les controles de securite et de charge ne sont pas verifies. Cette version n'est pas une preuve d'acceleration ×100. Les taches distribuees sont *au moins une fois* et doivent etre deterministes et sans effets de bord.

## Diagramme logique

```text
  Utilisateur / API locale / script QNE
                 |
         Client authentifie
                 |
     Coordinateur QNE V12 (1 instance)
     - file durable locale (snapshot)
     - ordonnanceur & capacites
     - baux + nouvelle attribution apres panne
                 |
       HTTPS verifie entre machines
         /        |         \
   Worker A    Worker B    Worker N
  Termux        Linux       Conteneurs
    |            |             |
  QNE V10    Mathlib V11    Taches pures
  GF(2)         (opt-in)      SHA256/PGCD
```

Les fonctions QNE V11.3 verifiees sur ton telephone sont **interfaces connues** (noyau / mathlib). Le rapport precedent pour `core.noyau xor` a fourni `-27` dans un pipeline d'exemple, donc V12 **ne considere pas `xor` conforme** sans comparaison independante. Elle bloque l'operation si elle retourne une valeur different de l'XOR binaire attendu.

Les 12 modules Δ-QIV sont reserves en mode catalogue. Ils ne sont pas envoyes ou executes automatiquement sur les serveurs. Adapter leurs interfaces separement apres verification de leurs signatures. Aucune execution sur calculateur quantique n'est impliquee.

## Sur Motorola (Termux) — installer et valider

```sh
pkg install -y unzip nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V12_Termux.zip
bash qne_v12/lancement_qne_v12.sh --test
```

Le test local multi-processus cree un secret aleatoire ephemere, un coordinateur et **deux workers**, execute 30 taches, verifie SHA256, PGCD et puissance modulaire, controle auth, idempotence, bail expire, reprise de tache et redemarrage du coordinateur. Si V10 est installe, une operation 32×32 GF(2) est aussi verifiee sur les resultats.

Rapport : `qne_v12/QNE_V12_TESTS_LOCAL.json`. Le chiffre de performance eventuellement affiche est un **temps total de passage d'une petite batterie**, pas une preuve de speedup sur le moteur QNE ni sur 100 serveurs.

### Benchmark comparatif local, charge identique 1 / 2 / 4 travailleurs

```sh
bash qne_v12/lancement_qne_v12.sh --bench
```

Ce test emet 36 memes taches SHA256/PGCD/puissance modulaire pour 1, puis 2, puis 4 travailleurs, avec deux repetitions par defaut et verification de chaque resultat. Il ecrit `qne_v12/QNE_V12_BENCH_LOCAL.json`. Pour trois repetitions et 60 taches : `QNE_V12_BENCH_REPS=3 QNE_V12_BENCH_JOBS=60 bash qne_v12/lancement_qne_v12.sh --bench`. Ne pas extrapoler le score d un appareil a un datacenter.

## Sur Motorola — demarrer 2 a 8 workers

Dans Termux session 1 :

```sh
cd ~/QNE
bash qne_v12/lancement_qne_v12.sh --local 2
```

Dans Termux session 2 :

```sh
cd ~/QNE
node qne_v12/client.js status
node qne_v12/client.js batch 30
node qne_v12/client.js submit qne.gcd '{"a":"252","b":"105"}' ma-cle-1
```

Arreter la premiere session par CTRL+C. Par defaut, le coordinateur n'ecoute que `127.0.0.1:17839`, ce qui n'expose aucun port au reseau local ni a Internet. `client.js init` cree le secret `~/.qne_v12_secret` en mode `0600` et ne l'imprime jamais. Ne pas committer ou partager ce fichier.

## Raccordements effectifs

- `qne.sha256`, `qne.gcd`, `qne.modpow` : implementations de reference pures, pour valider le reseau et ses protections. Elles ne sont **pas** des accelerations originales QNE.
- `qne.matrix.rotate32` : reutilise `~/QNE/qne_v10/qne_v10_matrix.js`, verifie la rotation attendue et que la matrice d'entree reste intacte; retourne l'empreinte SHA256 de la matrice de resultat. Le moteur V10 peut etre natif ou compact selon son profil local.
- `qne.mathlib.pgcd` : raccordement reel a `ALG.pgcd` via V11.3, **uniquement** si `QNE_V12_ALLOW_LEGACY=1` sur les workers, empreintes toujours exigees; comparaison au PGCD de reference avant l'acceptation du resultat. Les fichiers de V11 restent inchanges.
- `qne.core.xor.checked` : raccordement au `noyau.xor` via V11.3 avec controle independent; refuse tout desaccord. Il n'est pas suppose que le contrat du noyau corresponde au XOR binaire avant ce controle.

Pour tester volontairement Mathlib/Noyau depuis les travailleurs (sources de confiance seulement) :

```sh
# Dans la session qui lance les workers, pour permettre ces deux operations :
QNE_V12_ALLOW_LEGACY=1 bash qne_v12/lancement_qne_v12.sh --local 2
# Puis dans une deuxieme session :
node qne_v12/client.js submit qne.mathlib.pgcd '{"a":48,"b":18}'
```

**Important :** `require` et le chargement des modules V11 peuvent executer du code d'initialisation. Le thread et ses limites de temps/memoire ne sont pas une sandbox contre du code non fiable. Ne distribuer que les modules que tu connais et que tu as audites.

## Plusieurs machines / site distant

1. Coordinateur sur un serveur avec un certificat TLS reconnu et un nom DNS stable. Definir `QNE_V12_HOST=0.0.0.0`, `QNE_V12_TLS_CERT`, `QNE_V12_TLS_KEY`, `QNE_V12_SECRET_FILE`, `QNE_V12_DATA` et demarrer `node qne_v12/coordinator.js`. Un demarrage sur toutes les interfaces **sans TLS est interdit**.
2. Installer la meme V12 sur chaque travailleur. Fournir le meme secret par canal securise (ne pas l'envoyer dans un chat public) et une AC TLS pour verifier le certificat.
3. Sur chacun : `QNE_V12_URL=https://nom.dns:17839 QNE_V12_CA_FILE=/chemin/ca.crt QNE_V12_SECRET_FILE=/chemin/cluster_token node qne_v12/worker.js`.
4. Le code **refuse HTTP vers une adresse non locale**. Il valide les certificats TLS (aucun `rejectUnauthorized:false`). Utiliser pare-feu, segmentation reseau, rotation de secrets et preferer mTLS en production.

### Conteneurs — exemple sans haute disponibilite

Un exemple Docker Compose est dans `qne_v12/datacenter/compose.yaml`. Le secret et les certificats CA/serveur **ne sont pas fournis**. Pour un laboratoire prive seulement, `sh qne_v12/datacenter/setup_demo_certs.sh` cree une AC ephemere et un certificat valable **2 jours** pour le nom DNS `coordinator` (ne jamais reutiliser en production). Tous ces secrets restent dans `qne_v12/datacenter/secrets/`, exclus par Git. Depuis `qne_v12/datacenter` :

```sh
docker compose up -d --build --scale worker=4
docker compose ps
```

Compose n'expose pas le coordinateur sur le port public. Les travailleurs utilisent `https://coordinator:17839`. Ce conteneur couvre les operations de reference ; pour V10/V11, installer les sources et binaires compatibles dans l'image sans melanger les architectures ARM et x86.

## Passage vers un VRAI datacenter (a developper / a valider)

- Remplacer le snapshot JSON local et le coordinateur unique par PostgreSQL transactionnel, Redis Streams/NATS JetStream ou un bus de travail equivalent; separation du stockage durable et des executants.
- Haute disponibilite : controleur multiple avec election / reattribution transactionnelle et reprise testee, rien de tel n'est encore dans V12.
- Sharding de taches, controle de flux, couts/quotas, plusieurs pools de machines CPU/GPU, gestion des secrets via coffre, mTLS, identites par service, telemetrie OpenTelemetry/Prometheus, traces, autoscaling et tests de chaos.
- Politique d'ordonnancement tenant compte des coeurs physiques, de la memoire, de la temperature et des couts reseau. Le format des taches doit rester versionne.
- Mesurer debit, latence p50/p95/p99, cout de transfert, pertes, doublons, consommation memoire et correctness; comparer contre la meme batterie serie.

**Il n'existe pas de preuve technique qu'une architecture composee de milliers de machines ameliore de ×100 les calculs QNE : il faut un benchmark de charge reelle, avec la meme logique et les memes resultats.** Les petites taches peuvent etre ralenties par le transport et le cout des workers.

## Securite et limites

- Authentification par secret partage: maquette, pas identite par travailleur; TLS recommande meme sur un reseau prive. Si le secret fuit, changer le secret sur tous les noeuds.
- Une seule instance de coordinateur autorisee par dossier de donnees, et au plus 4000 taches memorisees par defaut. Les snapshots synchrones ne sont pas une base de donnees de production.
- Les baux attribuent une semantique **at-least-once**. Une tache peut etre calculee deux fois apres une panne; pas de garantie exactly-once, ni de transaction externe atomique.
- Les limites de memoire des threads ne constituent pas un confinement de processus ni une protection contre du code volontairement malveillant.
- Aucun port distant ouvert par defaut, aucune commande systeme arbitraire, aucun transfert de fichier autorise par le protocole, aucun changement de V2–V11 ni de Git distant.

## Publier V12 apres validation locale

```sh
cd ~/QNE
bash qne_v12/lancement_qne_v12.sh --test
bash qne_v12/lancement_qne_v12.sh --bench
bash qne_v12/publication_qne_v12.sh
```

Le script publie uniquement le dossier V12, s arrete si d autres fichiers sont deja staged et n envoie jamais les secrets locaux ni `vr_*.bin`. Il ne modifie pas les originaux V2-V11.

## Fichiers

`coordinator.js`, `worker.js`, `client.js`, `compute_thread.js`, `lib/common.js`, `lib/store.js`, `lib/tasks.js`, `tests/e2e.js`, `tests/bench_scale.js`, `lancement_qne_v12.sh`, `publication_qne_v12.sh`, `datacenter/compose.yaml`, `datacenter/setup_demo_certs.sh`, `Dockerfile`, `SHA256SUMS.txt`, `QNE_V12_RESULTATS_REFERENCE.json`.
