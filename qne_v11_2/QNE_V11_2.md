# QNE V11.2 — audit des interfaces et pipeline explicite

**Objectif :** identifier les fonctions *candidates* à l'appel dans les 72 sources, sans exécuter leur code pendant l'audit ni modifier les originaux. Détecte automatiquement `biblio.js` ou `bibliio.js` comme alias `library.bibliio`.

## Termux

```sh
cd ~/QNE
unzip -o ~/storage/downloads/QNE_V11_2_Termux.zip
bash qne_v11_2/lancement_qne_v11_2.sh
cp qne_v11_2/QNE_V11_2_INTERFACES.json ~/storage/downloads/
```

Le rapport contient les noms candidats à l'export, les fonctions simplement déclarées, le style des modules et leur SHA-256. Un *candidat* statique n'est pas encore une fonction appelée avec succès. En particulier, les scripts autonomes avec une simple fonction locale ne sont **pas** intégrés au bus d'appel tant qu'un adaptateur explicite n'est pas écrit.

## Pipeline réel, uniquement sur manifeste explicite

Un pipeline peut appeler, de manière isolée, les **exports connus** d'un module CommonJS ou ESM, en réutilisant le pont V11 et ses limites d'exécution. Les noms ci-dessous sont des **exemples de structure**, non des fonctions attestées dans les vrais modules :

```json
{
  "input": 5,
  "stages": [
    {"alias":"core.noyau", "method":"double"},
    {"alias":"math.mathlib", "method":"carre"}
  ]
}
```

Exécuter **seulement après** vérification des signatures et de l'innocuité des fonctions :

```sh
node qne_v11_2/qne_v11_2.js pipeline /chemin/manifest.json
```

Ce programme ne publie rien et n'écrit que ses rapports dans `qne_v11_2/`. Il ne revendique ni accélération ni communication automatique des 72 scripts. Il complète le catalogue V11 validé, mais ne remplace pas une intégration fonctionnelle fondée sur le code réel.
