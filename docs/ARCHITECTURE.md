# Architecture du prototype

## Composants

| Fichier | Responsabilité |
| --- | --- |
| `index.html` | Conteneur Cesium, sélection du fond, date, curseur horaire, bâtiments et état de chargement. |
| `src/main.js` | Création de la scène, couches swisstopo, caméra, heure, éclairage et interactions. |
| `src/style.css` | Mise en page de la scène et du panneau de contrôle. |
| `vite.config.js` | Copie les ressources statiques Cesium nécessaires aux Workers et widgets sous `/cesiumStatic`. |
| `scripts/probe.mjs` | Contrôle de bout en bout dans Chrome, avec les services réseau réels. |

Le projet est une application JavaScript côté navigateur, construite avec Vite. Aucune API ou base de données propre à Jura 3D n'existe encore. `npm run build` produit des fichiers statiques dans `dist/` ; ce répertoire n'est pas versionné.

## Flux de rendu

1. `Viewer` Cesium reçoit un fond XYZ swisstopo et le terrain quantized mesh de `3d.geo.admin.ch`.
2. `Cesium3DTileset.fromUrl` charge les bâtiments swissBUILDINGS3D ; ils sont ajoutés aux primitives de la scène.
3. `UrlTemplateImageryProvider` demande les tuiles selon la distance de caméra, sous les limites définies par couche dans `MAX_IMAGERY_LEVEL` : aérien 20, topo 18.
4. `viewer.scene.globe.enableLighting`, `shadows` et `terrainShadows` activent la réponse visuelle à l'heure de `viewer.clock.currentTime`.
5. Le contrôle natif du zoom par glisser droit est retiré. `ScreenSpaceTiltOrbitCameraController` utilise ce geste pour tourner et incliner la caméra ; la molette et le pincement gardent le zoom.

Le sélecteur de fond remplace la couche d'imagerie. Le sélecteur de date et le curseur horaire synchronisent leurs valeurs ; l'événement `input` du curseur met à jour l'horloge Cesium pendant le glissement. `viewer.clock.shouldAnimate = false` garde l'heure choisie fixe jusqu'à une nouvelle action. Le `datetime-local` est interprété dans le fuseau du navigateur.

## Contrôle automatisé

`scripts/probe.mjs` ouvre l'application avec `?probe=1`. Ce paramètre expose temporairement un relevé de la caméra, de l'heure et du niveau maximal de la couche active ; il ne modifie pas la scène normale. Le script vérifie les réponses réseau, les erreurs JavaScript, la synchronisation du curseur, le changement d'heure et les gestes de caméra. Les captures `probe-*.png` sont des sorties temporaires ignorées par Git ; seules quelques images choisies sont conservées dans `docs/images/`.

Ce contrôle dépend des services en ligne et de Chrome Windows. Il ne mesure pas les performances réelles sur appareil mobile ni la justesse physique des ombres.
