# Décisions techniques

Ce registre garde le motif des choix durables. Une décision peut être révisée après mesure ou discussion ; noter alors la date et la nouvelle preuve.

## 2026-09-29 — Projet neuf, sans copie de SunTrail ou Geneva 3D

Le propriétaire souhaite repartir de zéro et réutiliser des idées techniques, pas l'application SunTrail entière. Le prototype a été écrit séparément. Toute reprise future de code externe demandera une analyse de sa licence et de son adaptation.

## 2026-09-29 — CesiumJS et services swisstopo pour le premier prototype

CesiumJS lit directement le terrain quantized mesh et les bâtiments 3D Tiles fournis par swisstopo. Cela permet une preuve technique rapide sans convertir les données ni souscrire à MapTiler. Ce choix valide le prototype ; il ne constitue pas encore une comparaison de performance complète avec MapLibre ou le moteur SunTrail sur téléphone.

## 2026-09-29 — Limites distinctes pour les fonds de carte

Le prototype limitait initialement les deux fonds au niveau 18. Le service aérien fournit le niveau 20 autour de Delémont, vérifié par requête directe puis dans Chrome : plafond porté à 20. Le service topo annonce 19, mais une tuile de niveau 19 à Delémont était vide : plafond conservé à 18 pour éviter un fond blanc. Revoir ce choix si la couverture du niveau 19 est établie avec une stratégie de repli.

## 2026-09-29 — Heure sélectionnée fixe et modifiable en direct

Le curseur met l'heure Cesium à jour à chaque événement `input`, ce qui rend visibles les changements pendant le geste. L'animation automatique de l'horloge est désactivée pour garder la valeur choisie. Le fuseau est actuellement celui du navigateur ; une future interface destinée à plusieurs fuseaux pourrait devoir imposer `Europe/Zurich`.

## 2026-09-29 — Dépôt public sous MIT

Le propriétaire a choisi `jackseg80/jura3d` public et MIT pour le code. Les données swisstopo et les dépendances restent sous leurs propres conditions ; la documentation les sépare explicitement de la licence du dépôt.
