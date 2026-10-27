# Plan de réalisation — Jura 3D

**27 octobre — complément P6 planifié après retour PC positif sur Bâle :** étendre le rendu en tuiles aux seuls tracés du Jura, en conservant filtres jour/nuit, zones Noctambus, identités/fiches et contrôles existants. [Portée et critères](OPTIMISATION_JURA.md). Portage non commencé ; comparaison PC Intel/RTX puis qualification A53 des deux territoires. B1 physique reste ouvert et B2/B3 différés, aucune nouvelle ville ou publication.

**26 octobre au soir — optimisation B1 réalisée et contrôlée sur Intel/RTX.** Fond des tracés Bâle calculé en tuiles locales, mêmes géométries1m/identités et fiches, quais/groupes et surbrillance conservés ; le Jura garde son rendu P6. Comparaisons compilées, probes Bâle/Jura/site et tests de tuiles réussis. [Mesures et limites](OPTIMISATION_B1.md). **Qualification physique A53 et retour subjectif du propriétaire encore ouverts**, B2/B3 différés ; aucun réglage GPU Windows changé, aucun push/déploiement.

**Priorité B1 révisée le 26 octobre au soir :** coût GPU des tracés confirmé sur Intel dans le navigateur intégré du propriétaire. Optimiser et mesurer sur Intel/RTX avant la qualification A53, puis B2/B3. Le renderer P6 est partagé avec Delémont, mais le réseau Bâle est nettement plus dense. [Diagnostic et critères](DIAGNOSTIC_B1_TRACES.md). Les validations fonctionnelles précédentes restent bornées à leurs méthodes et GPU.

**Date : 26 octobre 2026. Statut : P5 et bilan P6 clos avec réserves ; optimisation et mesures PC/Tab S8/A53 achevées, usage exploratoire accepté par le propriétaire. 30 FPS A53 constants non acquis, performances variables et pauses documentées. CesiumJS conservé ; P7 validé sur PC, PUB1 publié. P8 technique qualifié avec réserves ; B1 transports réalisé sur PC, qualification A53 ouverte ; B2 lieux/patrimoine et B3 services restent à réaliser dans cet ordre confirmé. PUB2 accueil préparé et contrôlé localement, publication différée ; docs et commit de sauvegarde autorisés, aucun push/déploiement dans ce lot ; S23 non testé et P9 non commencé.**

**Sauvegarde historique à 13:13 Europe/Zurich :** Tab S8 Faible terminé à 13:04:07, 13 min 27 s, 28 phases/616 lectures sans erreur/coupure, nettoyage confirmé par Wi-Fi appairé. Moyen en cours après repos, aucun résultat achevé à ce point ; manuel/récupération réseau encore ouverts. Vérifier le [rapport et processus consignés dans le relais](RELAIS.md) avant toute relance. P5 non clos, P6 non proposé ou commencé.

## Objectif et point de départ

Rendre le site exploratoire du canton du Jura utile : relief et bâtiments 3D, navigation entre localités, patrimoine et transports. Conserver CesiumJS comme base tant que les mesures ne justifient pas une autre solution. Le jeu reste une expérimentation distincte. Genève est une référence fonctionnelle ; Bâle est le premier essai multicité conseillé, Berne et Zurich des alternatives, Rennes une candidate française ultérieure.

Preuves actuelles : navigation quatre localités, patrimoine P3 et bus P4 intégrés, P5/P6 mesurés sur PC/Tab S8/A53 avec réserves, configuration et contrat de couches P7 validés sur PC. Bâle intégré localement, rendu et parkings contrôlés sur PC, mesures et usage A53 portrait/paysage ajoutés le 26 octobre. Limites : 30 FPS A53 constants non acquis, S23 non testé, observations anciennes, conditions et coût d'une autre ville à revalider. Voir [l'état vérifié](ETAT_DU_PROJET.md), les validations P5/P6/P7/P8 et [l'étude des sources](ETUDE_VILLES_COUCHES_MOTEURS.md).

## Modèles, effort et continuité du travail

Les réglages ci-dessous sont **des recommandations pour ce projet**, pas des garanties de résultat ou des prescriptions officielles. La [documentation OpenAI sur les modèles](https://learn.chatgpt.com/docs/models), consultée le 30 septembre 2026, recommande GPT-6.1 Sol pour le développement complexe, Astra pour les travaux les plus exigeants et Luna pour les tâches ciblées. Un effort supérieur peut améliorer une analyse complexe, mais demande plus de temps et de tokens. La disponibilité dépend du compte et du client.

- **Base conseillée : GPT-6.1 Sol (`gpt-6.1-sol`)**, effort `high` pour les modifications fonctionnelles à plusieurs composants ; `medium` pour une tâche clairement définie. Si indisponible, conserver le modèle choisi et demander une recommandation selon les options visibles ; ne pas supposer un remplacement automatique.
- **Étude difficile : GPT-6 Astra (`gpt-6-astra`), effort `high`**, pour les arbitrages de moteur, les problèmes de rendu difficiles ou une revue d'architecture. Passer à `xhigh` si des preuves contradictoires ou plusieurs solutions plausibles exigent une analyse plus profonde.
- **Petite tâche isolée : GPT-6 Luna (`gpt-6-luna`), effort `high`, facultatif**, pour liens, rédaction ou extraction déjà cadrée. Il n'est pas nécessaire de changer de modèle pour chaque petite correction.
- Garder le réglage choisi pendant un lot cohérent. Proposer le changement au propriétaire avant le lot suivant ; l'agent ne prétend pas modifier lui-même le modèle ou l'effort de ce chat. Vérifier dans le sélecteur les options effectivement disponibles. `high` correspond à High/Élevé, `xhigh` à Extra High selon la langue du client.
- Augmenter l'effort seulement après avoir identifié un manque d'analyse : causes concurrentes, erreur persistante malgré un diagnostic, transformation géographique ambiguë ou compromis de rendu. Un service indisponible ou un manque de données se résout par des preuves supplémentaires, pas par davantage d'effort.
- Après résolution, revenir au réglage du lot suivant. Aucun recours systématique à Max/Ultra ; aucun lancement automatique de sous-agents.

## Étapes, réglages et discussions conseillés

P1 est réalisé localement, avec [validation bureau, premiers essais physiques et protocole téléphone](VALIDATION_P1.md) ; sa clôture mobile reste ouverte malgré le parcours A53 réussi, car la fluidité avec bâtiments est insuffisante. Le propriétaire autorise P2 et reporte le contrôle du menu Tab S8 ; [préparation et validation P2](VALIDATION_P2.md) désormais réalisées. P3 a ensuite été autorisé et réalisé localement : [validation et protocole physique](VALIDATION_P3.md). P4 et les lots suivants restent à faire. Chaque lot s'arrête sur un résultat utilisable, contrôlé et documenté ; il ne faut pas attendre la fin de la feuille de route pour recueillir un retour.

| Lot | Résultat attendu | Modèle / effort conseillé | Quand changer | Discussion |
| --- | --- | --- | --- | --- |
| P0 | Plan, registre de décisions et relais cohérents | GPT-6.1 Sol / `medium` | Sol / `high` si la portée devient ambiguë | Chat actuel ; plan produit le 30 septembre |
| P1 | Navigation dans quatre localités et interface de base utilisable au toucher | GPT-6.1 Sol / `high` | Astra / `high` si un défaut de caméra ou de scène demeure après reproduction isolée | **Nouvelle discussion recommandée avant P1**, puis garder ce chat dédié pour les corrections du lot |
| P2 | Données patrimoine et bus prêtes pour le web, avec droits et provenance documentés | GPT-6.1 Sol / `high` | Astra / `high` si coordonnées, droits ou correspondances présentent une ambiguïté ; droits non établis = intégration différée | Nouvelle discussion « données Jura » conseillée après clôture P1 ; peut accueillir P3/P4 |
| P3 | Patrimoine : sélection, filtres et fiches utiles | GPT-6.1 Sol / `high` | Astra / `high` pour une jointure lieu/bâtiment difficile ; Sol / `medium` pour les retouches de fiche | Même discussion que P2 tant que les données restent le sujet principal |
| P4 | Arrêts et lignes de bus, liens horaires et légende claire | GPT-6.1 Sol / `high` | Astra / `high` si une future intégration GTFS exige un diagnostic de fraîcheur ou d'identifiants | Même discussion que P2/P3 ; nouveau lot autonome pour du temps réel futur |
| P5 | Mesures reproductibles sur A53/S23 et bureau | GPT-6.1 Sol / `high` | Astra / `high` si les résultats divergent selon GPU, navigateur ou couche | **Nouvelle discussion dédiée aux performances**, avec mesures et scènes définies |
| P6 | Optimisations ciblées ; conclusion documentée sur le moteur web | GPT-6.1 Sol / `high` pour implémenter ; Astra / `high` pour l'arbitrage | Astra / `xhigh` si les mesures ne départagent pas les architectures | Garder le chat P5 pour optimiser ; **nouveau chat si comparaison avec une application native** |
| P7 | Petite séparation entre scène, configuration territoriale et couches | Astra / `high` pour concevoir ; GPT-6.1 Sol / `high` pour réaliser | Astra / `xhigh` si sources et cycles de vie imposent des compromis non résolus | **Nouvelle discussion d'architecture multicité**, après validation Jura ; conserver la même pour la réalisation |
| PUB1 | Publication de test GitHub Pages, après P7 et avant P8 | Modèle/effort actuels conservés | Aucun changement requis | Autorisée le 25 octobre ; [procédure et preuves](PUBLICATION.md) |
| P8 | Essai Bâle : bâtiments puis parkings, arbres optionnels | GPT-6.1 Sol / `high` | Astra / `high` pour difficultés 3D Tiles, alignement ou charge inexpliquée | **Nouvelle discussion Bâle**, à partir du socle P7 et des sources vérifiées |
| P9 | Décision sur Berne/Zurich, puis éventuel terrain français | Astra / `high` pour comparer ; GPT-6.1 Sol / `high` pour un essai retenu | `xhigh` seulement si choix de pipeline ou conditions contradictoires | Discussion par territoire ou pipeline important ; recherche bornée avant développement |

## Contenu et critères de sortie

### P1 — Jura navigable

**État au 30 septembre :** fonctions P1 et contrôles bureau réalisés ; aucune couche patrimoine/bus ni autre ville ajoutée. Build/probe et revue des captures réussis, toucher simulé inclus. Panneau compact, FPS, diagnostic ombres/géométrie et presets ajoutés à la demande du propriétaire. PC : Auto Élevé puis Moyen selon sessions du probe, Élevé confirmé manuellement dans l'onglet intégré. A53 : Auto Faible, parcours physique réussi. Tab S8 : Auto Moyen, navigation/retour/rotation contrôlés ; accès Wi-Fi privé et fonctionnement général confirmés, 45–49 FPS manuels sans ombres, environ 30 et moiré avec ombres. Retour suivant : paysage et récupération de l'affichage après Wi-Fi réactivé ; demande clarifiée de menu ouvert jusqu'au bas utile corrigée et contrôlée sur bureau à 17:20, nouvelle hauteur physique à confirmer après rechargement. Erreur explicite/bouton réessai physique et usage prolongé non établis ; S23 indisponible. [Mesures et limites](DIAGNOSTIC_PERFORMANCE.md). Qualification mobile complète ouverte ; anticipations ciblées P5/P6. P2 préparé ensuite, selon l’état ci-dessous ; confirmation physique du menu différée par le propriétaire.

- Ajouter des points d'entrée pour Delémont, Porrentruy, Saignelégier et Saint-Ursanne, retour à la vue initiale et indication du lieu actif. Une recherche générale pourra suivre si les points d'entrée ne suffisent pas.
- Garder fonds de carte, heure, bâtiments et crédit visibles ; rendre les commandes utilisables au toucher. Afficher chargement, absence de données et erreur avec une possibilité de réessai.
- Prévoir une sélection de bâtiment ou de lieu ; ne montrer une identité que si elle existe dans les données. Une fiche patrimoniale attend P3.
- Dernière retouche P1, 30 septembre : après clarification, menu **ouvert** sur toute la hauteur disponible en paysage, avec marge pour crédits Cesium. L'élargissement initial du bandeau replié a été retiré. Nouveau menu physique à confirmer après rechargement. Récupération Wi-Fi confirmée manuellement, erreur/bouton Réessayer physique non observés explicitement ; aucun changement du rendu.
- **Sortie :** quatre destinations atteignables ; gestes de caméra et commandes sans régression ; `build` et `probe` ciblé réussis. Recueillir un premier retour A53/S23 sur la navigation et relever une référence de chargement avant les nouvelles couches. Ce premier contrôle n'est pas la campagne complète P5.

### P2 — Préparer les données sans perdre leur sens

**État au 30 septembre, 18:41:53 Europe/Zurich : réalisé localement.** Deux archives publiques verrouillées, conditions relues/jointes, conversion reproductible vers GeoJSON WGS84 hors de l'application. Comptages conservés : 1 159 fiches patrimoine (1 156 positions utilisables, 3 fiches à géométrie nulle pour coordonnées source aberrantes), 464 arrêts, 140 tracés, 2 zones Noctambus. Aucun enregistrement perdu, 36 201 valeurs de propriété inchangées ; huit repères des quatre localités comparés à REFRAME et revus sur orthophoto. Build réussi, fichiers d'application identiques à P1 ; aucune couche intégrée, aucun nouveau test mobile. [Méthode, limites et anomalies](VALIDATION_P2.md). État historique P2 : P3 a depuis été réalisé ; contrôle du menu physique différé par le propriétaire.

- Relire les conditions PDF des archives Jura, identifier les crédits et règles de redistribution ; enregistrer URL, date de récupération, millésime connu et transformations dans `DONNEES.md`.
- Convertir les GeoPackage EPSG:2056 vers une représentation web géoréférencée, alléger seulement si nécessaire et rendre la conversion reproductible. Conserver identifiants de source, noms, catégories et liens utiles.
- **Sortie :** comptages comparés aux 1 159 biens culturels, 464 arrêts et 140 lignes/tronçons contrôlés ; expliquer toute différence ou géométrie rejetée. Vérifier sur des repères dans plusieurs localités l'absence de décalage. Les 2 objets Noctambus constituent une variante à traiter explicitement. Droits et crédits vérifiés pour chaque livraison retenue.

### P3 — Patrimoine et fiches

**État au 30 septembre, 20:20:42 Europe/Zurich : réalisé et vérifié localement.** Couche facultative, filtres/liste, repères/groupes et fiches avec identité source, crédit et PDF officiels. Trois fiches sans position accessibles ; aucune jointure aux bâtiments. Build/probe complet P1 + P3 réussis, douze fiches et liens contrôlés, retrait/annulations/erreurs et toucher simulé portrait/paysage vérifiés. Correctif des chiffres ancrés au terrain, rotation/zoom à Saignelégier et choix de membre au clic/tap simulé vérifiés. Captures revues ; essais physiques de la couche et coût mobile à qualifier, aucun nouveau résultat Galaxy revendiqué. [Preuves, limites et protocole](VALIDATION_P3.md).

- Couche activable, marqueurs lisibles, filtre simple, sélection et fiche avec nom, description disponible, source et lien vers le PDF officiel. Gérer les champs absents et liens indisponibles.
- Vérifier une dizaine de lieux répartis entre les quatre localités ; un point patrimonial ne garantit ni un identifiant EGID ni la sélection automatique de son bâtiment. Commencer par une fiche de lieu et valider toute jointure avant d'en faire une promesse d'interface.
- **Sortie :** trouver et consulter des lieux sans masquer la scène ; contenu cohérent avec les sources ; couche désactivable sans fuite d'objets ou sélection fantôme ; contrôle de l'interface étroite et du toucher.

### P4 — Transports utiles

**État au 30 septembre, 22:35:53 Europe/Zurich : réalisé et vérifié localement.** Réseau P2 inchangé : arrêts/tracés/zones activables, filtres, groupes et choix des tracés superposés, fiches et liens officiels datés. Build et probe complet P1 + P3 + P4 réussis ; captures bureau/toucher simulé revues. Préremplissage CFF non confirmé, coût physique à mesurer en P5. [Preuves et limites](VALIDATION_P4.md).

- Couche arrêts/lignes, sélection d'un arrêt, nom et lien officiel d'horaire ; préciser la nature statique du réseau et sa date. Éviter les tracés qui disparaissent sous le terrain ou les marqueurs illisibles.
- Garder l'intégration GTFS, retards et positions comme des lots futurs avec source vérifiée. Les données examinées ne fournissent pas de positions GPS de bus ; une interpolation ne sera pas présentée comme une observation.
- **Sortie :** échantillon d'arrêts et de lignes contrôlé dans plusieurs localités ; filtres et liens utilisables ; aucune confusion entre ligne, horaire et véhicule suivi ; état d'erreur compréhensible.

### P5 — Mesurer les téléphones réels

**1er octobre, actualisation à 23:11:32 :** A53 Faible historique 13 min 17 s, PC Faible 11 min 56 s, Tab S8 Faible 13 min 27 s et Moyen 12 min 28 s ; chacun 28 phases/616 lectures. Comparaisons achevées sans erreur, nettoyage PC/Tab S8 confirmé ; versions et conditions distinguées. Les 30 FPS A53 restent non acquis dans les centres denses. Complément manuel portrait/paysage confirmé et diagnostic bus réalisé ; vraie coupure réseau/réessai Android vérifié ; retour final du propriétaire reçu (ressenti normal, globalement OK), détails non exhaustifs conservés ; P5 clos avec réserves, P6 proposé mais non commencé. [Résultats et grille de clôture](VALIDATION_P5.md).

**Préparation locale au 30 septembre, 23:11:45 Europe/Zurich.** Script séparé, protocole et commandes prêts ; parcours court PC de sept configurations validé en Moyen effectif, build/probe complets réussis. Aucun appareil disponible, aucune session de dix minutes ou branche Android du nouveau script vérifiée. [Méthode, commandes et limites](VALIDATION_P5.md). P5 reste ouvert.

- Version compilée identifiée, mêmes parcours et vues ; Chrome bureau comme comparaison, Galaxy A53 comme référence basse et S23 comme comparaison mobile. Consigner navigateur, appareil, réseau, qualité, cache froid/chaud, heure solaire et couches actives.
- Tester séparément terrain/fond, bâtiments, ombres, patrimoine, bus, puis ensemble. Relever temps de scène utilisable, fluidité en mouvement, pauses, mémoire si observable, erreurs, volume réseau et chauffe sur une session d'au moins dix minutes. Répéter un scénario pour distinguer incident réseau et charge persistante.
- Les scripts liés à `127.0.0.1` ne permettent pas à eux seuls un essai téléphone : prévoir un accès local contrôlé sur le réseau privé, documenter l'URL et la méthode. Aucun hébergement public requis pour ce test.
- **Objectifs provisoires à valider avec le propriétaire :** viser 30 images/s pendant un parcours représentatif sur A53 avec qualité adaptée et une scène utilisable en environ dix secondes sur le réseau de référence choisi. Documenter les chutes et pauses ; une moyenne seule ne suffit pas. Aucun résultat actuel ne garantit ces objectifs. Un échec mène au diagnostic P6, pas directement à un changement de moteur.

### P6 — Optimiser selon la cause, décider selon les mesures

**Bilan final du 25 octobre 2026 :** deux campagnes Android 40 étapes/400 lectures chacune (Tab S8 Moyen puis A53 Faible), versions/conditions distinctes, retour global positif et validation explicite A53. Gestes A53 portrait/paysage, groupes et clic sur ligne vérifiés. Gain A53 non uniforme, références fluctuantes, pauses et seuil 30 FPS non acquis restent documentés ; bilan P6 clos avec réserves pour ce prototype. Maintenir CesiumJS. [Détails et preuves](VALIDATION_P6.md). P7 peut être proposé ; aucune implémentation commencée.

- Prioriser le coût réellement observé : ombres et résolution, détail des tuiles, quantité de marqueurs, simplification des tracés, chargement à la demande, rendu uniquement quand nécessaire si compatible avec l'horloge et les commandes. Chaque modification conserve les mêmes scènes de comparaison et une qualité explicitement décrite.
- **Sortie :** tableau avant/après, gains et pertes visuelles, critères d'usage acceptés ou limites restantes. `build`, `probe` des interactions touchées et nouvel essai sur le téléphone concerné.
- Si des limites bloquantes persistent, ouvrir une étude séparée CesiumJS versus application native avec une même zone et les mêmes couches. Unity est une option à mesurer, pas une migration automatique. L'adaptation des données et de l'interface, le développement et la distribution entrent dans la décision.

### P7 — Réutilisation minimale

**25 octobre 2026 :** réalisation autorisée après P6. Configuration territoriale, branchement/contrat des couches et copie conditionnelle des fichiers réalisés ; tests de configuration/géométrie, compilations et probe complet réussis à 21:13:52 Europe/Zurich, zéro erreur. P7 clos sur PC ; aucune nouvelle mesure physique Android. Témoin avec autre départ et sans couche cantonale, sans intégrer une nouvelle ville. [Validation P7](VALIDATION_P7.md).

- Extraire progressivement la configuration territoriale, les sources, les crédits et les couches de la logique de scène. Définir chargement, activation, sélection, rafraîchissement et nettoyage pour les couches qui en ont besoin.
- **Sortie :** Jura conserve ses comportements vérifiés ; une configuration de seconde ville ne nécessite pas de copier l'application. Documenter l'architecture réalisée. Renommage du dépôt, paquet de moteur et séparation en plusieurs dépôts restent des décisions ultérieures ; ne pas les imposer avant cette preuve.

### PUB1 — Publication de test, ajout du 25 octobre 2026

**Réalisé le 25 octobre :** publication à 21:40:13, contrôle Chrome HTTPS achevé à 21:41:01 Europe/Zurich, zéro erreur relevée. [Site](https://jackseg80.github.io/jura3d/), commit servi `29a4089`, CI et workflow manuel réussis. Navigation quatre localités, patrimoine/bus/fiches, conditions et crédits vérifiés. Documents de bilan envoyés ensuite sans republier l'application ; aucune nouvelle validation physique Android. [Preuves](PUBLICATION.md).

Cette étape manquait au plan initial : le dépôt et sa compilation ne constituaient pas un site public. Le propriétaire demande sa mise en ligne avant de continuer et autorise les opérations Git/déploiement nécessaires. Publier le Jura validé après P7 sur GitHub Pages, puis tenir les documents à jour.

- Préparer les chemins du sous-dossier, ressources Cesium, données et conditions ; conserver la preview locale.
- Vérifier le build et les interactions avant publication, examiner les fichiers envoyés, exclure caches/secrets et préserver les modifications existantes.
- Déployer manuellement depuis `main`, identifier le commit réellement servi, tester le site HTTPS et consigner URL, exécution, date et limites. Un push documentaire ne redéploie pas.
- **Sortie :** lien utilisable depuis les appareils sans câble ni serveur PC, version et contrôles publics documentés. Aucun nouveau benchmark Android revendiqué ; P8 reste séparé. [Procédure](PUBLICATION.md).

### P8 — Bâle comme preuve multicité

**B1 réalisé localement le 26 octobre :** 660 quais et 161 tracés tram/bus disponibles via API à la demande, filtres modes/secteur, regroupements, fiches et liens horaires généraux vérifiés. Contrôles PC et régression Jura réussis ; [validation B1](VALIDATION_B1.md). Qualification A53 B1 ouverte ; B2/B3 non commencés. La preuve technique P8 n'est pas la validation physique de ces ajouts ; Bâle enrichi reste incomplet.

**Clarification du 26 octobre après revue du propriétaire :** la clôture ci-dessous concerne l'essai technique bâtiments/parkings et ses contrôles, pas un produit Bâle terminé. L'ancien plan ne spécifiait pas de livrables transports/lieux/services pour Bâle. Ces besoins sont maintenant ajoutés, dans l'ordre confirmé : **B1 transports, B2 lieux/patrimoine, B3 services pratiques**. Bâle enrichi reste ouvert. [Plan détaillé, sources examinées et sorties par lot](PLAN_BALE_ENRICHISSEMENT.md). Priorité à ces informations avant une autre ville ; arbres/forêts/ponts restent des compléments visuels ultérieurs.

**26 octobre 2026 — bilan P8 clos avec réserves :** mesures Bâle A53 Faible 24/24 étapes et 600 lectures, référence courte Jura, sélections et usage réel portrait/paysage réussis. Propriétaire satisfait, ralentissement transitoire à la rotation puis récupération. Préférences/onglets/tunnels nettoyés. Pauses/FPS variables conservés, 30 FPS constants non acquis, aucun coût causal unique des parkings déduit ; S23 non testé et observations anciennes. Base scène/navigation/réglages/cycle de vie commune, sources/attributions/attributs/fraîcheur propres à Bâle. Pas d'extension du cadre ou de publication déduite de ces contrôles. Suite proposée avant une autre ville : décider du mode d'accès public Jura/Bâle (choix aujourd'hui au build), préparer et valider le packaging, puis publication distinctement autorisée. Aucun lot de publication Bâle ni P9 démarré.

**25 octobre 2026 :** implémentation locale réalisée via la configuration P7, bâtiments cantonaux découpés et parkings avec dates/ancienneté/panne. Rendu PC, fiches, source, absence de doublon et toucher simulé contrôlés ; mesures PC courtes sans conclusion Android. Probes Bâle à 22:28:50 et complet Jura à 22:34:36 Europe/Zurich réussis, zéro erreur ; contrôles finaux consignés dans [VALIDATION_P8.md](VALIDATION_P8.md). A53 indisponible selon le propriétaire, S23 absent : qualification mobile et bilan P8 ouverts, aucun passage à P9 comme lot clos. Essai Bâle non publié, site Jura conservé.

- Confirmer les conditions des modèles et de l'API, charger une zone limitée de bâtiments bâlois, éviter le doublon avec les bâtiments swisstopo. Ajouter les parkings avec observation horodatée et traitement des données périmées ou indisponibles.
- Ajouter arbres et forêts séparément, comme options, après mesure ; ponts si utiles à la zone. Aucun flux GPS BVB validé à ce stade.
- **Sortie :** scène réellement rendue, crédits corrects, positions et fiches des parkings vérifiées sur un échantillon ; mesures A53/S23 comparables au Jura ; décision sur ce qui est commun et ce qui reste propre à Bâle.

### PUB2 — Accès commun Jura/Bâle après P8

**Revue du propriétaire, 26 octobre :** docs et commit de sauvegarde autorisés ; publication différée pendant l'enrichissement B1/B2/B3, car l'essai avec parkings ne suffit pas au produit attendu. La validation technique de l'accueil ne valide pas la richesse du contenu. Aucun push/déploiement décidé par ce lot.

**26 octobre 2026 : préparation locale autorisée, réalisée et vérifiée sur PC ; publication en attente d'autorisation.** Accueil statique et deux applications compilées sous `jura/` / `bale/`, lien de retour au choix dans le panneau de chaque carte, configuration de publication manuelle adaptée. Vérification des assemblages racine et Pages ; parcours normal commun, probes Bâle et complet Jura, cycle de vie et clavier/toucher simulé réussis. [Procédure et preuves PUB2](PUBLICATION_PUB2.md). Aucun commit/push/déploiement, site public PUB1 inchangé ; aucun nouveau test Android physique.

- **Sortie avant publication :** accueil lisible au clavier/toucher, chargement des deux cartes et de leurs seules sources, fiches/crédits/conditions, liens de retour et marqueurs de révision/bases cohérents ; documents synchronisés, limites physiques P8 conservées sans nouveau benchmark Android.
- Après revue et autorisation distincte : commit/push examinés, déclenchement manuel Pages et contrôle HTTPS réel des deux territoires et de la révision servie. Aucune extension du cadre, couche ou ville supplémentaire déduite de PUB2.

### P9 — Extension facultative

- Comparer Berne (patrimoine/équipements et modèle LOD2 à confirmer) à Zurich (richesse des modèles municipaux, conversion nécessaire) selon les retours d'usage. Ne pas lancer toutes les villes ensemble.
- Rennes teste ensuite, si retenue, un pipeline CityJSON et les positions réelles des bus STAR ; Paris reste un essai d'échelle ultérieur. Recontrôler formats, fraîcheur, droits et accès au moment de chaque lot.
- **Sortie :** recommandation bornée avec preuve d'accès, travail de préparation et premier scénario utile ; plan spécifique avant une intégration importante.

## Vérifications et documentation à chaque lot

- Préserver les changements Git existants. Lire `AGENTS.md`, l'état et les documents du sujet avant les modifications. Vérifier le dépôt `D:\Python\Jura3D` ; ne pas basculer dans SunTrail ou le worktree de jeu.
- Après code/configuration : `npm run build`. Après interactions 3D : `npm run probe` et contrôle visuel du scénario ; si impossible, noter le contrôle manquant. Tests ciblés de transformation de coordonnées, de contenu ou de rafraîchissement lorsque le risque le justifie.
- Mettre à jour README, architecture, données, décisions, état et changelog selon le changement. Conserver méthode, date, résultats et limites ; ne pas qualifier un simple essai bureau de validation mobile.
- Séparer les autorisations de développement local, commit/push et publication. Le présent plan n'effectue aucune publication.

## Quand ouvrir une nouvelle discussion

Une discussion neuve aide à concentrer le travail ; elle ne garantit pas à elle seule la qualité. La qualité dépend du périmètre, des fichiers de référence, des preuves et des contrôles. La compaction permet aussi de poursuivre un lot cohérent sans créer un nouveau chat.

**Changer de discussion conseillé :** avant P1 vu l'historique mêlant exploration et jeu ; au passage interface/données vers campagne de performances ; avant architecture multicité, nouveau territoire ou étude de moteur natif. Changer également si les confusions de projet ou des hypothèses obsolètes persistent malgré correction. Une petite retouche ne nécessite pas un nouveau chat ; un changement de modèle ne l'impose pas non plus.

**Avant le passage :** terminer le contrôle en cours si possible, mettre à jour [le relais](RELAIS.md) et l'état. Consigner objectif, décisions, état vérifié/date, fichiers utiles, changements locaux, points ouverts et prochaine action. Ne pas abandonner une modification au milieu sans dire précisément ce qui reste non vérifié. Le propriétaire ouvre le nouveau chat ; aucun chat n'est créé automatiquement.

### Message de reprise pour P1

> Projet : D:\Python\Jura3D. Je souhaite réaliser uniquement P1 du plan. Lis AGENTS.md, README.md, docs/ETAT_DU_PROJET.md, docs/PLAN_DE_REALISATION.md et docs/RELAIS.md, puis vérifie Git. Préserve les modifications existantes. Objectif : navigation entre les quatre localités jurassiennes et interface au toucher ; le jeu et SunTrail sont hors de ce lot. Modèle conseillé : GPT-6.1 Sol, effort high, à sélectionner par moi si disponible. Réalise et vérifie P1, garde les documents à jour et termine par un relais ; ne publie pas sans autorisation.
