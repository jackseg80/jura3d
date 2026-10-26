# Bâle — passer de l'essai technique à un explorateur utile

26 octobre 2026 — demande et ordre confirmés par le propriétaire : **transports, lieux et patrimoine, services pratiques**. Ce document révise le plan ; il n'annonce pas ces couches comme réalisées.

## Ce qui était prévu et ce qui est ajouté

Le plan P8 existant prévoyait une preuve multicité : bâtiments cantonaux sur une zone limitée et parkings horodatés, avec mesures et fiches, puis arbres/forêts optionnels après mesure et ponts si utiles. Il ne définissait pas de livrables Bâle pour les transports, les lieux culturels ou les services pratiques. Le projet global visait déjà des couches d'information utiles, mais cela ne remplace pas une planification explicite par ville.

**Acquis technique :** scène Bâle, centre/gare/Messe, bâtiments, seize parkings et leurs limites, qualification PC/A53 ; accueil commun PUB2 préparé. La validation par le propriétaire portait sur le fonctionnement et la fluidité de cet essai. Elle ne vaut pas acceptation d'un contenu Bâle terminé. Les preuves [P8](VALIDATION_P8.md) restent valables sur leurs versions.

**Nouveau périmètre produit :** ajouter les trois lots ci-dessous avant de présenter Bâle comme un explorateur enrichi. Ne pas partir sur une autre ville P9 pendant ce travail. Arbres, forêts et ponts deviennent des compléments visuels ultérieurs ; ils ne remplacent pas les informations recherchées.

## Lots dans l'ordre confirmé

| Lot | Résultat attendu | Condition de sortie |
| --- | --- | --- |
| **B1 — Transports** | Arrêts/quais tram et bus, lignes, sens/destination, opérateur et informations d'accès disponibles ; filtres et fiches, liens d'horaires officiels vérifiés. | Points et tracés comparés aux sources, catégories et quai/arrêt distingués, géométrie/secteur maîtrisés, activation sans doublon, erreurs/réessais et contrôle A53. Aucune position de véhicule, heure de passage ou accessibilité garantie déduite d'un réseau statique. |
| **B2 — Lieux à visiter et patrimoine** | Musées, monuments et lieux remarquables, noms/catégories/descriptions disponibles, liens officiels et sélection utile sur la carte. | Source(s) et droits d'usage choisis puis testés ; positions et fiches vérifiées sur un échantillon. Aucun nom attribué par proximité à un bâtiment 3D, aucun horaire ou texte touristique inventé. Le nombre de fiches et la couverture seront ceux des sources réellement retenues. |
| **B3 — Services pratiques** | Toilettes publiques/partenaires, tarifs et attributs utiles lorsqu'ils existent ; fontaines ou autres services selon qualité et droits confirmés. | Catégories et restrictions comprises, données absentes explicites, points/fiches/liens contrôlés, filtres et performance physique vérifiés. Ne pas déduire ouverture actuelle, eau potable ou accès universel d'un point sur la carte. |

Chaque lot commence par les données et conditions, puis un ajout local borné, un contrôle bureau et un contrôle mobile pertinent. Choix de couches explicite ; ne pas tout activer au démarrage. Conserver les couleurs/légendes, le regroupement des points, les filtres et les fiches lisibles en portrait/paysage. Relever les FPS et pauses avec/sans la couche ; réutiliser les références encore valides, sans demander de rebrancher un appareil pour de simples vérifications documentaires.

L'emprise des bâtiments P8 ne s'élargit pas automatiquement. Distinguer la couverture de chaque source, les objets affichés dans le secteur et la zone contenant des bâtiments ; annoncer toute limite dans l'interface. Mesurer un éventuel élargissement séparément.

## Sources réellement examinées le 26 octobre

Métadonnées officielles et un enregistrement de chaque jeu reçus HTTP 200, CORS `*`. Ce contrôle prouve l'accès et les champs ci-dessous, pas encore la conversion de l'ensemble, le rendu, la justesse de tous les objets ou une permission identique pour toutes les couches. Preuve locale `.vite/planning/basel-info-sources.json`.

| Usage | Source et contenu observé | Conditions annoncées / vérification restante |
| --- | --- | --- |
| Tracés | [100064 — réseau de transports publics](https://data.bs.ch/explore/dataset/100064/) : **187 objets**, géométrie, numéro, parcours/sens, véhicule, offre, opérateur. | Métadonnées : **CC BY 4.0 + OpenStreetMap**, attribution Geodaten Kanton Basel-Stadt ; mise à jour indiquée 09.02.2026. Lire les modalités des deux composantes avant redistribution. Ce ne sont ni 187 lignes commerciales distinctes ni un flux GPS. |
| Arrêts/quais | [100065 — sous-arrêts de transports publics](https://data.bs.ch/explore/dataset/100065/) : **660 objets**, nom, sens, type, lignes tram/bus/nuit, lien d'horaire, attributs d'accès tram/bus. | Même mention **CC BY 4.0 + OpenStreetMap**, même attribution et date indiquée. Contrôler la distinction arrêt/quai, les valeurs d'accès et les liens ; ne pas annoncer 660 pôles uniques ou une accessibilité actuelle certifiée. |
| Toilettes | [100031 — installations sanitaires](https://data.bs.ch/explore/dataset/100031/) : **159 objets**, type, état, catégorie, désignation/adresse, supplément, tarif, Eurokey, lien. | **CC BY 4.0**, attribution Geodaten Kanton Basel-Stadt ; mise à jour indiquée 10.08.2026. Comprend installations publiques et « Nette Toiletten » : vérifier conditions d'accès et lecture des champs, sans promettre une ouverture en direct. |
| Fontaines — candidate conditionnelle | [100008 — fontaines de baignade, d'eau potable et décoratives](https://data.bs.ch/explore/dataset/100008/) : **305 objets**, nom, description et position ; types à extraire/valider. | Attribution **IWB Industrielle Werke Basel**. La métadonnée impose la source et soumet l'utilisation commerciale à autorisation : **ne pas assimiler à CC BY**, ni considérer toutes les fontaines comme potables. Ne pas en faire un livrable acquis avant résolution du périmètre d'usage et contrôle du contenu. |
| Musées/patrimoine | Besoin B2 confirmé, mais aucun jeu de positions/fiches n'a été retenu et qualifié dans cette révision. | Recherche et choix à faire auprès de sources officielles ; le repérage d'une page web ou d'un texte de loi n'est pas la preuve d'un jeu cartographique réutilisable. |

Les liens de catalogue ci-dessus exposent les métadonnées ; API correspondantes : `https://data.bs.ch/api/explore/v2.1/catalog/datasets/{id}` et `/records?limit=1`. Les nombres sont ceux des réponses reçues ce jour, pas des garanties de couverture ou d'actualité.

## État, Git et publication

Cette révision documentaire et le commit de sauvegarde du travail testé sont autorisés par le propriétaire. Elle n'ajoute aucune couche dans l'application. **Bâle fonctionnellement enrichi reste ouvert**, B1/B2/B3 non implémentés ; prochaine action : qualification complète des données B1 puis ajout local des transports.

PUB2 est prêt techniquement pour une revue locale, mais sa publication est différée pendant l'enrichissement : le propriétaire conteste justement l'intérêt d'un Bâle limité aux parkings. Aucun push ou déploiement exécuté dans ce lot de sauvegarde. Une éventuelle mise en ligne de l'essai limité doit être présentée comme telle, sans annoncer ces fonctionnalités futures comme présentes.
