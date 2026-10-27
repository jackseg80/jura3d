# B2 — Lieux à visiter et patrimoine de Bâle

27 octobre 2026, base `bb20b6e`. **B2 clos avec réserves après contrôles PC et qualification A53 avec retour d'usage positif.** Coût en rotation,30FPS constants non acquis, couverture et champs incomplets des sources conservés comme limites. Référence B1 figée `.vite/basel-mobile-fix/site-delivery/` sur4317 conservée, nouvelle livraison `.vite/b2/site-delivery/` sur4320 ; pas de push/déploiement, modèle/effort conservés, aucun sous-agent.

## Sources choisies et limites

Catalogue STAC officiel : [BIPO](https://api.geo.bs.ch/stac/v1/collections/BIPO), [BIFO](https://api.geo.bs.ch/stac/v1/collections/BIFO), licences annoncées `CC-BY-4.0`. [Conditions cantonales](https://www.bs.ch/en/node/29871) lues : données publiques avec service de téléchargement réutilisables avec crédit « Quelle: Geodaten Kanton Basel-Stadt », y compris usage commercial ; ne pas appliquer ce régime aux données restreintes. Aucun service authentifié ou clé utilisée. Le catalogue seul ne qualifie pas les fiches : les trois collections OGC ont été lues jusqu'à leurs effectifs complets.

| Collection GeoBS | Reçus le27octobre | Contenu et limites |
| --- | --- | --- |
| `ch.bs.basel_info_points_of_interest_bipo.kultur_unterhaltung` | 72points | Musées/expositions/collections, concerts/théâtres/conférences ; noms, adresse, téléphone, liens fournis.45descriptions absentes. |
| `ch.bs.basel_info_points_of_interest_bipo.sehenswuerdigkeiten` | 70points | Sites archéologiques, panoramas, bacs, fontaines remarquables, centre du canton ;19descriptions et22liens absents. Pas d'indication de potabilité déduite. |
| `ch.bs.basel_info_bifo.landmark` | 44points | Repères cartographiques dont Münster, Rathaus, Spalentor et bâtiments contemporains/industriels ; noms et classe graphique, aucun lien ni description fournis. Ce ne sont pas44monuments protégés ou lieux ouverts au public. |

Total186repères source, pas186lieux physiques uniques. Noms/catégories/propriétés et coordonnées Point WGS84 conservés, sans jointure aux bâtiments, fusion par proximité ni description inventée. Catégories d'affichage traduites séparément ; noms/textes souvent allemands. Le cadre des bâtiments reste celui de B1/P8 ; certains lieux dépassent ce cadre et la ville. Identifiants de service préfixés par collection dans la session, sans promesse de stabilité entre publications.

L'autre candidat `DMVS` (registre des monuments) a été échantillonné :1045polygones annoncés,1000reçus sur la première page,389noms renseignés parmi ceux-ci, liens vers documents juridiques. **Pas lu en entier, pas retenu ni affiché** : il ne remplace pas des fiches de visite, et son statut juridique ne doit pas être attribué aux repères BIFO. Catalogue/métadonnées publics conservés pour un éventuel complément distinct.

## Implémentation retenue

Trois collections à la demande, contrôle des licences BIFO/BIPO avant chargement, pagination propre à l'origine HTTPS/compte complet et rejets des doublons, coordonnées ou réponses incohérentes. API GeoBS publique, CORS `*` reçu sur les collections ; liens `http` annoncés par le catalogue non suivis, URL HTTPS vérifiée utilisée. Aucune copie des positions livrée dans le build. Cache mémoire jusqu'au rechargement, pas de suivi en direct.

Couche désactivée au démarrage, groupes `L + nombre`, filtre catégorie et secteur autour de la destination~5km ou tous les lieux fournis. Fiches natives, liens fournis distingués des métadonnées officielles ; absence explicite des champs. Pas de fréquence de publication assimilée à la date d'observation d'un lieu. Annulations/bascules/destruction/retrait des seuls objets propres et coexistence bus/parkings contrôlés sur PC ; périmètre physique décrit ci-dessous.

## Contrôles réalisés et suite

Lecteur réel qualifié sur les186enregistrements : toutes propriétés/géométries identiques aux réponses officielles, cinq requêtes200/CORS*. Neuf fiches échantillonnées, six liens fournis : cinq200 reçus, un échec `fetch failed` sur Papiermühle ; les trois repères BIFO de l'échantillon n'ont pas de lien de visite. Aucune indisponibilité générale ou validation exhaustive des liens déduite. Métadonnées BIFO/BIPO reçues200, publication BIPO annoncée25octobre/fréquence hebdomadaire, pas une observation par lieu. `qualification.json` conserve les états et positions.

Tests purs B2 : non-mutation, identifiants par collection, catégories séparées, géométrie/liens/distance, conditions modifiées, pagination1001objets, doublons/réponse partielle/changement d'effectif/HTTP rejetés. Configuration territoriale et autres tests purs réussis ; test parkings adapté à la recherche du kind plutôt qu'au premier index,18contrôles repassés. Builds autonome et site réussis, ressources/licences/Workers contrôlés.

Premier probe B2 à18:44:46 Europe/Zurich : six groupes de contrôles, zéro erreur. Après observation de chevauchements et mesure A53, regroupement changé de28px/min4 à44px/min2 : identités conservées dans les groupes, y compris deux sources proches ; gain de performance de ce changement non établi. Probe du dernier build à18:53:10 : six groupes/zéro erreur, neuf fiches comparées, vrai clic sur Münster et groupe de cinq identités/choix, trois vues152/151/166points locaux, cache/bascules/retrait des seuls objets propres, coexistence3sources avec bus/parkings, HTTP503/licence modifiée/réponse partielle/réessai et destruction pendant requête contrôlés. Fiches/panneau tactiles simulés390×844/844×390/722×274, titre/fermeture/crédits accessibles. [Capture choisie](images/b2-fiche-musee-2026-10-27.png).

### A53 physique, deux campagnes courtes

SM-A536B/Android16/Chrome156.0.8078.47/Mali-G68, portrait natif360×666/DPR3, Faible0,6/tampon216×400/MSAA1/SSE9,6 ; bâtiments et transports locaux complets, L désactivés/activés. Chaque campagne :12fenêtres/72lectures,6lectures espacées1s après stabilisation2s, rotation250ms, ordre inversé à la gare. Même caméra, dimensions et identités de transports contrôlées ; source/empreintes du build vérifiées sur le téléphone. Caches/fréquences non verrouillés ; pas de généralisation à un geste lent, une autre vue ou une longue session.

| Vue | Dernier build fixe sans L → avec L | Rotation sans L → avec L | Minimum rotation avec L | Pauses>100ms sans L → avec L |
| --- | --- | --- | --- | --- |
| Centre | 44,5 →41,5 | 17,5 →12 | 4 | 12 →23 |
| Gare CFF | 33,5 →33,5 | 21 →18,5 | 11 | 14 →12 |
| Messe | 53,5 →52 | 21,5 →19,5 | 4 | 15 →16 |

FPS médians, deuxième campagne18:51:34–18:55:01 Europe/Zurich, température25,6–26,5°C/thermique0, USB branché. **Coût mobile visible,30FPS constants non acquis** ; aucune amélioration uniforme du regroupement revendiquée. Première campagne min4 conservée : rotation17→12,5/23,5→17,5/26,5→23, pas une comparaison causale entre deux campagnes. Les six blocs de chaque campagne ont restauré la préférence initiale absente de4178 et fermé seulement leurs cibles, absences vérifiées.

### Comparaison Intel du build final

18:57:55–19:01:27 Europe/Zurich, Intel UHD0xA788 vérifié dans Chrome éphémère, Faible et dimensions mobiles simulées360×666/DPR3, mêmes bâtiments/transports/caméras, L coupés/actifs ;12fenêtres/72lectures et compte GPU via requêtes WebGL disjoint. Paramètres et identités/géométries de transport comparés, pas d'autre probe PC simultané. Aucune modification GPU Windows ; les hooks de mesure restent dans le banc ignoré, pas dans les fichiers livrés.

| Vue | FPS fixes sans L → avec L | FPS rotation | GPU fixe ms | GPU rotation ms |
| --- | --- | --- | --- | --- |
| Centre | 115 →108 | 132 →127 | 7,91 →8,33 | 6,78 →7,13 |
| Gare CFF | 84 →84 | 134 →138 | 10,96 →10,92 | 6,51 →6,51 |
| Messe | 143 →143 | 140 →135 | 4,12 →4,32 | 5,72 →5,87 |

Pauses>100ms : une dans la rotation centre sans L, zéro dans les autres fenêtres. Coût faible dans ces conditions PC, variations/fréquences/caches/plafond empêchent toute garantie et ne qualifient pas l'onglet intégré du propriétaire ni le téléphone. Le coût plus marqué de l'A53 est conservé ci-dessus.

### Usage manuel, nettoyage et bilan final

Dernier build vérifié par SHA sur le téléphone ; vrai toucher injecté sur Kunstmuseum/titre/lien/crédit contrôlés. Onglet manuel ouvert18:55:22–19:07:29 Europe/Zurich, durée incluant attente et pauses, pas12minutes d'usage continu revendiquées. Trois vues centre/gare/Messe,132événements, sélections lieu/groupe L/bâtiment/quai, portrait360×666 et paysage722×274 observés, retour final portrait. Le propriétaire répond : « ça me paraît correct, surtout pour un A53 ». Acceptation globale de l'usage ; l'observateur ne capture ni clic externe, ni changement de catégorie/secteur. Ne pas déduire ces gestes de ce retour : filtres/tous les lieux/liens sont contrôlés sur PC, pas un parcours physique exhaustif de chaque commande ou un réseau entier chronométré.

Nettoyage19:07:30 : préférence initiale absente restaurée/relecture, seul target manuel fermé/absence vérifiée, forward9228/reverse4178 retirés après contrôle des destinations, listes vides ; autres onglets préservés. Batterie89%,29,1°C/thermique0, USB alimenté mais état Android4 (non en charge à cet instant), pas de qualification d'autonomie. A53 débranchable. Aucun Browser.close Android, réglage radio/VPN/rotation ou GPU Windows modifié.

Régression complète Jura du build final terminée à19:08:14 Europe/Zurich, zéro problème, P1/P3/P4/P6 et pannes/récupérations. Bâle parkings/B1/site ont passé les régressions initiales ; le seul changement ultérieur concerne le regroupement B2, vérifié par le nouveau probe. Le premier passage Jura chevauchait cette recompilation et reste intermédiaire ; le rapport final est `verified/probe-jura.json`.

Livraison Bâle `index-BBcKTKC_.js` (SHA256 `90400d96e0a5e381812dd642a89bda442423ba86efcf189b339cd250b5c3fffc`), Jura `index-7QUvOH_T.js` (`74a64fe258585852c6daedf6751e3349df13a6de3d6df94a2808c7ce9d031add`), CSS `index-BIPXuHPI.css`, révision embarquée locale null. `built-inputs.json` et `final-check.json` relient les sources, fichiers figés/servis, rapports/paramètres/identités et nettoyage. Le descriptif d'accueil Bâle annonce ensuite les musées/lieux ; recompilation et contrôle HTML/ressources réussis, les deux applications 3D restent strictement identiques aux empreintes testées. B1 de référence et toutes les preuves antérieures conservés ; ne pas modifier ces dossiers pour un prochain build.

**Bilan B2 :** périmètre des trois collections qualifié avec les réserves ci-dessus. S23, autonomie, exactitude exhaustive des positions/liens, gestes physiques détaillés non observés et30FPS constants non qualifiés. Bâle enrichi reste incomplet : prochaine étape B3 services, d'abord sources/droits/catégories et conditions d'accès ; publication distincte et différée.

Preuves ignorées `.vite/b2/` : catalogues/conditions/métadonnées/réponses et scripts d'audit, `qualification.json`, builds/logs, `probe-first` et `probe-clusters`, régressions initiales, `a53-paired.json`, `a53-clusters.json`, `a53-manual.json`, `paired-low.json`, `verified/`, livraison `site-delivery/`. Ces téléchargements/prototypes ne sont pas livrés dans l'application. B3 et publication différés.
