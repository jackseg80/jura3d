# Validation P4 — transports statiques

**Complément physique du 1er octobre 2026 :** première campagne A53 avec la couche, contrôles tactiles injectés et revue de captures réalisés ; retour manuel général positif, panneau corrigé après le défaut paysage. Échantillon de fiches/groupes, sans validation exhaustive des liens ni récupération réseau physique. [Preuves et limites P5](VALIDATION_P5.md). Les contrôles bureau datés ci-dessous sont conservés.

## Version et méthode

30 septembre 2026. Développement local autorisé par le propriétaire après P3. Dépôt principal `D:\Python\Jura3D`, branche `main`, base `57eb361` ; modifications antérieures conservées. Aucun stage, stash, commit, push ou déploiement. Modèle et effort conservés.

`npm run build` réussi : `index-Dkk-GRe5.js`, 4 216,48 kB (gzip 1 142,26 kB), CSS `index-JhXtplOw.css`, 396 ressources copiées ; avertissement de taille de bundle préexistant. `npm run probe` complet P1 + P3 + P4 : réussi à **22:35:53 Europe/Zurich**, navigateur **154.0.8037.92**, aucune erreur normale (`issueCount: 0`, erreurs P4 vides). Chrome Windows sans interface sur `http://127.0.0.1:4173/?probe=1`, réseau réel swisstopo et GeoJSON locaux ; Playwright contrôle le DOM et le picking réel de la scène. Les cas d’erreur sont injectés séparément, puis retirés pour le réessai réel. Rapports locaux ignorés `probe-p1-report.json` (ensemble), `probe-p3-report.json` et `probe-p4-report.json`.

## Comportement contrôlé

- Aucun téléchargement transports ni source Cesium avant activation. À Delémont : 81 arrêts et 30 tracés dans le secteur approximatif de 5 km, aucune zone au départ. Tout le réseau : 464 arrêts et 140 tracés ; deux zones Noctambus sur demande.
- Huit fiches d’arrêts et quatre cadres horaires comparés aux attributs GeoJSON, deux arrêts par destination P1. Clic réel sur un tracé dans chacune des quatre localités et sur l’arrêt Hôtel de Ville de Delémont. Un clic sur des tracés superposés propose le choix des objets réellement sous le clic ; sélection du tracé demandé contrôlée.
- Groupe d’arrêts : ancrage terrain, liste exactement égale aux membres retournés par Cesium, choix de membre sur bureau et toucher simulé. Les groupes peuvent changer avec la caméra ; aucune identité de groupe fixe annoncée.
- Filtres jour/nuit : seulement les champs source « Oui », sans interprétation des blancs. Arrêts, tracés et zones masquables indépendamment ; retrait de la sélection masquée, zéro entité si toutes les composantes sont masquées.
- P3/P4 coexistants, crédit cantonal visible tant qu’une couche reste active. Trois cycles de désactivation/réactivation sans doublon ni nouveau téléchargement des trois GeoJSON ; chargement annulé et bascules rapprochées sans source fantôme.
- Pannes HTTP 503 et GeoJSON invalide : erreur transports indépendante, patrimoine et scène conservés ; réessai réussissant avec les fichiers réels. URL dangereuse, champ/nom absent et lien connu 404 simulés : lien inactif et message, pas de nom ou de document inventé.
- Toucher **simulé** 390 × 844 puis 844 × 390 : menu replié à la sélection, liens/boutons de 44 px minimum, corps défilant, titre/fermeture/crédit accessibles, pas de débordement horizontal. Ce contrôle ne valide pas une tablette ou un téléphone physique.

| Destination | Arrêts source contrôlés | Tracé source / cadre |
| --- | --- | --- |
| Delémont | 25 Gare ; 65 Hôtel de Ville | 6 / 21.001 |
| Porrentruy | 77 Gare ; 287 Ville | 16 / 21.077 |
| Saignelégier | 117 Gare ; 380 Bellevue | 13 / 21.822 (Noctambus N22) |
| Saint-Ursanne | 124 Pont St-Jean ; 140 Gare | 19 / 21.061 |

Les clés ci-dessus sont celles des objets de cet instantané, pas des numéros commerciaux déduits. Sources, géométries et conditions P2 conservées ; © swisstopo et © Géodonnées de la République et Canton du Jura visibles.

## Correctif de sélection et limites du contrôle

La première exécution complète a échoué sur un clic à Porrentruy : la cible de picking obtenue avant le clic ne correspondait plus à la fiche sélectionnée. La sélection remplaçait matériau/largeur des polylignes, ce qui reconstruit les primitives au sol de façon asynchrone. Les tracés de base sont désormais conservés ; un tracé jaune temporaire distinct porte la surbrillance, retiré à l’effacement. Le picking précède l’effacement de la sélection pour préserver l’objet lu. La cible automatisée exige le même objet au pixel précis et avec la tolérance normale de clic. Le contrôle final a été repris sur ce build ; les premières tentatives ne sont pas comptées comme réussies.

Les tracés superposés listés par le contrôle final sont ceux renvoyés par Cesium, sans extrapoler à tous les points du réseau. Captures choisies après ce contrôle.

## Liens et fraîcheur

Observations datées dans [jura-transport-link-checks.json](../data/jura-transport-link-checks.json), URLs source conservées. Huit pages CarPostal des arrêts échantillonnés : HTTP 200 et nom attendu dans Chrome ; requêtes Python refusées 403. Seize liens CFF source : HTTP 200 par requête simple, mais deux essais Chrome refusés 403. Préremplissage CFF **non confirmé**, avertissement dans les fiches ; pas de garantie de fonctionnement dans chaque navigateur.

Neuf cadres horaires renvoient HTTP 200 et signature PDF. Texte de première page de quatre cadres contrôlé sur le service officiel : année 2026 ; état du 27.10.2025 pour [21.001](https://widgets.oev-info.ch/publikation/jahresfpl/21.001.pdf), [21.077](https://widgets.oev-info.ch/publikation/jahresfpl/21.077.pdf), [21.061](https://widgets.oev-info.ch/publikation/jahresfpl/21.061.pdf), et du 04.11.2025 pour [21.822](https://widgets.oev-info.ch/publikation/jahresfpl/21.822.pdf). Deux pages Noctambus [Ouest](https://www.noctambus-jura.ch/horaires/lignes/ouest/) et [Est](https://www.noctambus-jura.ch/horaires/lignes/est/) accessibles. Pas de contrôle exhaustif des services ni de disponibilité future.

Le réseau est un instantané du **13.09.2026**, préparé depuis les archives officielles ; ce n’est pas une source temps réel. PDF et horaires restent externes, non recopiés. L’application sert les GeoJSON statiques et les garde en mémoire après activation ; aucune base serveur, actualisation automatique ou cache persistant propre au projet. SQLite/GeoPackage sert uniquement à la préparation Python. Le cache HTTP habituel du navigateur peut intervenir ; le site dépend du réseau pour le fond/relief/bâtiments et les liens externes.

## Revue visuelle et limites

Captures Chrome revues : routes ancrées au terrain, tracé nocturne tireté à Saignelégier, zone Ouest avec fiche explicite, fiches portrait/paysage et erreur transports laissant le patrimoine affiché. Les FPS visibles dans les captures sont ponctuels et ne constituent pas un benchmark.

- [Réseau Delémont](images/p4-delemont-network.png)
- [Cadre horaire à Porrentruy](images/p4-porrentruy-line.png)
- [Choix entre tracés superposés](images/p4-overlapping-traces.png)
- [Tracé nocturne à Saignelégier](images/p4-saignelegier-line.png)
- [Zone Noctambus](images/p4-noctambus-zone.png)
- [Fiche portrait simulé](images/p4-touch-portrait.png)
- [Fiche paysage simulé](images/p4-touch-landscape.png)
- [Erreur indépendante](images/p4-error.png)

Pas d’essai physique P4 sur A53, Tab S8 ou S23. Les essais P1 et les retours du propriétaire ne mesurent pas le coût des couches P3/P4. La fluidité, la chauffe, la mémoire, le trafic et la lisibilité pendant une longue manipulation restent à mesurer. Ni LOD bâtiments, ni moiré des ombres, ni disponibilité exhaustive des liens résolus par P4. Aucune autre ville ou donnée GTFS/temps réel intégrée.

## Prochaine action — P5

Identifier le build, navigateur, appareil, batterie/température, réseau, preset, résolution, heure solaire et couches. Préparer un accès privé contrôlé au build ; la preview PC seule n’est pas accessible depuis l’appareil. Faire le même parcours des quatre localités, glissement/pincement/rotation, fiches, groupes, filtres et portrait/paysage, dont menu ouvert sur toute la hauteur utile.

Mesurer séparément terrain/fond, bâtiments, ombres, patrimoine, bus, puis ensemble ; cache froid/chaud consigné, session d’au moins dix minutes, FPS pendant les gestes, pauses, temps de scène utilisable, volume réseau et mémoire si observables, chauffe et erreurs/réessais. A53 comme référence basse, Tab S8 comme comparaison disponible ; S23 seulement s’il devient disponible. Répéter un scénario pour isoler réseau/charge. Aucun seuil de fluidité garanti par les vérifications bureau.
