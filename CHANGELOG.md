# Historique

## 2026-10-27 — Livraison Jura/Bâle enrichie revue localement

- Préciser l’accueil Bâle : bâtiments limités au centre, informations de visite/sanitaires statiques et observations de parkings datées.
- Étendre le contrôle de site normal aux couches Bâle et à la cohérence des versions accueil/cartes.
- Builds autonome/racine/Pages et deux parcours enrichis réussis sans erreur ; cartes identiques à B3, qualifications physiques conservées. [Revue et limites](docs/REVUE_PUB2_BALE.md), aucun push/déploiement.

## 2026-10-27 — B3 sanitaires qualifié avec réserves

- Ajouter100031 à la demande : WC/partenaires/urinoirs/douches, filtres type/Eurokey/secteur, fiches source et fermetures signalées, sans ouverture en direct ou montant inventé.
- Extraire le renderer de points B2 commun aux services, loaders/schémas natifs distincts, conserver les références validées.
- Tests purs/builds et contrôles PC B3/B2/Jura/Bâle/site réussis, comparaisons Intel/A53 terminées ; [mesures, pauses et limites B3](docs/VALIDATION_B3.md). Retour propriétaire positif, portrait/paysage observés et nettoyage final confirmé ; gestes détaillés non capturés et coût mobile restent explicites. Aucune intégration des fontaines IWB ni publication.

## 2026-10-27 — B2 lieux à visiter qualifié avec réserves

- Ajouter les lieux culturels, points d’intérêt et repères remarquables de Basel Info, chargés à la demande après contrôle des licences ; propriétés/positions natives conservées, aucune jointure aux bâtiments.
- Groupes L, catégories et secteur5km/toutes les sources, fiches avec champs absents explicites et liens fournis distingués de la source officielle. Cadre des bâtiments conservé, pas de statut de protection ou d'ouverture déduit.
- Tests de données/configuration, compilations et contrôles PC réussis ; regroupement44px/min2 pour conserver aussi les paires proches. A53 : coût en rotation conservé, usage accepté et portrait/paysage observés,30FPS constants non acquis ; préférence/onglet/accès propres nettoyés. [Contrôles et limites B2](docs/VALIDATION_B2.md). B3 reste à réaliser, aucun push/déploiement.

## 2026-10-27 — Correction candidate des bâtiments Bâle sur A53

- Découper le cadre bâlois par quatre plans avec repli polygonal, mêmes source/informations/seuils ; approximation de bord explicitée et tests ajoutés aux deux workflows.
- Comparaison physique A53 : rotation centre12→16,5FPS, gare17→27, Messe15,5→23 sur fenêtres courtes ; gain PC faible/non uniforme,30FPS constants non acquis. Retour propriétaire positif, portrait/paysage relevés et commandes/lien confirmés : B1 clos avec réserves.
- Builds et contrôles complets Bâle/Jura/site réussis ; préférence, onglet et accès propres A53 nettoyés. [Preuves et limites](docs/CORRECTION_BALE_A53.md). B2/B3 restent à réaliser, aucun push/déploiement.

## 2026-10-27 — A53 : fonctions contrôlées, performance Bâle à corriger

- Consigner 56 fenêtres/560 lectures sur Jura et Bâle, gestes Jura portrait/paysage et retour positif ; Bâle signalé à 5–10 FPS, qualification conservée ouverte.
- Préserver les pauses et chargements ; isoler le coût important des bâtiments à vue fixe, sans transformer le prototype de détail interrompu en correction validée.
- Auto restauré/relu et seuls onglets/accès de test nettoyés après reconnexion. Sources applicatives inchangées, aucun push/déploiement. [Bilan et reprise](docs/VALIDATION_TRANSPORTS_A53.md).

## 2026-10-27 — Retour PC après le portage Jura

- Consigner le retour global positif du propriétaire (« tout semble ok ») ; qualification A53 Jura/Bâle conservée ouverte. Documentation seule, aucune nouvelle mesure ni publication.

## 2026-10-27 — Rendu des tracés Jura en tuiles locales

- Étendre le fond des tracés optimisé à Jura, choix explicite du renderer par configuration, mêmes données et filtres ; arrêts/groupes/fiches/surbrillances et zones Noctambus distinctes conservés.
- Corriger une exception quand la sélection reçoit un groupe Cesium au lieu d’une entité unique ; tester le balayage des tracés avec zones, les couches résiduelles et la récupération après panne raster.
- Probes Jura/Bâle/site et comparaisons compilées Intel/RTX réussis ; [résultats, variations et limites](docs/OPTIMISATION_JURA.md). Qualification A53 des deux territoires ouverte, aucun push/déploiement.

## 2026-10-27 — Retour PC Bâle et extension Jura planifiée

- Consigner le retour propriétaire positif sur PC ; qualification A53 conservée ouverte.
- Ajouter le complément P6 pour étendre le rendu en tuiles aux tracés Jura, avec conservation des filtres/Noctambus/fiches et comparaison PC avant qualification mobile. [Plan](docs/OPTIMISATION_JURA.md). Aucun portage ou nouvelle mesure réalisé dans ce lot documentaire, aucun push/déploiement.

## 2026-10-26 — Optimiser le fond des tracés Bâle

- Tuiles transparentes calculées localement sur le terrain, même géométrie1m et identités source, quais/groupes/fiches conservés, surbrillance vectorielle du tracé choisi ; rendu Jura P6 conservé.
- Cache de canvas borné, retrait sur filtre/désactivation/destruction, erreur de génération et réessai ; tests géométriques/pixels/jointures/pointillés et parcours compilés réussis.
- Comparaisons Intel/RTX à vues égales, limites et reprise documentées dans [OPTIMISATION_B1.md](docs/OPTIMISATION_B1.md). A53 et retour utilisateur intégré ouverts, B2/B3 différés. Aucun réglage GPU Windows, push ou déploiement.

## 2026-10-26 — B1 : diagnostic des tracés sur Intel et RTX

- Lire le GPU de l'onglet réellement utilisé dans ChatGPT : Intel UHD, AutoFaible, baisse avec les tracés confirmée. Comparer Bâle/Delémont et Intel/RTX par temps GPU, CPU de soumission et géométrie ; les anciens résultats RTX ne qualifient pas cet onglet.
- Remettre l'optimisation B1 avant l'A53 et B2/B3. [Preuves et limites](docs/DIAGNOSTIC_B1_TRACES.md). Aucun renderer ou réglage GPU/Windows modifié, aucune amélioration revendiquée, aucun push/déploiement.

## 2026-10-26 — B1 : tram et bus à Bâle, qualification mobile ouverte

- Quais et tracés du réseau officiel, modes tram/bus, secteur/réseau fourni, groupes et fiches avec attributs source ; quais affichés à l'activation, tracés séparément activables. 660 quais et 161 tracés retenus au contrôle.
- Lecture API paginée à la demande, cache/annulation/réessai, propriétés intactes et rendu P6 partagé. Dates de catalogue explicites, anciens liens horaires indisponibles signalés et pages officielles générales vérifiées, crédits Basel-Stadt/OSM et conditions visibles.
- Tests de données/chargement et parcours PC, régression Jura, toucher simulé et relevé court PC documentés. [Qualification B1](docs/VALIDATION_B1.md). A53 encore à tester ; B2/B3 non commencés, aucun push/déploiement.
- Conditions détaillées regroupées dans le panneau défilant de Bâle, attributions visibles ; commandes accessibles en paysage avec les deux couches actives. Les listes de tracés utilisent la référence source bâloise.

## 2026-10-26 — Plan Bâle enrichi après revue du contenu

- Clarifier que P8 validait une preuve technique bâtiments/parkings et non un Bâle terminé. Ajouter les lots confirmés : transports, lieux/patrimoine, services pratiques, avec sorties et sources candidates distinctes des fonctionnalités livrées.
- Différer la publication pendant l'enrichissement ; documents et commit de sauvegarde autorisés, aucune nouvelle couche implémentée par cette révision. [Plan Bâle](docs/PLAN_BALE_ENRICHISSEMENT.md).

## 2026-10-26 — PUB2 : accueil Jura/Bâle préparé localement

- Accueil statique en français, deux entrées et lien « Choisir un territoire » dans chaque carte ; clavier et affichage étroit, aucune donnée 3D chargée à l'accueil.
- Assemblage dédié `build:site`, applications autonomes par sous-dossier, marqueurs et contrôles de fichiers cohérents ; CI et publication manuelle préparées pour les deux territoires, sans déclenchement de publication.
- Parcours navigateur et contrôles adaptés aux nouveaux chemins ; preuves P8 préservées, limites Android inchangées. [Préparation PUB2](docs/PUBLICATION_PUB2.md). Aucun commit/push/déploiement.

## 2026-10-26 — P8 qualifié sur A53 et clos avec réserves

- Parcours Bâle Faible 24 étapes/600 lectures sur 12 min 29 s, référence Delémont au même preset et sélections tactiles sur l'appareil. FPS variables et pauses documentés ; 30 FPS constants non acquis, aucun coût causal unique des parkings déduit.
- Propriétaire satisfait de l'usage, des fiches et liens ; portrait/paysage vérifiés, léger ralentissement au changement d'orientation puis récupération. S23 non testé et observations toujours anciennes.
- Préférences restaurées et relues, seuls onglets et tunnels créés retirés. Sources/builds PC conservés sans modification ; [preuves et limites](docs/VALIDATION_P8.md), relais synchronisé. Aucun commit/push/déploiement ; Bâle reste local, P9 non commencé.

## 2026-10-25 — P8 Bâle réalisé localement, validation mobile ouverte

- Configuration Bâle réutilisant la scène : trois cadrages, modèle cantonal limité au cadre central, aucun doublon de bâtiments swisstopo, crédits/conditions et adresses source adaptés.
- Parkings : seize positions et fiches, observations reçues du 21 octobre clairement anciennes ; date de lecture séparée, inconnu distinct de zéro, réessai et conservation du cache sur panne. Rafraîchissement visible par minute, requêtes/cadrages annulables et destruction complète de la couche.
- Contrôles de fraîcheur/liens/compteurs/réponse complète, rendu/sélection, pannes et toucher simulé ; relevés PC courts avec conditions et limites documentées. A53 indisponible, aucun nouveau test Android ni clôture P8.
- Aide bus locale alignée sur la découpe P6. Builds Jura/Bâle et sous-dossier contrôlés ; [validation P8](docs/VALIDATION_P8.md). Site public Jura inchangé, aucun commit/push/déploiement P8.

## 2026-10-25 — Première publication de test sur GitHub Pages

- Étape PUB1 ajoutée avant Bâle, autorisée par le propriétaire avec commits/envoi/déploiement nécessaires.
- Chemins configurables pour GitHub Pages, ressources Cesium et conditions accessibles en sous-dossier ; aperçu local conservé.
- Workflow de publication manuel, contrôles du build et marqueur du commit servi ; [procédure](docs/PUBLICATION.md). Site https://jackseg80.github.io/jura3d/ publié à 21:40:13 et contrôlé dans Chrome à 21:41:01 Europe/Zurich, commit servi 29a4089 ; navigation/couches/fiches/conditions/crédits, zéro erreur relevée. Aucun nouveau benchmark Android.

## 2026-10-25 — P7 : configuration et cycle de vie des couches

- Identité, destinations, caméra, sources, crédits et déclarations de couches extraits dans la configuration du Jura ; même rendu et mêmes instantanés.
- Configuration sélectionnable à la compilation ; titre, navigation, fonds et crédits synchronisés, panneaux absents masqués, copie des seuls assets déclarés.
- Registre de couches et destruction idempotente : requêtes/cadrages/écouteurs annulés, sources retirées, réponses tardives neutralisées. Cache mémoire conservé à la désactivation, libéré à la destruction.
- Compilations et contrôles de configuration/géométrie/nettoyage réussis ; probe complet P1/P3/P4/P6 terminé à 21:13:52 Europe/Zurich dans Chrome 156/RTX 4080, zéro erreur. Même application témoin sans couches ; [validation P7](docs/VALIDATION_P7.md). P8 non commencé ; aucun commit/push/déploiement.

## 2026-10-25 — Bilan P6 clos après validation A53

- Campagne A53 Faible terminée : 40 étapes/400 lectures, sans erreur ni coupure ; bus complets 30 → 32 FPS à Delémont, 17 → 27 à Porrentruy. Gain non uniforme, références/pauses et seuil 30 FPS non acquis conservés.
- Retour positif et validation du propriétaire ; gestes portrait/paysage et groupes enregistrés, toucher injecté sur ligne N22 réussi. Auto restauré, seuls onglets/tunnels de test retirés ; originale 4301 arrêtée, optimisée 4300 conservée.
- Bilan P6 clos avec réserves pour l’usage exploratoire, CesiumJS conservé ; P7 proposé mais non commencé. Sources applicatives inchangées, même modèle/effort, aucun stage/stash/commit/push/déploiement. [Preuves et limites](docs/VALIDATION_P6.md).

## 2026-10-25 — Comparaison P6 Tab S8 terminée

- Script Android dédié : deux versions, quatre destinations, états de bus séparés, écran/preset contrôlés, FPS/pauses/CPU et relevés physiques ; restauration des préférences et fermeture du seul onglet créé.
- Build et géométrie des 140 tracés vérifiés, application/bundle inchangés. Premier smoke exclu, accès USB/réseau rétabli, nettoyage récupéré ; contrôle court puis 40 étapes/400 lectures terminés. Bus complets 36 → 40 FPS à Delémont, 34 → 46 à Porrentruy ; références et pauses conservées dans le bilan.
- Répétition Saignelégier six étapes sans pause ; retour manuel global positif, portrait observé, toucher injecté sur ligne N22 réussi. Préférences/onglets/tunnels nettoyés, aperçu PC 4300 conservé. A53 indisponible et P6 global encore ouvert ; aucun P7/commit/push/déploiement.

## 2026-10-01 — Clôture du bilan P5

- Retour final du propriétaire : ressenti normal et fonctionnement global OK sur Tab S8 ; portrait/paysage et récupération après coupure réseau consignés. P5 clos pour mesures/bilan, limites A53/S23, USB et détail manuel conservées.
- Diagnostic physique : 46–47 FPS sans bus, 45 avec arrêts seuls, 33 avec tracés seuls, 30–32 ensemble à Delémont/Moyen. P6 proposé sur les tracés, non commencé. Documentation synchronisée ; application inchangée, aucun commit/push/déploiement.


## 2026-10-01 — P5 : Moyen Tab S8 terminé

- Parcours Moyen complet par USB choisi par le propriétaire après accès Wi-Fi ADB indisponible : 12 min 28 s, 28 phases/616 lectures, aucune erreur ni coupure, nettoyage confirmé ; température batterie 26,3→ 27,6 °C, thermique 0. Tables/conditions dans VALIDATION_P5.
- Ancien parcours interrompu conservé, son seul onglet identifié/fermé sans supposer la préférence initiale ; contrôle réseau USB échoué puis accès rétabli, preuves distinctes. Complément manuel et coupure/réessai restent ouverts, P6 non commencé. Application/données inchangées.


## 2026-10-01 — Reprise P5 du soir

- Moyen du midi retrouvé interrompu : 14/28 phases, processus absent, sans bilan final ni nettoyage confirmé ; partiel conservé. Préparation tablette relancée avec le propriétaire, accès Wi-Fi à revalider ; PC/Tab S8 Faible restent acquis.
- Script : préférence initiale préservée entre rechargements dans une clé de session et enregistrée dans le rapport, assertions aux navigations et retrait de la seule clé temporaire. Syntaxe/build réussis, bundle applicatif identique ; contrôle court PC réussi à 22:41:37, sept configurations, assertions et nettoyage vérifiés. Preview 127.0.0.1:4300 relancée, aucun serveur LAN ou déploiement.

## 2026-10-01 — Reprise P5 et campagne PC prolongée

- Campagne PC terminée à 12:25:11 Europe/Zurich, Chrome sans interface / RTX 4080 Laptop GPU, Faible effectif comme l'A53 : 11 min 56 s, 28 phases/616 lectures, aucune erreur ni échec de nettoyage. Tableau, chargements, pauses, mémoire et réseau consignés dans `docs/VALIDATION_P5.md` ; versions/fenêtres distinctes et variation de la référence répétée conservées.
- Grille de clôture et relais actualisés. Tab S8 non détectée, complément manuel et récupération Wi-Fi/réessai Android toujours ouverts ; aucune clôture P5 ou proposition P6.
- Tab S8 branchée ensuite : coupures USB avant les phases, rapport partiel conservé ; appairage Wi-Fi réalisé avec le propriétaire et VPN mis en pause. Onglet interrompu identifié et nettoyé à 12:47:50. Script de mesure : marqueur de session, trois preuves de nettoyage et erreur explicite si l'onglet est inaccessible. Syntaxe/build réussis, bundle applicatif identique ; contrôle court Wi-Fi terminé à 12:49:03, sept configurations et nettoyage réussis. Campagne complète ensuite en cours ; aucun résultat court présenté comme performance.
- Tab S8 Faible achevé à 13:04:07 : 13 min 27 s, 28 phases/616 lectures, aucune erreur/coupure, nettoyage confirmé, batterie 27→24 %, thermique 0 aux relevés. Moyen lancé après repos ; relais autonome sauvegardé à 13:13 avant quota, sans déclarer ce parcours ou les essais manuels terminés. Aucun P6 engagé.
- Application, configuration, données et preuves historiques préservées ; build/probe de 11:40:39 réutilisés après vérification de l'empreinte du bundle. A53 déconnecté avant retrait des tunnels : forwards PC absents, reverse appareil non vérifié ; preview PC 4300 conservée. Aucun stage, stash, commit, push ou déploiement.

## 2026-10-01 — P5 A53 physique et panneau tactile corrigé

- Confirmation manuelle générale du bandeau reçue à 11:55, chauffe finale rapportée et relevée séparément (état thermique Android 1). Tunnels de test retirés, relais pour nouvelle discussion P5/P6 préparé.

- Campagne A53 complète : 28 phases sur les quatre localités, 616 lectures ; coûts bâtiments/ombres et limites consignés dans [VALIDATION_P5.md](docs/VALIDATION_P5.md). Huit étapes par toucher injecté réussies ; retour manuel sur B/tracés positif, panneau paysage signalé inutilisable.
- Menu : en-tête compact, résumés P3/P4 dans leurs rubriques, alerte chargement/erreur et réessai accessibles même replié, crédits maintenus. Indication de défilement persistante, portrait ouvert jusqu'à 80 % de hauteur utile ; largeur paysage ouverte 360 px. A53 réel 722 × 274 CSS : bandeau replié 107 px, commandes ouvertes 121 px ; défilement tactile et ouverture de fiches P3/P4 réussis.
- Build et probe complet P1/P3/P4 réussis à 11:40:39 Europe/Zurich, zéro erreur ; contrôles paysage court avec P3/P4 et réessai panneau replié inclus.
- Script P5 : vérification de l'index depuis le navigateur mesuré pour respecter le tunnel Android, premier rapport incomplet conservé/exclu. Aucun changement de données, LOD, presets ou moteur. Documents et relais synchronisés ; aucun commit, push ou déploiement.

## 2026-09-30 — Préparation P5 des mesures PC et Android

- Script séparé, sept configurations et quatre destinations, preset effectivement vérifié, chargements normaux/cache distincts du mode diagnostic, FPS/pauses et métriques réseau/mémoire disponibles ; rapports uniques/partiels sous `.vite/p5/`. Identité ADB/Chrome contrôlée, aucun changement de réglage Android ou fermeture des autres onglets.
- Parcours court PC réussi à 23:09:40 Europe/Zurich, sept configurations réellement en Moyen (0,75 / MSAA 1) ; build et probe complet P1 + P3 + P4 réussis à 23:11:45 Europe/Zurich. Aucun changement du rendu/données et aucun benchmark ou essai Galaxy revendiqué.
- [Protocole de plus de dix minutes et limites](docs/VALIDATION_P5.md), documents et relais actualisés. P5 reste ouvert faute d’appareil disponible ; aucun commit, push ou déploiement.

## 2026-09-30 — P4 : bus statiques et liens horaires

- Couche facultative, filtres secteur/jour/nuit, arrêts et groupes ancrés au relief, tracés sur terrain et zones Noctambus séparées ; sélection et fiches source sans véhicule en direct ni identité inventée. Choix des membres ou tracés superposés, surbrillance séparée pour préserver les primitives de base.
- GeoJSON P2 inchangés servis avec le site, cache mémoire de l’onglet ; pas de base serveur ou actualisation automatique. PDF et horaires individuels externes, crédit cantonal commun avec P3 et conditions conservées. Préremplissage CFF non confirmé indiqué dans les fiches.
- Build et probe complet P1 + P3 + P4 réussis à 22:35:53 Europe/Zurich, huit arrêts et quatre cadres contrôlés, clics réels, filtres, coexistence, cache, annulations et erreurs/réessais. Captures bureau/toucher simulé revues ; aucune mesure physique P4. [Preuves, limites et protocole P5](docs/VALIDATION_P4.md). Aucun commit, push ou déploiement.

## 2026-09-30 — Groupes patrimoine ancrés et sélection de leurs membres

- Correction des chiffres près de l'altitude zéro : repères et groupes suivent explicitement le terrain, y compris sur les hauteurs de Saignelégier.
- Un chiffre ouvre les lieux réellement regroupés, chacun consultable avec un bouton tactile. Le zoom peut changer la composition du groupe ; l'accès aux fiches ne dépend plus de sa séparation.
- Build et probe complet P1 + P3 réussis à 20:20:42 Europe/Zurich, aucune erreur normale. Sept groupes visibles contrôlés après rotation/inclinaison/zoom à Saignelégier : ancre réelle sur le relief, écart projeté 0 px dans cet échantillon. Sélection d’un membre sur bureau/toucher simulé et captures revues. Sources et crédits conservés ; aucun essai physique ou déploiement revendiqué.

## 2026-09-30 — P3 : patrimoine activable, filtres et fiches de lieu

- Couche désactivée au départ, repères et groupes, filtres localité/catégorie et liste des lieux. Fiches avec attributs source, PDF officiel et crédit cantonal ; trois fiches sans position conservées, aucune identité attribuée automatiquement aux bâtiments.
- Chargement/erreur/réessai indépendants de la scène ; retrait de la source et annulation des réponses tardives. Téléphone : menu replié à la sélection, fiche défilante avec titre, fermeture et crédit fixes.
- Seuls le patrimoine, ses conditions et les contrôles de liens sont copiés dans le site ; transports réservés à P4. Douze PDF officiels disponibles lors du contrôle, aucune copie des fiches individuelles.
- Build et probe complet P1 + P3 réussis à 19:34:08 Europe/Zurich : douze fiches, clics sur repère/groupe, filtres, annulations, bascules rapides, erreurs/réessais et toucher simulé portrait/paysage. Captures revues ; aucun nouvel essai physique ni benchmark mobile. [Preuves et limites](docs/VALIDATION_P3.md). Aucun commit, push ou déploiement.

## 2026-09-30 — P2 : données Jura préparées, droits et positions contrôlés

- Scripts Python isolés et versions verrouillées pour convertir les GeoPackage officiels EPSG:2056 en quatre GeoJSON WGS84 ; archives et livraisons identifiées par SHA256, conditions originales jointes, crédit cantonal documenté. Données hors du site affiché, aucun paquet ajouté au navigateur.
- 1 159 fiches patrimoine conservées, dont 1 156 positions exploitables ; trois coordonnées aberrantes mises à l'écart par géométrie nulle, propriétés et original préservés, aucune position corrigée au jugé. 464 arrêts, 140 tracés et 2 zones Noctambus conservés séparément. Aucun EGID ou nom inventé.
- Reproduction et 36 201 attributs vérifiés, huit repères dans quatre localités comparés au service REFRAME réel et examinés sur orthophoto. Conversion sans simplification/arrondi pour préserver les très petits segments. Build réussi à la suite du contrôle de 18:41:53 Europe/Zurich ; application compilée identique à P1. Preuves et limites dans `docs/VALIDATION_P2.md`.
- Menu Tab S8 à confirmer plus tard à la demande du propriétaire. P3/P4 non commencés ; aucun commit, push ou déploiement.

## 2026-09-30 — Menu ouvert en paysage tactile jusqu'au bas de l'écran

- Après clarification du propriétaire, menu ouvert utilisant toute la hauteur disponible en paysage tactile, avec marge pour les crédits Cesium ; contenu défilable et état/crédit accessibles. La limite de 55 % de hauteur sur tablette est levée. L'élargissement initial du bandeau replié, issu d'une mauvaise interprétation, est retiré.
- Probe étendu aux formats paysage téléphone/tablette, hauteur du menu ouvert, fermeture, défilement et erreur/réessai. Retour manuel de la vue après coupure/réactivation Wi-Fi consigné sans prétendre qu'une erreur ou le bouton de réessai a été vu sur la tablette.
- Build/probe réussis le 30 septembre à 17:20 Europe/Zurich ; captures téléphone/tablette simulés et erreur paysage revues. Nouvelle hauteur à confirmer sur Tab S8 après rechargement ; aucun commit, push ou déploiement.

## 2026-09-30 — Reprise Tab S8 chargée, application inchangée

- Probe Android : option `JURA3D_ANDROID_SCREENSHOTS=0` pour poursuivre les contrôles sans captures, choix consigné dans le rapport. Nouvel essai interrompu avant chargement ; aucune réparation USB ni cause liée aux captures revendiquée. Le propriétaire rapporte des retours du mode transfert de fichiers vers recharge seule ; tests USB suspendus.
- Build/probe bureau réussis après cet ajout, cinq réessais et gestes simulés contrôlés, revue visuelle bureau réussie. Nouveau classement Moyen sur PC RTX après mesures différentes ; résultats séparés de la Tab S8 Adreno 730. Aucun niveau Auto fixe garanti par modèle de GPU.
- Auto Moyen confirmé sur Adreno 730 ; quatre localités, retour initial et rotation contrôlés sur Chrome 154 physique. 25–32 FPS au repos, suite interrompue par USB/CDP avant gestes/sélection : test complet non réussi.
- Preview Wi-Fi privée préparée et fonctionnement confirmé par le propriétaire : 45–49 FPS en Moyen, environ 30 et fort moiré avec ombres. Retours manuels non comparables à un benchmark verrouillé ; ombres déjà désactivées par défaut en Moyen.
- Choix Élevé dans le navigateur intégré confirmé par le propriétaire. État, validation, diagnostic et relais synchronisés ; aucun changement de code produit, commit/push/déploiement. Essai ADB réseau retiré, aucun VPN/pare-feu modifié.

## 2026-09-30 — Presets adaptatifs demandés et diagnostic du rendu

- Auto, Faible, Moyen, Élevé, Ultra ; GPU WebGL affiché, mesures au premier plan et confirmation sur deux périodes avant choix, réévaluation explicite et priorité aux modifications manuelles. Choix du preset mémorisé ; résolution, MSAA et ombres adaptés, visibilité des bâtiments conservée.
- Correction Auto après retour RTX : indice de GPU dédié au démarrage, nouveau niveau remesuré et oscillation évitée. Probe Chrome Windows RTX 4080 Laptop GPU → Élevé ; dernier A53 Mali-G68 → Faible, parcours réel réussi. Résultat du navigateur intégré Codex encore à confirmer après rechargement, onglet non inspecté.
- Case « Ombres simulées » ; réception d'ombres identifiée comme facteur des stries sur les toits des captures. Contournement via presets sans ombres, pas de correction du biais/précision des ombres.
- Seuils élevés de sélection rejetés : ils suppriment des bâtiments au lieu de les simplifier. Seuil proportionnel à la résolution pour les presets ; diagnostic de tuiles/triangles disponible seulement avec `?probe=1`.
- A53 physique : gain vers 26–27 FPS dans le cadrage central en Faible, mais encore 4–10 au cadrage initial plus large. Auto choisit Faible, parcours P1 avec Auto réussi. Build/probe bureau et revue visuelle réussis ; mesures, limites et relais synchronisés. Aucun vrai LOD préparé, aucune couche ajoutée, aucun commit/push/déploiement.

## 2026-09-30 — Panneau compact sur téléphone et diagnostic A53

- Panneau entier repliable, compact par défaut jusqu'à 600 px ; destination, crédit et états d'erreur/chargement restent visibles. Ouverture/fermeture contrôlées dans le probe bureau, ouverture sur A53 physique.
- Recherche de cible bâtiment du diagnostic adaptée à la largeur d'un téléphone et aux éléments qui recouvrent la scène ; mode FPS Android ouvre les réglages avant de saisir la date.
- Build/probe bureau réussis ; parcours P1 par toucher injecté dans Chrome sur A53 physique réussi. Comparaison à caméra identique : 5–7 FPS avec bâtiments, 44–47 après masquage stabilisé ; mesures courtes, campagne P5 non réalisée.
- Hiérarchie swisstopo couvrant Delémont inspectée : raffinement additif, géométrie des contenus à un seul niveau ; aucune optimisation de rendu appliquée. Limites et relais actualisés, aucun commit/push/déploiement.

## 2026-09-30 — Compteur FPS demandé et contrôle Android physique

- Compteur natif CesiumJS actif au démarrage, affiché en haut à droite et masquable dans les réglages ; placement adapté à la fenêtre étroite.
- Probe bureau étendu au compteur et à son interrupteur ; parcours Android par CDP ajouté pour tester un appareil physique via USB, sans émulation de viewport.
- Moiré/stries signalés par le propriétaire consignés pour diagnostic ultérieur ; enrichissement des noms/adresses différé aux données dédiées, sans identité inventée.

## 2026-09-30 — P1 : navigation Jura et commandes au toucher

- Points d'entrée Delémont, Porrentruy, Saignelégier, Saint-Ursanne ; dernière destination atteinte, retour à la caméra initiale et annulation des vols remplacés.
- Boutons caméra et cibles de 44 px, réglages repliables, panneau défilable, crédit visible en portrait/paysage.
- Sélection avec surbrillance d'un bâtiment réel, nom/EGID uniquement fournis par la source ; point de terrain sans identité inventée, fermeture et effacement lors des changements.
- Chargement de la vue, erreur par source (racines et tuiles), réessai et avertissement de chargement prolongé. Fonds, heure, bâtiments et ombres préexistants conservés.
- Build et probe de la version compilée, toucher simulé et cinq pannes suivies d'un réessai ; captures revues. Documents synchronisés et protocole A53/S23 préparé, aucun essai réel ni commit/push/déploiement.

## 2026-09-30 — Plan de réalisation et relais

- Plan par lots : navigation Jura, patrimoine, bus, validation mobile, optimisation et réutilisation à Bâle ; critères de réussite et limites documentés.
- Modèle, effort conseillé et règles de changement/reprise précisés pour chaque lot ; relais et message de reprise P1 ajoutés.
- README, état et décisions synchronisés. Documentation uniquement, aucun nouveau code, chat, commit ou déploiement.

## 2026-09-30 — Bâle et Berne ajoutées à l'étude

- Sources municipales/cantonales, couches utiles, conditions et limites documentées pour les deux villes.
- Accès aux racines 3D Tiles de Bâle et échantillon de l'API des parkings contrôlés. Bâle conseillée pour le prochain essai suisse ; Berne et Zurich conservées comme alternatives. Aucun rendu multicité ni couche ajoutée à l'application.

## 2026-09-30 — Audit ciblé des localités et données

- Quatre centres jurassiens chargés dans le prototype CesiumJS sous Chrome de bureau : Delémont, Porrentruy, Saignelégier et Saint-Ursanne. Captures rapprochées et limites visuelles ajoutées à l'étude ; aucune mesure sur téléphone réel.
- Archives du réseau de bus et du répertoire des biens culturels ouvertes jusqu'aux GeoPackage. Objets, champs, projection, conditions de source et dates d'export consignés ; aucune couche intégrée.
- Comparaison Zurich/Rennes précisée et lien zurichois historique corrigé. Séquence de réalisation proposée dans l'étude, encore à discuter avec le propriétaire.

## 2026-09-30 — Recentrage produit et présélection multicité

- Essai local de jeu mis de côté ; priorité au site exploratoire du canton du Jura. Genève conservée comme référence, retirée des villes candidates.
- Étude documentaire complétée avec les couches cantonales jurassiennes et une séquence d'évaluation possible pour Zurich, Rennes et Paris ; aucune couche ni autre ville intégrée.

## 2026-09-29 — Ombres complètes rétablies

- Après retour du propriétaire, les bâtiments reçoivent de nouveau les ombres des autres bâtiments ; le mode simplifié a été écarté.
- Filtrage doux conservé, contraste réduit (`darkness = 0.65`) ; essais de résolution, portée, biais et niveau de détail consignés avec leurs limites.

## 2026-09-29 — Ombres des bâtiments ajustées

- Comparaison visuelle rapprochée, à cadrage identique, des ombres sur les maisons de Delémont ; captures conservées dans `docs/images/`.
- Essai transitoire : les bâtiments projetaient toujours des ombres, mais ne les recevaient plus ; cette simplification a été abandonnée après comparaison.
- Limites visuelles et validation mobile nécessaire documentées dans l'architecture et l'état du projet.

## 2026-09-29 — Étude exploratoire des extensions

- Clarification du produit : site d'exploration 3D et d'information pour le Jura ; un jeu éventuel relève d'un projet ultérieur. Galaxy A53 retenu pour tester les limites mobiles et S23 pour comparaison.
- Première étude sourcée des villes suisses et françaises candidates, des couches de mobilité et d'environnement, et de la différence entre positions mesurées, estimées et simulées.
- Comparaison provisoire de CesiumJS, Unity Web et d'une application installée ; décision finale conditionnée à des mesures sur téléphone réel.

## 2026-09-29 — Premier état public

- Prototype CesiumJS autour de Delémont avec relief, bâtiments et fonds swisstopo.
- Vue aérienne au niveau maximal 20, fond topographique limité à 18 après contrôle d'une tuile vide au niveau 19 à Delémont.
- Éclairage et ombres selon la date et l'heure, curseur horaire interactif, contrôle de la caméra au clic droit.
- Contrôle automatisé dans Chrome pour le chargement des données, le curseur, la caméra et le niveau aérien 20.
- Documentation de reprise, conditions des données et licence MIT pour le code du dépôt.
- Vérification de compilation automatique sur GitHub Actions.
