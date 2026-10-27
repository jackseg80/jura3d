# B3 — Installations sanitaires et services pratiques

27 octobre 2026, base `affe4f5`. **Contrôles PC et mesures terminés, parcours manuel A53 ouvert.** B2 figé sur4320 `.vite/b2/site-delivery/` conservé, aucun push/déploiement ; modèle/effort conservés, aucun sous-agent. B3 commence par les WC, urinoirs, toilettes partenaires et douches du jeu100031. Fontaines IWB100008 non intégrées, toujours soumises à leurs conditions distinctes ; aucune potabilité déduite des repères B2.

## Source et qualification des données

[Catalogue100031](https://data.bs.ch/explore/dataset/100031/), API Explore2.1 publique, **CC BY4.0** et attribution Geodaten Kanton Basel-Stadt reçues, CORS*.159records lus sur deux pages100+59,159identifiants distincts ; `geo_shape` Point WGS84 et `geo_point_2d` identiques pour tous les objets.75types adaptés fauteuil,30types non adaptés,12urinoirs,16douches,26toilettes partenaires non adaptées selon le champ source.45Eurokey oui/114non ;153en service/6fermées ;154gratuites/5payantes ;12compléments saisonniers. Ces effectifs sont ceux reçus, pas une couverture ou actualité garantie.

Métadonnée `modified`10août2026, `modified_updates_on_data_change:false` ; traitement du27octobre ne date pas chaque installation. Pas d'horaires individuels ni observation par lieu. `in Betrieb` rendu « déclaré en service · pas de temps réel », pas « ouvert maintenant ». `eurokey:false` conservé comme non indiqué, distinct d'une valeur absente ; équipement et type fauteuil ne certifient pas l'accès réel.

La [page officielle WC/douches](https://www.bs.ch/bvd/tiefbauamt/oeffentliche-toiletten), datée13août2026 et lue, annonce WC publics gratuits, toilettes partenaires accessibles sans obligation de consommer et douches du Rhin saisonnières. **Divergence tarifaire : cinq flags payants dans le jeu** (Voltamatte, trois installations Barfüsserplatz, Rheinuferpromenade). Garder les valeurs natives et « montant non fourni », sans arbitrer la contradiction ni inventer un prix. Pour les partenaires, accès/horaires à vérifier auprès de l'établissement ; le lien fourni est une page générale cantonale, pas une fiche individuelle.

Provenance et effectifs : `data/basel-sanitary-sources.json`. Les attributs natifs restent intacts dans `native`/`feature.properties`, géométrie d'affichage issue de `geo_shape.geometry` ; traductions/résumés distincts. Téléchargements d'analyse ignorés `.vite/b3/metadata.json`, `first.json`, `last.json`.

## Implémentation et contrôles requis

Lecteur100031 à la demande : licence/attribution, pagination complète triée par identifiant, doublons/positions et attributs vérifiés ; cache mémoire jusqu'au rechargement, aucun polling ou snapshot distribué. Adaptateur `services`, repères WC/groupes W, gris pour fermeture signalée, filtres catégorie/Eurokey et secteur5km ou toutes les installations. Couche masquée au départ. B2 et B3 partagent désormais le composant de points `point-places.js` ; loaders, schémas, filtres et fiches restent distincts. Refaire B2 pour cette extraction ; Jura ne change pas d'adaptateur patrimoine.

Tests purs B3, B2, configuration, parkings, découpage bâtiments et géométrie/rendu transports réussis. Builds autonome et site `/jura3d/` réussis ; aperçu candidat4322, copie figée `.vite/b3/site-delivery/`, entrées et empreintes `built-inputs.json`. Bâle `index-Bdb7QS-S.js`, Jura `index-ZvXbDZqX.js`, CSS `index-BIPXuHPI.css`, métadonnées locales sans révision publiée. B2 figé reste préservé ; son aperçu4320 a été rétabli sans modifier sa livraison.

Probe sanitaire six groupes/zéro erreur (`probe-first/probe-sanitary.json`) : chargement volontaire et trois requêtes, complétude/filtres, huit fiches natives, vrai clic d'un repère et groupe, trois vues, ouverture réelle de la page officielle dans un onglet propre refermé, coexistence des quatre couches/cache/retrait, panne503/licence changée/pagination partielle/réessai/annulation/destruction, tactile simulé portrait et paysages. [Exemple de fiche et tarif source](images/b3-paid-card.png). Probe B2 après extraction six groupes/zéro erreur (`places-final/probe-places.json`), Bâle six groupes (`basel-final/probe-basel.json`), transports six groupes (`transit-resumed/probe-transit.json`) et accueil/deux territoires (`site-final/probe-site.json`) réussis. Tentative transports interrompue conservée séparément ; aucun échec reclassé en réussite. Régression Jura complète P1/P3/P4/P6 réussie20:39:26UTC, zéro problème ; comparaison Intel terminée20:42:59UTC, zéro erreur. Suite reprise terminée/code0, maintien éveillé PC temporaire relâché.

A53 initialement indisponible, puis rebranché par le propriétaire : identité/Chrome/accès vérifiés à neuf, forward9228 et reverse4322 temporaires créés après listes vides. Comparaison Faible sans/avec sanitaires terminée, bâtiments/lieux/transports actifs ; test manuel physique et nettoyage final encore ouverts. Aucune modification des réglages système. Ne pas clore B3, déduire Android du tactile simulé, annoncer les fontaines ou la disponibilité actuelle.

## Première comparaison physique A53

27 octobre au soir, Chrome156/Mali-G68, portrait360×666/DPR3, qualité Faible/résolution0,6/MSAA1. Bâtiments, lieux B2 et arrêts+tracés locaux actifs ; seuls les sanitaires sont basculés. Trois vues, ordre inversé à la gare,12fenêtres de6secondes/72lectures. Caméras et identités/géométries transports comparées, six onglets propres fermés avec préférence initiale restaurée à chaque bloc. Batterie23,8–24,6°C, thermique0 dans les relevés. Aucun réglage système changé.

| Vue | Fixe sans WC | Fixe avec WC | Rotation sans WC | Rotation avec WC |
| --- | --- | --- | --- | --- |
| Centre | 44,5 | 43,5 | 16 | 15,5 |
| Gare CFF | 36 | 14 | 21,5 | 13 |
| Messe | 59 | 56,5 | 24,5 | 20,5 |

FPS médians sur fenêtres courtes, minima et pauses conservés dans `.vite/b3/a53-paired.json` ; pas de30FPS constants ou autonomie démontrés. Baisse plus forte à la gare au premier passage : contrôle supplémentaire terminé sur une même scène chargée, quatre alternances fixe sans/avec/sans/avec,8secondes de stabilisation puis6lectures chacune, mêmes caméras et objets transport. Résultats35/35,5/35/33FPS (`a53-sbb-warm.json`), zéro erreur applicative. La forte baisse fixe ne se reproduit pas dans ces conditions ; effet de chargement/caches possible, cause non démontrée, aucune disparition des ralentissements en rotation déduite.

Fermeture du test gare demandée puis interrogée trop tôt dans ce script : assertion immédiate conservée en échec, préférence initiale restaurée ; absence du target confirmée ensuite (`a53-sbb-cleanup.json`). Première préparation manuelle également conservée (`a53-manual.json`) : fiche/empreinte vérifiées, mais le diagnostic n'a pas trouvé de repère isolé pour injecter le toucher sur ce viewport ; préparation arrêtée et onglet/préférence nettoyés. Reprise `a53-manual-resumed.mjs` vérifie la fiche par sélecteur et laisse les vrais gestes au propriétaire ; ne pas lui attribuer un clic automatique réussi. Parcours manuel et nettoyage final des deux accès restent requis.

## Comparaison Intel et contrôle final

Chrome Windows/Intel UHD, tactile simulé360×666/DPR3/Faible, bâtiments/lieux/transports actifs, sanitaires sans/avec.12fenêtres de6secondes/72lectures, ordre inversé à la gare ; caméras et géométries/identités transports identiques, même bundle final. Tests seuls sur le GPU PC pendant cette comparaison.

| Vue | Fixe sans WC | Fixe avec WC | Rotation sans WC | Rotation avec WC |
| --- | --- | --- | --- | --- |
| basel-centre | 122 | 120 | 134 | 137 |
| basel-sbb | 90 | 91 | 135 | 137 |
| basel-messe | 143 | 143 | 140 | 140 |

Faible variation dans ces vues/conditions, plafond et caches possibles ; aucune garantie sur un autre navigateur ou Android. Temps GPU/CPU et pauses conservés dans `.vite/b3/paired-low.json`. Contrôle `final-check.json` réussi : empreintes source, assets servis et figés, qualification native, rapports/probes, comparaisons et fermeture des blocs automatisés ; **ce succès technique conserve le statut physique pending**, pas une clôture du lot. `check-site` sur la copie figée réussit (ressources/licences/Workers/deux territoires).

Parcours A53 préparé dans `a53-manual-resumed.json`, couche services/lieux/transports actifs, fiche Ackerstrasse15 et lien/crédit vérifiés par sélecteur. Aucun événement utilisateur au dernier relevé, portrait seul ; aucun geste manuel ou acceptation déduit. Après retour : observer et nettoyer avec le script resumed, restaurer préférence initiale absente, fermer uniquement son target puis retirer forward9228/reverse4322 après vérification. Maintien temporaire de l’écran borné jusqu’à20:47:09UTC au plus tard, aucune préférence système changée. Aperçu4322 sert encore `dist-site`, identique à `.vite/b3/site-delivery/` ; ne pas reconstruire pendant le test. Aucun push/déploiement.
