# Décisions techniques

## 2026-10-25 — Publier un prototype testable avant Bâle

La publication manquait comme lot explicite. À la demande du propriétaire, ajouter PUB1 entre P7 et P8 et autoriser les commits, push et déploiement nécessaires à cette première mise en ligne. GitHub Pages sert uniquement le build statique du Jura ; mêmes données, crédits et réserves. Garder la compilation CI sur push et une publication manuelle distincte, pour éviter qu'un envoi documentaire ne remplace le site. Identifier le commit servi dans `build-info.json` et documenter le contrôle HTTPS après Actions. Cette autorisation porte sur la présente publication, pas sur une règle de publication automatique des futurs lots.

## 2026-10-25 — P7 autorisé : configuration avant nouvelle ville

Après le bilan P6 et l'autorisation de continuer, extraire une configuration territoriale validée au build et au démarrage, choisie par `VITE_TERRITORY`, sans migration de moteur ni copie de l'application. Le Jura garde ses paramètres, données et comportements ; les adaptateurs patrimoine/bus restent spécialisés. Définir activation, réaffichage, sélection et destruction, y compris annulation des réponses tardives. Le réaffichage utilise l'instantané validé en mémoire : aucun rafraîchissement réseau automatique introduit.

Utiliser un témoin de navigation basé sur les fournisseurs suisses existants, avec départ différent et sans couches cantonales, pour vérifier la séparation. Ce témoin ne constitue pas l'intégration d'une seconde ville. Bâle, ses conditions de modèles, l'évitement des doublons et les parkings restent le lot P8, non commencé. Aucun renommage, dépôt supplémentaire, empaquetage de moteur, commit ou déploiement.

## 2026-10-25 — Clore le bilan P6 avec réserves après acceptation A53

Le propriétaire valide l’usage A53, jugé réactif et honorable pour ce téléphone, après le retour positif Tab S8. Comparaisons avant/après et contrôles physiques achevés ; accepter l’usage exploratoire sans transformer cette acceptation en 30 FPS constants. Le gain est variable selon les vues, les références dérivent et des pauses persistent. Conserver les preuves/limites et CesiumJS pour le prototype ; aucune migration motivée par ces seuls résultats. P7 (configuration territoriale et contrat des couches) peut être proposé avant Bâle, sans démarrer son implémentation dans cette validation. Auto restauré sur A53, seuls accès/targets de test nettoyés ; aucun commit/push/déploiement.

## 2026-10-25 — Préparation historique de la comparaison P6 physique

Le propriétaire branche la Tab S8 pour la suite P6. Comparer sur le même écran et Chrome actuel les versions originale et optimisée, avec arrêts/lignes séparés et référence sans bus répétée ; inverser l’ordre des versions une ville sur deux pour limiter le biais temporel, consigner thermique et variations. Aucune mesure GPU Android revendiquée et aucune comparaison quantitative au Chrome154 historique. Préserver préférences et onglets, vérifier le nettoyage même après une coupure ; ne pas clore P6 ni lancer P7 sur un simple smoke. Campagne 40 étapes Tab S8 et bilan ensuite achevés, retour global positif ; conserver les pauses et la dérive de référence au lieu de conclure sur la seule médiane. Répétition Saignelégier sans pause, cause initiale non isolée. A53 indisponible et paysage physique P6 non établi : P6 global reste ouvert.

## 2026-10-02 — P6 autorisé sans appareil : alléger la copie de rendu

Le propriétaire demande de réaliser le travail possible sans Tab S8/A53 branchés. La comparaison physique P5 pointe les tracés ; référence PC Intel UHD (distincte de la RTX P5) et compteurs CPU/GPU avant/après, sans gain Android revendiqué. Simplifier seulement une copie de rendu à 1 m projeté et découper les portions du secteur actif à 5,25 km, avec marge autour de la sélection de 5 km ; conserver réseau entier sur choix explicite, données/fiches/identifiants/couleurs/ancrage terrain. Mémoriser le calcul par feature/secteur. Contrôles de déviation, frontières, boucles et picking nécessaires ; validation locale réussie (build/probe/140 tracés, 20 scénarios avant et après ; GPU scène −31 à −42 % avec bus complets sur Intel UHD), test Android encore ouvert. Le réseau entier reste simplifié à 1 m projeté et son coût n’est pas mesuré ici ; la découpe locale est un compromis explicite de portée, réversible par le sélecteur. CesiumJS reste la base, aucun changement de moteur anticipé.


## 2026-10-01 — Clôture P5 avec réserves et retour global du propriétaire

Campagnes identifiées A53/PC Faible et Tab S8 Faible/Moyen terminées, essais portrait/paysage déclarés réalisés et panne/réessai réseau réels vérifiés. Le propriétaire conclut à un ressenti normal et un fonctionnement global OK sur Tab S8. Clore le lot de mesures et son bilan ; conserver les réserves et le détail manuel non exhaustif au lieu de convertir ce retour global en preuves itemisées. Cette clôture ne valide pas 30 FPS A53 ni un autre appareil. Proposer P6 sur le coût des tracés de bus confirmé physiquement ; aucune optimisation ou migration anticipée.


## 2026-10-01 — Reprise USB bornée à la demande du propriétaire

Le propriétaire branche le câble alors que le port ADB Wi-Fi actuel, vérifié côté tablette, reste inaccessible au PC. Reprendre un contrôle USB borné ; arrêter si le transport tombe, sans boucle de relance. L’incident observé au premier contrôle est un délai réseau swisstopo, sans perte USB ; après rétablissement et contrôle court réussi, Moyen complet tient 12 min 28 s avec nettoyage confirmé. Cela prouve cette session USB, pas une réparation générale de la liaison ni la cause du blocage Wi-Fi. Conserver le partiel du midi et ne pas reconstruire une campagne par assemblage.


## 2026-10-01 — P5 : préférence initiale durable aux rechargements

Le parcours Moyen du midi est retrouvé incomplet le soir (14/28 phases), processus absent, sans bilan final. Cause d'arrêt non établie ; ne pas qualifier ses résultats ni supposer le nettoyage. Pour les prochains essais, conserver la préférence initiale dans `sessionStorage` sous une clé unique de session et la sauvegarder dans le rapport dès lecture, avec assertions après les deux navigations. Cela permet une restauration vérifiable après perte de processus/CDP, même si la page a été rechargée. Retirer uniquement cette clé temporaire au nettoyage ; aucune purge globale. Syntaxe/build réussis, bundle applicatif inchangé ; contrôle court PC réussi à 22:41:37, sept configurations, assertions et nettoyage vérifiés. L'ancien rapport n'est pas modifié.

## 2026-10-01 — P5 : liaison Wi-Fi appairée et nettoyage vérifiable

Après deux pertes USB/CDP Tab S8, suspendre les relances USB. Le propriétaire active le débogage sans fil, fournit les codes d'appairage et confirme mettre les VPN en pause. Utiliser l'adresse Wi-Fi vérifiée, distincte de l'adresse VPN partagée, et vérifier le numéro matériel avant les tunnels. Appairage et connexion réussis ; contrôle court Wi-Fi terminé à 12:49:03 Europe/Zurich, sept configurations et nettoyage confirmé. Aucun port Android activé par l'agent ; désactivation du débogage et suppression éventuelle de l'association PC relèvent du propriétaire après les tests.

La coupure CDP peut faire paraître l'onglet fermé à Playwright alors qu'il existe encore sur l'appareil : observé sur l'essai interrompu de 12:33. Restauration de la préférence initiale et fermeture de ce seul onglet réalisées à 12:47:50 après identification par URL, marqueur de préférence et heure de création correspondant au rapport. Ajouter un identifiant de session aux futurs onglets et signaler explicitement le nettoyage non vérifié. Build et syntaxe du script réussis, bundle applicatif inchangé ; contrôle court Wi-Fi confirme les trois étapes de nettoyage. Aucun changement de rendu, de données, de preset ou de modèle/effort ; P6 non engagé.

## 2026-10-01 — Mesure A53 conservée, panneau libéré

Campagne physique P5 réussie avant la retouche d'interface. Les résultats ne valident pas 30 FPS dans les centres denses ; garder les deux passages de référence, les versions et les limites, sans conclure à une cause GPU/CPU précise ni changer de moteur. PC/Tab S8 et récupération réseau restent à compléter.

Retour manuel A53 : le paysage laisse 274 px utiles, résumés/crédits du panneau fixe occupent presque tout l'espace. Résumés dans les rubriques défilantes ; en-tête et crédits compacts, indication de défilement, chargements/erreurs/réessai maintenus hors du défilement. Contrôle physique par touches injectées : 107 px replié, 121 px de commandes ouvertes, fiches accessibles. Confirmation générale du correctif reçue à 11:55 ; chauffe rapportée, état thermique final 1. L'empreinte de la preview P5 doit être calculée depuis le navigateur mesuré, car le port reverse existe côté Android.

Ce registre garde le motif des choix durables. Une décision peut être révisée après mesure ou discussion ; noter alors la date et la nouvelle preuve.

## 2026-09-30 — P5 préparé sans appareil, qualité effective vérifiée

Le propriétaire ne dispose pas d’appareil pour cette étape et demande la préparation des essais. Préparer un script séparé et un protocole de plus de dix minutes, sans modifier le produit ou commencer P6. Déclarer PC/Android explicitement, vérifier identité/tunnel et navigateur, utiliser un preset fixe et comparer séparément bâtiments, ombres, patrimoine et bus, puis répéter la référence.

Les chargements normaux et la comparaison instrumentée sont séparés : `?probe=1` démarre en Élevé pour les contrôles existants, donc appliquer et vérifier le preset voulu avant les mesures de couches. Les premières tentatives de préparation sont exclues lorsqu’elles ne respectent pas ces paramètres. Sauvegarder les rapports partiels, distinguer FPS courts, pauses RAF, mémoire partielle et métriques réseau ; aucune extrapolation d’un parcours court PC aux Galaxy. Aucune session physique ou seuil de fluidité acquis ; les appareils seront demandés seulement à la reprise des mesures.

## 2026-09-30 — P4 : réseau statique local, liens horaires externes

Après autorisation de poursuivre, intégrer les arrêts/tracés P2 avec activation explicite et cache mémoire ; aucune base serveur ni synchronisation automatique. Secteur approximatif de 5 km autour de la destination P1, tracés entiers conservés, offre jour/nuit uniquement explicitement renseignée ; zones Noctambus séparées et facultatives. Géométries et noms source préservés, aucune position de véhicule, départ temps réel ou numéro commercial inventé.

Tracés classifiés sur le terrain, arrêts/groupes ancrés au relief. Les groupes et les tracés superposés proposent les membres effectivement sous le clic, afin d’éviter un choix arbitraire. Fiches et crédit cantonal commun avec P3 ; erreurs et annulation indépendantes. Les PDF et horaires restent externes : seules URL/observations datées sont livrées. Les URL CFF source restent avec avertissement de préremplissage non confirmé ; refus Chrome observé, sans extrapoler à tous les navigateurs. La performance physique des nouvelles couches sera mesurée en P5 ; les anciens FPS ne la qualifient pas.

## 2026-09-30 — Corriger l'ancrage des groupes et rendre leurs membres consultables

Le propriétaire signale des chiffres qui glissent lors des rotations et restent difficiles à interpréter au zoom. Les entités source sont sans Z ; Cesium calcule leurs groupes près de l'ellipsoïde et les billboards de groupe n'héritent pas du clamp des « P ». Donner explicitement `CLAMP_TO_TERRAIN` aux repères et aux groupes. Le regroupement reste spatial à l'écran et peut changer de composition avec la vue ; aucune position du jeu de données n'est modifiée. La référence terrain évite aussi un ancrage dépendant de la façade/toiture 3D visible.

Le clic sur un groupe ouvre ses membres source, avec boutons de 44 px et fiche individuelle, titre/fermeture/crédit fixes. Accès aux fiches sans imposer le zoom ni une séparation toujours possible. Retirer la liste/callbacks au changement de sélection, filtre ou masquage. Contrôler les chiffres réellement dessinés sur les hauteurs de Saignelégier, en comparant leur ancre projetée au relief après rotation/inclinaison/zoom ; compléter par choix tactile simulé. Sources, crédits, couches et limites physiques inchangés.

## 2026-09-30 — P3 : fiches de lieux, couche facultative et filtres

Le propriétaire demande de continuer après P2. Ajouter le patrimoine avec chargement à l'activation, filtres localité/catégorie et liste de lieux, en gardant les transports pour P4. Le filtre par défaut suit la destination P1 ; les filtres explicites restent choisis. Repères regroupés à distance pour limiter l'encombrement, fiche par repère ou choix dans la liste, sans attribuer l'identité du lieu à son bâtiment 3D. Conserver tous les attributs P2 et les trois fiches sans position ; aucun EGID, adresse ou importance inféré.

Choisir `CustomDataSource` Cesium pour créer seulement les entités géoréférencées filtrées et retirer leur source à la désactivation. Cache des fichiers validés en mémoire, chargements annulables, garde contre réponses tardives et bascules rapides. Fiche tactile avec titre/fermeture/crédit fixes, contenu défilant et menu replié sur téléphone après sélection. Douze liens PDF HTTPS contrôlés, URLs sources intactes ; rejeter les liens hors du chemin cantonal officiel et les indisponibilités connues. Conditions originales jointes au site et crédit cantonal lisible. Build/probe P1 + P3 et revue visuelle simulée réussis à 19:34 ; aucune validation physique P3 ni publication.

## 2026-09-30 — P2 reproductible, données préservées et anomalies explicites

Le propriétaire autorise P2 et reporte la vérification du menu sur Tab S8. Préparer les deux archives Jura en GeoJSON WGS84, hors de l'application, avec instantanés verrouillés par empreinte, manifeste de provenance et conditions PDF originales jointes. Le traitement Python isolé ne change ni les dépendances npm ni le rendu. Crédit lisible à l'intégration : « © Géodonnées de la République et Canton du Jura », en plus de swisstopo ; noms des auteurs, titres et liens documentés. Aucune licence MIT appliquée aux données.

Conserver tous les attributs et identifiants de source, aucun EGID/nom/adresse/cotation inventé. Les 1 159 fiches RBC restent présentes ; trois positions source hors région (IDs 229, 247, 766) sont remplacées par une géométrie nulle explicite, avec original et motif dans le manifeste. Aucune correction de chiffre supposée. Les contrôles arrêtent la génération en cas de nouvelle anomalie. Les 2 objets Noctambus sont des zones polygonales et restent distincts des 140 tracés et 464 arrêts.

Ne pas simplifier ni arrondir ces premières livraisons : un essai à sept décimales écrasait un petit segment de bus. Conserver la précision double et tous les sommets utilisables ; le coût sera mesuré lors de P3/P4, avec chargement par couche. Validation : 36 201 attributs identiques, reproduction, huit repères comparés à REFRAME et revue orthophoto. Cette comparaison ne valide pas l'exactitude exhaustive de la source ni une correspondance aux bâtiments. Préparation P2 terminée localement ; P3/P4 non commencés, autorisation de commit/push/déploiement toujours distincte.

## 2026-09-30 — Menu ouvert sur toute la hauteur disponible en paysage tactile

Le propriétaire précise que le menu **ouvert** s'arrête à mi-hauteur lorsqu'il passe en paysage sur Tab S8. L'interprétation initiale élargissant le bandeau replié est retirée. Le menu ouvert s'étend du haut jusqu'à une marge basse de 40 px pour les crédits Cesium/zone sûre, avec contenu défilable et état/réessai/crédit fixes. Largeur et format replié conservés ; caméra, données et qualité de rendu inchangées. Le propriétaire confirme aussi le retour de la vue après réactivation Wi-Fi, sans preuve d'un bouton Réessayer déclenché ou d'une erreur réseau affichée.

## 2026-09-30 — Presets mesurés, bâtiments conservés

Le propriétaire demande de poursuivre le diagnostic, puis des presets et une détection de puissance. Les essais A53 montrent un gain avec réduction de résolution et MSAA, mais pas une fluidité suffisante par le seul retrait des ombres. Faible/Moyen utilisent des dimensions à 60/75 %, MSAA 1, ombres désactivées ; Élevé conserve le rendu historique, Ultra rend à 150 %. Auto classe ponctuellement la scène, sans changement continu ; réévaluation explicite, réglage manuel prioritaire, Ultra manuel. Le choix du preset est mémorisé localement.

Après le retour d'un choix Faible sur RTX 4080 dans le navigateur intégré, Auto affiche le GPU WebGL effectif, utilise un GPU dédié reconnu uniquement comme indice initial pour Élevé, attend quatre secondes puis exige deux médianes concordantes de six fenêtres au premier plan. Chargement, navigation, onglet masqué ou sans focus suspendent la mesure. Élevé <35 FPS propose Moyen ; Moyen <20 propose Faible et ≥55 propose Élevé ; Faible ≥45 propose Moyen. Un nouveau niveau est remesuré et une oscillation termine au niveau inférieur. Seuils heuristiques à qualifier. Contrôles réussis : Chrome Windows avec RTX 4080 Laptop GPU reste Élevé ; A53 Mali-G68 choisit Faible. L'onglet intégré n'a pas pu être inspecté, donc sa cause initiale reste inconnue.

Les seuils Cesium 64/128 font disparaître les groupes, jusqu'à zéro bâtiment : cette voie est rejetée pour simuler un LOD. Les presets compensent leur seuil selon le tampon pour viser la même tolérance en pixels CSS, sans modifier les données ou identités. Les stries des toits sont liées à la réception des ombres dans les captures ; la case d'ombres permet de les désactiver, sans prétendre corriger leur précision. Cette décision révise la conservation systématique des ombres au démarrage : Élevé/Ultra gardent leurs réglages complets, Faible/Moyen les désactivent. [Mesures et limites](DIAGNOSTIC_PERFORMANCE.md), notamment les baisses persistantes selon le cadrage A53. Un vrai LOD demanderait une préparation de données distincte, non réalisée ici.

## 2026-09-30 — Panneau entier compact sur téléphone

Le retour réel A53 montre que le panneau occupe trop de place. Il démarre donc replié jusqu'à 600 px et reste ouvrable au toucher sur tous les écrans. La destination, le crédit, le chargement et les erreurs restent visibles ; le choix explicite de l'utilisateur est conservé pendant un redimensionnement. Le compteur FPS reste disponible. Aucun abaissement automatique de qualité ou changement des ombres n'est décidé avant d'isoler leurs coûts de la géométrie ; le constat de hiérarchie additive swisstopo est documenté, sans migration de moteur.

## 2026-09-30 — Compteur FPS et essai de la Tab S8

À la demande du propriétaire, le compteur natif CesiumJS est actif au démarrage, lisible en haut à droite et désactivable dans les réglages. Sa moyenne courte aide à observer les variations en manipulant la scène ; elle ne valide pas les seuils de P5 et ne remplace pas le ressenti ni le relevé des pauses. Aucun changement de qualité du rendu dans ce lot.

Le S23 n'étant pas disponible, le propriétaire autorise un essai sur Galaxy Tab S8 connectée. La tablette est une comparaison supplémentaire ; elle ne remplace pas la référence A53. Le test utilise Chrome de l'appareil physique par tunnel USB temporaire, sans exposer le serveur sur le réseau privé, sans installation d'application et sans émulation de viewport. Les stries/moiré signalés par le propriétaire restent un défaut de rendu à diagnostiquer ultérieurement ; leur cause n'est pas établie.

## 2026-09-30 — P1 : quatre destinations, toucher et sélection sans identité déduite

Le développement local de P1 est autorisé dans le dépôt principal, en préservant les changements existants et les réglages d'ombres. Quatre boutons fixes suffisent pour le premier parcours ; une recherche générale reste différée. Les repères de caméra sont approximatifs, le retour initial conserve le cadrage historique de Delémont et l'indication active désigne la dernière destination atteinte. Les commandes caméra de 44 px complètent les gestes ; les réglages se replient sur petit écran, le contenu défile et le crédit reste visible.

La fiche sélectionne un bâtiment réel ou un point de terrain. Un nom et un EGID ne sont montrés que s'ils sont fournis ; aucune jointure, adresse ou identité patrimoniale n'est déduite. Chargements et erreurs sont suivis par source, avec réessai sans recharger toute la page, sauf échec d'initialisation WebGL. Les erreurs de tuiles sont traitées en plus des racines. Ce choix garde P1 utile sans commencer patrimoine, bus ou multicité.

Build, probe sur version compilée et revue visuelle bureau sont réalisés ; le toucher Chrome reste simulé. Les premiers essais Galaxy A53/S23 conditionnent encore la clôture complète de P1. Le [protocole](VALIDATION_P1.md) identifie la version et un accès au réseau privé à lancer lors de ces essais ; aucune ouverture réseau, commit, push ou publication n'est effectuée pour les préparer.

## 2026-09-30 — Plan de réalisation et reprises par lot

Le propriétaire demande de formaliser la suite avec modèle, effort de raisonnement et moments de nouvelle discussion pour chaque point. Le [plan](PLAN_DE_REALISATION.md) conserve CesiumJS comme base de départ : navigation Jura, patrimoine et bus, validation mobile, optimisations puis essai de réutilisation à Bâle. La migration de moteur dépendra de mesures ; le jeu reste séparé. Les seuils et détails d'interface proposés ne sont pas des résultats acquis.

Les réglages de modèle sont des recommandations selon la difficulté du lot, à sélectionner par le propriétaire parmi les options disponibles ; l'agent ne les change pas automatiquement. Une nouvelle discussion dédiée est conseillée avant P1 en raison de l'historique mêlant plusieurs essais, puis aux changements de sujet importants. Un [relais écrit](RELAIS.md), les preuves et l'état du dépôt remplacent la dépendance à l'historique. Aucun nouveau chat ni développement n'est lancé par cette formalisation.

## 2026-09-30 — Arrêt de l'essai de jeu et priorité au site exploratoire

Le propriétaire juge l'essai local de boule et destruction suffisant pour établir une faisabilité initiale. Il demande d'arrêter ce prototype et de revenir au site exploratoire du Jura. Le jeu reste une piste distincte ; Unity ne serait comparé pour cette piste que si ses besoins ou mesures l'exigent. Aucune conclusion de performance sur les Galaxy A53 et S23 ou de choix définitif de moteur n'est tirée de l'essai local.

## 2026-09-30 — Jura d'abord, autres villes ensuite, Genève exclue

Le propriétaire souhaite une base réutilisable pour plusieurs villes avec des bâtiments 3D et des couches réellement pertinentes pour chacune. Le canton du Jura reste le premier produit à rendre utile et à vérifier sur plusieurs localités. Genève sert de référence de comparaison mais n'est pas une candidate à reproduire, puisqu'une application dédiée existe déjà. La présélection documentaire comprend notamment Zurich, Berne, Bâle, Rennes et Paris ; elle ne vaut ni décision d'intégration, ni plan de développement multicité. Le socle commun et les adaptations par ville devront être définis après vérification des sources et d'un second territoire.

## 2026-09-29 — Produit visé : exploration utile du Jura

Le propriétaire a clarifié que Jura 3D vise un site web exploratoire du canton du Jura, sur le principe de Geneva 3D : bâtiments 3D et informations utiles comme transports, trafic et lieux. Un jeu pourrait être imaginé plus tard, mais ne fait pas partie de l'objectif actuel. Les Galaxy A53 et S23 sont les appareils disponibles pour une future mesure mobile ; aucune performance sur ces appareils n'est encore attestée. Si le web reste insuffisant, une application installée pourra être évaluée sur la base de mesures.

Une idée à garder à part est celle d'un jeu humoristique fondé sur ce moteur, avec un personnage interagissant avec ou détruisant des bâtiments. Elle ne fait pas partie de la feuille de route du site exploratoire.

## 2026-09-29 — Ombres complètes rétablies après comparaison

Le propriétaire a jugé les zones d'ombre sur les façades plus naturelles et plus utiles que leur disparition dans l'essai `CAST_ONLY`. Le prototype utilise de nouveau `ShadowMode.ENABLED` : les bâtiments projettent et reçoivent les ombres. Le filtrage doux de Cesium et `darkness = 0.65` atténuent l'aspect dur, sans produire une pénombre réaliste à courte distance. Une carte 4096 px et un niveau de détail 3D Tiles plus fin n'ont pas montré de gain visuel net au cadrage comparé ; le biais désactivé et la portée raccourcie ont introduit des stries. Le rendu reste à évaluer à d'autres heures et sur les Galaxy A53/S23. Une solution d'ombres de qualité comparable à SunTrail nécessiterait une étude de rendu distincte.

## 2026-09-29 — Essai de simplification des ombres, abandonné

À courte distance, le mode d'ombre complet de Cesium produisait des triangles sombres et des bords dentelés sur des façades swissBUILDINGS3D. Un essai avec `ShadowMode.CAST_ONLY` les masquait, mais effaçait également des ombres porteuses d'information. Ce choix a été révisé le même jour après comparaison avec le propriétaire ; voir les [captures et le réglage actuel](ARCHITECTURE.md#qualité-visuelle-des-ombres).

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
