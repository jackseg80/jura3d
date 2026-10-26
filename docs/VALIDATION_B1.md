# B1 — Transports à Bâle

**Complément du 26 octobre au soir : la performance B1 reste à corriger sur GPU intégré, avant l'A53.** L'onglet du propriétaire est celui de ChatGPT et affiche Intel UHD, pas la RTX. [Diagnostic instrumenté et comparaison Delémont/Bâle](DIAGNOSTIC_B1_TRACES.md). Les résultats fonctionnels et les mesures RTX ci-dessous gardent leur périmètre ; ils ne sont pas une validation de la fluidité de cet onglet. Aucun changement de renderer effectué par le diagnostic.

26 octobre 2026. Ajout local autorisé par « ok » après le plan B1/B2/B3. Base Git `44266f7`. **B1 réalisé et vérifié sur PC ; qualification A53 ouverte.** Bâle enrichi n'est pas terminé : B2 lieux/patrimoine et B3 services restent à réaliser. Aucune publication ; aucune connexion ou modification Android durant B1.

## Ce qui est disponible

Ouvrir [l'accueil local](http://127.0.0.1:4306/jura3d/), choisir Bâle puis « Tram, bus et horaires ». Couche désactivée au départ ; son activation affiche les quais, les tracés étant activables séparément. Filtres tram/bus et secteur autour de la destination ou tout le réseau fourni. Repères **T**, **B**, **T/B** ; **R + nombre** désigne un groupe de quais à choisir dans une liste. Un quai source reste distinct d'un pôle d'arrêt.

Fiches avec nom, sens/destination, lignes tram/bus/nuit, identifiants, attributs d'accès fournis ; pour les tracés : numéro, sens, opérateur et offre source. Les termes de la source sont conservés, notamment certaines valeurs allemandes. Aucun accès réel certifié, nom de bâtiment déduit, départ, perturbation ou position de véhicule en direct. Bordeaux : tram ; bleu : bus ; tracés nocturnes en pointillés.

Les titres distinguent les points par une **référence source**, pas par un numéro de quai physique : `thst_nr` est l'identifiant du catalogue et n'est pas présenté comme un panneau sur place.

Le réseau dépasse le centre et parfois le canton. Les bâtiments gardent leur cadre P8 ; une couche de transports plus étendue n'élargit pas le modèle 3D. Le secteur choisit les objets à environ 5 km de la destination ; les tracés de rendu sont découpés à 5,25 km et simplifiés à 1 m dans la projection locale P6. Pas de raccord fictif entre deux portions disjointes. Le réseau entier reste un choix explicite, sans découpe locale.

## Sources et conditions vérifiées

Provenance [basel-transit-sources.json](../data/basel-transit-sources.json), avec URL, dates, droits, effectifs et empreintes des lectures. Données complètes reçues le 26 octobre via API, ordre stable par identifiant, pagination contrôlée :

| Jeu | Contenu reçu | Contenu retenu |
| --- | --- | --- |
| [100064 — réseau de transports](https://data.bs.ch/explore/dataset/100064/) | 187 objets, identifiants uniques ; LineString et MultiLineString. | **161 tracés** : 46 tram, 15 tram nocturnes, 86 bus, 14 bus nocturnes. Exclus du périmètre B1 : 4 traversées de bac, 2 bateaux, 15 S-Bahn et 5 S-Bahn nocturnes. Ce ne sont pas 161 lignes commerciales distinctes. |
| [100065 — sous-arrêts](https://data.bs.ch/explore/dataset/100065/) | **660 points**, identifiants de quai uniques ; Point WGS84. | 317 quais tram, 324 bus, 19 mixtes ; pôle d'arrêt et sens conservés, sans fusion de quais. |

Les métadonnées annoncent **CC BY 4.0 + OpenStreetMap** et l'attribution Geodaten Kanton Basel-Stadt. Leur document lié [22.08.2024](https://data-bs.ch/stata/dataspot/permalinks/20240822-osm-vektordaten.pdf) a été reçu HTTP 200 et lu intégralement : il concerne l'incorporation des données CC BY dans OpenStreetMap et les modalités correspondantes. Les [conditions du portail](https://data.bs.ch/terms/terms-and-conditions/) et [copyright/ODbL OpenStreetMap](https://www.openstreetmap.org/copyright) sont référencés. Attribution Basel-Stadt et OpenStreetMap contributors, liens CC BY/ODbL et catalogues présents dans l'interface. Ne pas étendre la licence MIT du code aux données.

Les deux catalogues déclarent `modified = 09.02.2026`, mais `modified_updates_on_data_change = false` : **ce n'est pas une date d'observation de chaque objet ni la garantie d'un instantané figé ce jour-là**. L'interface dit « Date annoncée au catalogue ». La date de traitement/lecture du 26 octobre ne prouve pas l'actualité du réseau. Les propriétés source restent intactes ; une copie géométrique distincte sert au rendu.

## Horaires : liens effectivement contrôlés

Les deux URL présentes dans les quais ont renvoyé **404** : ancien chemin BVB (HTTP puis HTTPS) et PDF TNW Bahnhof St. Johann. Elles ne sont pas proposées comme liens valides. Les fiches indiquent le contrôle du 26.10.2026 et proposent les pages générales officielles [horaires par arrêt](https://www.bvb.ch/de/fahrplan/haltestellen-fahrplan/) et [plans du réseau](https://www.bvb.ch/de/fahrplan/liniennetz/), reçues HTTP 200. Chercher l'arrêt ou le numéro : aucun lien prérempli ou PDF propre à chaque tracé inventé. Les autres URL éventuelles doivent passer une liste de domaines/chemins HTTPS stricte ; aucune requête, redirection libre ou code javascript admis.

## Chargement et cycle de vie

`basel-transit-data.js` valide les pages, effectifs, identifiants, coordonnées, géométries, modes et listes source ; refuse doublons, réponses partielles et changement de mention de licence. La première activation demande **11 réponses** (deux métadonnées, deux pages de tracés et sept de quais). Pas de requête avant activation, pas de polling ; cache dans l'onglet, bascule et refresh du registre réutilisent ce cache. Recharger la page pour relire les services. Aucun instantané de réseau ou secours « actuel » livré avec le site.

L'adaptateur conserve les propriétés originales et ajoute des champs d'affichage séparés. Le composant `transport.js` partage le rendu, regroupement, sélection, découpe, cache géométrique et annulation P6/P7 avec le Jura ; les fiches et filtres Bâle restent spécifiques. Délai de chargement 20 s, requêtes abortables, génération anti-réponse tardive, destruction idempotente. Erreur/réessai des couches accessible panneau replié. Parkings et transports peuvent coexister sans source en double.

## Vérifications PC

- Tests B1 de schéma, LineString/MultiLineString, modes exclus/nocturnes/mixte, propriétés non mutées, identifiants/coordonnées invalides, liens dangereux, pagination complète/partielle, changement de licence, HTTP et annulation. Jeux complets réellement parsés : **821 objets retenus** (660 quais + 161 tracés), 70 474 points de tracés source.
- Configuration des territoires, 18 cas parkings et géométrie P6 des 140 tracés Jura réussis. Builds Bâle autonome et site en sous-dossier réussis ; aucune donnée cantonale Jura livrée à Bâle. Avertissement Cesium >500 ko connu.
- Probe B1 final : chargement à la demande, filtres et secteurs, fiches/repères réellement touchables, clic sur un groupe de cinq quais et choix de fiche, liens/crédits, cache/coexistence, panne/réponse partielle/réessai, destruction pendant requête et portrait/paysage simulés **390×844 / 722×274**. Rapport `.vite/b1/delivery/probe-transit.json` terminé à **15:41:10 Europe/Zurich**, six groupes/zéro erreur sur l'assemblage final `site-delivery`. Captures examinées ; rapports intermédiaires conservés distinctement.
- Avec les parkings et les transports actifs en paysage, attribution swisstopo/Basel-Stadt/OSM visible, zone de commandes de **126 px** et liens détaillés de **44 px** dans « Sources et conditions ». Ce contrôle est inclus dans le rapport final (`compactCredits`). Les premières mesures de panneau ne réclamaient pas explicitement une scène prête : elles sont conservées comme observations, sans comparaison causale chiffrée avant/après.
- Régression complète Jura et parcours normal du site : voir le bilan final daté ci-dessous. Le contrôle antérieur `probe-jura-ready.json` terminé à **15:37:57**, zéro erreur, concerne le panneau final avant une dernière correction de libellé de référence dans les groupes de tracés bâlois. Chrome **156.0.8078.47/RTX 4080 Laptop GPU**. L'ancienne comparaison `final-caption-diff.json` ne porte que sur deux versions intermédiaires et ne prouve pas l'identité des bundles finaux.
- Premier essai échoué au démarrage : sélecteur de secteur supposé `all`, valeur réelle vide ; corrigé avant qualification. Rapport/journal `probe-transit-failed-startup.*` conservés et exclus. Les versions intermédiaires restent distinctes des finales.
- Une reprise intermédiaire du site a relevé `ERR_HTTP2_PROTOCOL_ERROR` sur une tuile du serveur `3d.geo.bs.ch` et une attente de scène prête expirée ; rapport `.vite/b1/site-release/probe-site.json` conservé comme échec. Un probe B1 parallèle a également expiré avant le scénario de panne (`release/`), sans cause établie par son rapport. Ces essais ne sont pas comptés comme réussis et aucun contournement des services n'est ajouté.

| Vue, réseau local avec tracés | Points source des tracés retenus | Points de rendu | Portions |
| --- | --- | --- | --- |
| Centre | 69 689 | 15 229 | 180 |
| Gare CFF | 68 181 | 14 460 | 162 |
| Messe | 70 130 | 15 575 | 180 |

Ces nombres concernent la géométrie de transport, pas les triangles des bâtiments ni un temps GPU. Les 717/699/773 objets filtrés selon la vue mêlent quais et tracés ; ne pas les présenter comme des nombres de lignes.

## Relevé PC court, sans conclusion Android

### Bilan final de compilation et de régression

Sur `.vite/b1/site-delivery/`, probe complet **Jura P1/P3/P4/P6 terminé à 15:46:37 Europe/Zurich**, zéro problème (`probe-jura-delivery.json`). Le parcours normal de l'accueil, des deux cartes, des fiches/liens et des retours est terminé à **15:42:54**, quatre groupes/zéro erreur (`site-delivery-check/probe-site.json`). `npm run build` autonome et `npm run build:site` réussis, contrôles de fichiers/données/licences réussis. Seul avertissement de compilation : taille du bundle Cesium connue.

Manifest `.vite/b1/final-check.json` : empreintes des sources et des index/JS/CSS, égalité des index servis sur4306 avec le build conservé, rapports et version publique relus. Bâle **`index-C4MRW3TR.js`**, Jura **`index-BVus8miC.js`**, CSS **`index-BIPXuHPI.css`** ; la révision du marqueur local est `null`, pas une révision publiée. Site public vérifié : PUB1 Jura `29a4089a94bd5a3a5626da5c33cf1c1276a497ae`. Aucun push/déploiement et aucun contrôle Android B1. Les rapports des versions intermédiaires restent distincts.

### Conditions et résultats du relevé antérieur

RTX 4080 Laptop, **753×1030 CSS/DPR 1**, Moyen **0,75/MSAA 1**, ombres coupées, soleil 21 juin 2026 14:00 UTC. Trois vues × réseau coupé/quais/quais et tracés, deux secondes de stabilisation puis huit lectures FPS natives pendant rotation toutes les 250 ms. **15:01:14–15:03:19 Europe/Zurich**, neuf fenêtres/72 lectures, aucune erreur ou pause RAF ≥100 ms relevée.

| Vue | Réseau coupé médiane/min FPS | Quais seuls | Quais et tracés |
| --- | --- | --- | --- |
| Centre | 143 / 131 | 143 / 142 | 143 / 138 |
| Gare | 143 / 127 | 140 / 134 | 142,5 / 116 |
| Messe | 143 / 139 | 143 / 143 | 143 / 140 |

Ordre fixe, caches ordinaires et cadence proche du plafond : **pas de coût causal isolé ni de gain affirmé** lorsque l'une des étapes est plus rapide. Pas de temps GPU, puissance, fréquence ou mémoire totale mesuré. Relevé effectué sur `site-validated`, avant la clarification de libellés et la présentation compacte des crédits ; géométrie et algorithme de rendu conservés, mais ce relevé n'est pas celui de l'empreinte finale. Ces nombres PC ne prouvent ni la fluidité ni la chauffe A53 ; les anciens résultats physiques P8 ne qualifient pas l'ajout B1.

## Reprise

Preview de revue sur **http://127.0.0.1:4306/jura3d/**, version `.vite/b1/site-delivery/` ; références P8/PUB2 conservées dans leurs dossiers. Previews intermédiaires 4307/4308 arrêtées, références P8 4300/4305 conservées. `scripts/probe-basel-transit.mjs` accepte `JURA3D_URL`/`JURA3D_PROBE_OUTPUT`, `JURA3D_PROBE_GPU=high`. Tests `node scripts/test-basel-transit.mjs`, compilation `npm run build:site` avec `JURA3D_BASE_PATH=/jura3d/`.

Préserver `.vite/b1/` : sources brutes/conditions, audit des données, rapports, comparaison de bundles, relevé PC et manifests finaux. Prochaine action : **A53 en Faible**, quais puis tracés/both, gestes/fiches/groupes/retour et portrait/paysage, durée et chauffe ; identité et accès vérifiés à neuf, préférences restaurées et seuls accès créés retirés ensuite. **B1 reste ouvert pour cette qualification**, B2/B3 non commencés. Aucun push/déploiement ; site public Jura inchangé.
