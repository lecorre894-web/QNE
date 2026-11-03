# QNE V9 — suite de validation et de calibration générale (extension additive)

**État de la livraison : VALIDATION PASSED dans l'environnement de référence**. Les mesures de l'ordinateur utilisé pour préparer le paquet ne représentent pas celles du Motorola. Les fichiers existants du dépôt ne sont pas remplacés.

## Objectif

Mesurer le gain de QNE sur **plusieurs familles de problèmes** : (1) GF(2^128), (2) saut de LFSR à partir d'un état quelconque, (3) exponentiation de matrices 32×32 sur GF(2), (4) Lorenz-96 RK4 Float64 avec les moteurs natifs V4, V7 et V8. L'objectif ×100 général ne pourra être déclaré atteint que si une *charge de travail globale, représentative, annoncée à l'avance* est accélérée ×100 par rapport à une version de référence précisément identifiée, avec résultats égaux.

## Origine des sources

Le paquet rassemble `qne_v2.js` et les sources C++ des moteurs V4, V7 et V8 créés précédemment dans cette conversation. Le dépôt GitHub public n'était pas récupérable dans l'environnement de préparation : **ce paquet n'est pas un audit de tous les fichiers actuellement présents sur GitHub et aucune mise à jour distante n'a été faite**.

## Installation (Android / Termux)

Télécharger `QNE_V9_Termux.zip`, puis :

```bash
pkg install -y unzip clang nodejs
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V9_Termux.zip
bash qne_v9/lancement_qne_v9.sh
```

La commande compile les moteurs natifs localement, réalise les contrôles binaires et mesure les familles avec **7 répétitions alternées**. Elle produit `qne_v9/QNE_V9_RESULTATS.json` et `qne_v9/QNE_V9_PROFIL.json` si les validations réussissent.

Commandes utiles :

```bash
bash qne_v9/lancement_qne_v9.sh --quick         # 3 répétitions, tailles réduites, estimation provisoire
bash qne_v9/lancement_qne_v9.sh --linear-only   # GF128, LFSR, matrices, sans benchmark RK4
bash qne_v9/lancement_qne_v9.sh --numerical-only # RK4 exclusivement
node qne_v9/qne_v9_select.js --bench 262144 30 1
```

`qne_v9_select.js` utilise la calibration locale pour choisir un moteur sur la taille demandée; il **ne** contient **aucun seuil fixe** de dimension imposant V4. Une variante n'est retenue que si elle bat V4 d'au moins 5 % sur la taille calibrée. Hors tailles calibrées, le profil sélectionne la taille la plus proche en log2 : revalider les tailles particulières si nécessaire. En l'absence de profil, V4 sert de secours.

## Méthode de vérification

- **GF128 :** l'opération de carré LUT optimisée est comparée à la multiplication polynomiale indépendante sur BigInt sur 128 valeurs. Les deux voies donnent la même sortie dans GF(2^128) pour les cas testés.
- **LFSR :** le saut avec graine arbitraire depuis `qne_v2.js` est confronté à une itération directe de 2^20 pas sur deux graines, plus une vérification du vecteur de base. Le test de l'exposant décimal `10^100` confirme l'équivalence des deux entrées représentables, pas le calcul de ses 2^(10^100) étapes directes.
- **Matrices 32×32 GF(2) :** exponentiation binaire dans les deux voies, l'une en matrice dense de 0/1, l'autre en lignes compactées dans des mots de 32 bits. Aucun changement de l'algorithme mathématique. Cas de contrôle jusqu'à une puissance de 1 000 000.
- **RK4 :** V4, V7 et V8 donnent des fichiers d'état identiques **octet pour octet** sur les dimensions, graines et pas indiqués dans le rapport. Float64, F=8, dt=0,01, ni fast-math ni fusion FMA. Contrôles supplémentaires au nombre de pas du benchmark.

## Résultats de référence (cette machine, 7 répétitions)

| Famille | Gain vs référence de cette famille |
|---|---:|
| GF128, carré LUT vs BigInt | ×41,15 |
| LFSR, saut 2^20 vs 1 048 576 itérations directes | ×6 233,89 |
| Matrices 32×32 GF(2), bits compactés vs tableau dense | ×20,52 |
| RK4 à N=1 048 576, meilleur moteur vs V4 | ×4,18 |

**Score de batterie synthétique :** ×5,20 sur une charge fixe annoncée ci-dessous, soit 658,81 ms de travail de référence contre 126,64 ms de travail optimisé (durées estimées à partir des médianes d'opérations). Moyenne géométrique non pondérée par famille : ×58,06. Ces deux agrégations répondent à des questions différentes ; elles ne prouvent aucune accélération générale de ×100 sur un logiciel complet.

Charge fixe : 8 192 carrés GF128 ; deux sauts LFSR 2^20 ; 64 puissances de matrices 32×32 à l'exposant 1 000 000 ; un calcul RK4 pour chacune des six dimensions du rapport et avec les nombres de pas correspondants (les mêmes pour toutes les variantes).

**Limites expérimentales :** préparation du cache et compilation exclues ; référentiels GF128/LFSR/matrices indépendants, *non identiques à l'ancien moteur QNE sur GitHub* ; résultats valables pour les cas vérifiés et la machine/charge utilisées ; extrapolation des gains interdite sans test. Des variantes peuvent être moins rapides que V4 et sont écartées par le calibrateur.

## Fichiers

- `qne_v9.js` : vérifications, bench multispecialité, score de batterie, export JSON.
- `qne_v9_select.js` : exécution du moteur numérique choisi par calibration.
- `qne_v2.js` : source LFSR/GF128 validée en V2 et reprise sans modification.
- `qne_v4_native.cpp`, `qne_v7_native.cpp`, `qne_v8_native.cpp` : versions natives additives.
- `lancement_qne_v9.sh` : compilation Termux et lancement.
- `QNE_V9_RESULTATS_REFERENCE.json` : mesures d'origine sur machine de préparation, **non Motorola**.
- `SHA256SUMS.txt` : empreintes des fichiers distribués.

## Conservation / publication

Les versions V2 à V8 restent inchangées dans `~/QNE`. V9 n'écrit que dans son propre dossier. Pour publier V9 ensuite, lancer depuis `~/QNE` un `git status`, puis ajouter `qne_v9/` après avoir vérifié les fichiers et retiré les binaires locaux éventuels. Aucune commande `git push` n'est exécutée automatiquement.
