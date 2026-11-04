# QNE V15 — Reconstruction adaptative + amplification vérifiable + workers V14

Extension **strictement additive** : elle ne modifie aucun moteur V2–V14, aucun des 72 modules et aucune branche Git distante. Node.js >=18, aucun package npm requis.

## Objet

QNE V15 associe trois politiques qui dépendent **du calcul réel** :

1. **Reconstruction sans perte et explicite** de données régulières (`periodic`, `fill`), de données avec exceptions (`patches`), de cellules linéaires GF(2^128) et d'un état de Lorenz-96 **recalculé** à partir des paramètres fixes du véritable moteur QNE V2.
2. **Repli littéral universel** : toute suite d'octets peut être stockée et relue en mode `literal` avec SHA-256. Ce mode ne garantit **aucune compression**, et peut même ajouter des octets (base64 + métadonnées).
3. **Coordination V14** : la fenêtre reconstruite est convertie en base64 puis envoyée aux **vrais workers V13/V14 inchangés** en tâches `qne.sha256` déjà autorisées. Les hashes reçus sont vérifiés indépendamment. Seules des fenêtres bornées sont envoyées, pas le flux de 10 millions de To. Le coordinateur V14 et les workers ne calculent **pas** la réduction GF globale ; ce calcul reste réalisé localement par QNE V2.

La politique `lib/planner.js` sélectionne la reconstruction locale pour les petites lectures, le pont V14 pour la vérification explicite de fenêtres plus grandes, et une **réduction algébrique directe** pour l'agrégat GF. Elle n'impose pas le palier le plus grand : sur une suite GF très régulière, 256 classes sont mathématiquement correctes mais plus coûteuses que la composition directe.

## Installer dans Termux

Télécharger `QNE_V15_Termux.zip`, puis :

```sh
pkg install -y unzip nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V15_Termux.zip
bash qne_v15/lancement_qne_v15.sh
```

Prérequiert `qne_v12/`, `qne_v13/` et `qne_v14/` déjà installés. Il n'est **pas** nécessaire de garder un serveur V14 lancé : le contrôle démarre temporairement son propre coordinateur sur un port local libre et deux vrais workers, puis les arrête. Aucun `git push` n'est effectué automatiquement. Pour un contrôle exclusivement local sans workers : `bash qne_v15/lancement_qne_v15.sh --local-only`.

Le rapport local est `qne_v15/QNE_V15_RESULTATS.json` et doit être distingué de `QNE_V15_RESULTATS_REFERENCE.json` (mesures Linux).

## Cas évalués dans le seul contrôle consolidé

- Données périodiques 32 KiB : représentation répétitive, reconstruction et SHA-256 conformes.
- Données creuses avec exceptions 32 KiB : base constante + correctifs positionnés, relecture exacte.
- Données aléatoires cryptographiquement générées 32 KiB : conservation littérale intégrale, pas de faux gain de compression.
- Jumeau non linéaire Lorenz-96 : état final de 64 variables après neuf pas RK4, recalculé à partir de la règle et des paramètres QNE ; SHA-256 vérifié. Cette méthode ne s'applique **pas** automatiquement à des états initiaux inconnus, des modèles modifiés ou à toutes les dynamiques non linéaires.
- Jumeau linéaire GF(2^128) : accès aléatoire, 8 192 cellules reconstruites et comparées à un XOR direct ; exceptions et XOR corrigés.
- **10 millions de To décimaux logiques** (10^19 octets) : résultat XOR algébrique exact, identique au précédent `0x4c6f8a293f5682a9be1270f3205a70d0`, avec partitions exactes en 2, 8, 12, 16, 32, 64, 128 et 256 classes. Aucune allocation ni lecture physique des 10^19 octets.
- Workers : deux processus QNE existants et quatre fenêtres de 8 KiB (32 KiB réellement reconstruits), hachés par ces workers. Le hash porte sur la **chaîne base64**, pas directement sur les octets bruts.
- Mémoire de réutilisation : cache borné par contenu de descripteur, offset et longueur ; test d'un second accès identique sans recalcul.

## Résultats du bac à sable Linux

- **36 contrôles réussis** dans le passage final, y compris 2 travailleurs V14.
- Volume GF logique : 10 000 000 To ; **descripteur ~151 octets**, sans compter le code QNE, Node.js ou les autres métadonnées.
- Une réduction algébrique GF directe prend environ 1,48 ms dans ce passage ; les 256 classes coûtent ~333 ms. Les vitesses ne sont pas des mesures Motorola.
- RSS du processus principal après le contrôle complet : ~46,8 Mio ; les processus travailleurs sont distincts et leur mémoire n'est **pas** incluse dans cette valeur.
- L'état Lorenz-96 de 512 octets est reconstructible ici depuis un descripteur de ~185 octets, avec calcul CPU à la demande.
- Les 32 KiB de données aléatoires, au contraire, deviennent **plus volumineux** en mode littéral JSON (environ 43,8 KiB).

## Limites scientifiques

La reconstruction intégrale universelle **sans perte** est réalisable comme *interface* en conservant les octets arbitraires. Elle **n'est pas** une compression universelle : il est mathématiquement impossible de raccourcir tous les messages. Les 10 millions de To sont une *structure générable* et non un volume de données non structurées préalablement observées.

Les paliers sont des décompositions exactes d'un calcul donné : leur multiplication ne donne pas automatiquement une multiplication de la puissance CPU. Les workers ne gagnent en vitesse que si le travail délégué excède la latence d'ordonnancement et de communication.

Pour plusieurs machines, n'exposer le service V14 qu'en HTTPS avec certificats vérifiés et machines de confiance. Le contrôle intégré n'ouvre qu'une écoute `127.0.0.1` avec un jeton aléatoire éphémère.

## Publication GitHub (facultative)

Après avoir regardé les fichiers :

```sh
cd ~/QNE
git add -- qne_v15/lib qne_v15/engine qne_v15/checkup.js qne_v15/lancement_qne_v15.sh qne_v15/README.md qne_v15/.gitignore qne_v15/SHA256SUMS.txt qne_v15/QNE_V15_RESULTATS_REFERENCE.json
git diff --cached --check && git commit -m 'QNE V15 : reconstruction adaptative et pont workers V14' && git push origin master
```

Ne pas ajouter les fichiers `vr_*.bin`, les secrets V12, ni les rapports de fonctionnement privés. La commande ne modifie aucune source d'origine.
