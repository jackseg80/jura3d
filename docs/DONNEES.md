# Données et conditions d'usage

## Sources actuellement utilisées

| Couche | Service et format | Réglage du prototype |
| --- | --- | --- |
| Relief | `https://3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1/` — quantized mesh | Normales de sommets demandées. |
| Bâtiments | `https://3d.geo.admin.ch/ch.swisstopo.swissbuildings3d.3d/v1/tileset.json` — 3D Tiles | Affichage activé au départ, masquable. |
| Vue aérienne | `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg` — XYZ JPEG | Niveau maximal 20. |
| Fond topographique | `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg` — XYZ JPEG | Niveau maximal 18. |

Les modèles et images sont chargés directement depuis swisstopo par le navigateur ; le dépôt ne contient pas de copie de ces données. CesiumJS est une bibliothèque distincte, distribuée sous Apache 2.0. Aucun service MapTiler ou Cesium ion n'est configuré dans le code. Le logo Cesium dans le widget n'indique pas à lui seul l'utilisation d'un service ion.

## Résolution et niveau des fonds

Le [document de capacités WMTS EPSG:3857](https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml) annonce un ensemble allant à 20 pour SWISSIMAGE et à 19 pour `pixelkarte-farbe`. Le 29 septembre 2026, la tuile aérienne de niveau 20 vérifiée près de Delémont a répondu avec une image ; le contrôle navigateur a aussi observé des requêtes aériennes jusqu'à 20. Une tuile topographique de niveau 19 à Delémont était presque uniforme et inutilisable. Ce constat local ne démontre pas l'absence de données au niveau 19 partout en Suisse ; le plafond 18 évite ce résultat dans le prototype actuel.

[SWISSIMAGE](https://www.swisstopo.admin.ch/en/orthoimage-swissimage-10) annonce une résolution au sol de 10 cm dans les plaines et principales vallées alpines, et de 25 cm dans les Alpes. La netteté perçue dépend aussi de l'angle de caméra, du relief et de la compression JPEG. Les ombres photographiées dans l'orthophoto ne bougent pas lorsque l'heure virtuelle change.

## Usage et attribution

Les [conditions OGD de swisstopo](https://www.swisstopo.admin.ch/en/faq-free-geodata) autorisent l'utilisation gratuite des données et géoservices standards, avec mention de la source « © swisstopo » ou équivalente. Les géoservices ont une limite de requêtes par unité de temps : un usage durable au-delà du fair use peut entraîner un contrat payant. La mention est affichée dans l'interface ; la vérifier pour chaque nouvelle couche et pour toute publication ou redistribution.

La licence MIT du dépôt couvre uniquement le code écrit pour Jura 3D. Elle ne change pas les licences des dépendances ni les conditions des données. Avant une diffusion importante, estimer le trafic et relire les conditions en vigueur.
