# Consignes de reprise pour Jura 3D

## Contexte et portée

- Le dépôt est un prototype CesiumJS indépendant, centré aujourd'hui sur Delémont. L'objectif est un **site web exploratoire utile pour le canton du Jura suisse**, avec bâtiments 3D et couches d'information (transports, trafic, lieux, etc.). La couverture complète et ces couches ne sont pas encore implémentées. Un jeu éventuel serait un projet ultérieur distinct, pas l'objectif actuel.
- Utiliser SunTrail 3D comme source d'idées seulement. Ne pas copier son code ou celui de Geneva 3D sans analyse de licence et décision explicite.
- Les données swisstopo sont chargées en ligne. Le code MIT de ce dépôt ne relicencie ni CesiumJS ni ces données.

## Avant toute modification

1. Lire `README.md`, `docs/ETAT_DU_PROJET.md` et les documents liés au sujet.
2. Vérifier l'état Git et préserver les changements non liés.
3. Distinguer les faits testés, les hypothèses et les éléments encore à décider avec le propriétaire.

## Garder les documents synchronisés

À chaque changement fonctionnel ou technique, mettre à jour dans le **même changement** :

- `README.md` si l'utilisation, l'installation ou la portée changent ;
- `docs/ARCHITECTURE.md` si le flux, les composants ou la configuration changent ;
- `docs/DONNEES.md` si une source, un niveau, une condition d'usage ou une attribution change ;
- `docs/DECISIONS.md` pour toute décision durable, avec date, motif et conséquence ;
- `docs/ETAT_DU_PROJET.md` pour l'état vérifié, ses limites, les points ouverts et la prochaine action ;
- `CHANGELOG.md` pour les changements visibles ou importants.

Une nouvelle discussion doit pouvoir repartir de ces fichiers sans dépendre de l'historique du chat. Indiquer la date et la méthode des vérifications ; ne pas présenter un test local comme une preuve sur téléphone ou en production.

## Vérification et publication

- Exécuter `npm run build` après une modification du code ou de la configuration.
- Utiliser `npm run probe` pour les interactions 3D concernées ; il dépend de Chrome Windows et du réseau. Si impossible, noter précisément ce qui n'a pas été vérifié.
- Ne pas committer `node_modules/`, `dist/`, les captures temporaires `probe-*.png`, des secrets ou des clés API. Les images choisies pour la documentation vont dans `docs/images/`.
- Conserver la mention visible « © swisstopo ». Vérifier les conditions de fair use avant une diffusion à large audience.
