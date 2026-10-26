# Jura 3D

**Portée Bâle clarifiée le 26 octobre 2026 :** bâtiments + parkings constituent l'essai technique validé, **pas un Bâle terminé**. À la demande du propriétaire, le plan est enrichi dans cet ordre : transports tram/bus/arrêts, lieux à visiter/patrimoine, services pratiques. [Lots, sources et critères de sortie](docs/PLAN_BALE_ENRICHISSEMENT.md). Ces couches ne sont pas encore implémentées ; publication différée, documents et commit de sauvegarde autorisés.

**PUB2 — accueil Jura/Bâle préparé et vérifié sur PC le 26 octobre 2026.** Deux entrées et retour au choix depuis chaque carte ; application autonome et assemblages racine/Pages compilés. [Essayer l'accueil commun sur ce PC](http://127.0.0.1:4306/jura3d/) si sa preview tourne. Accueil/clavier/toucher simulé, parcours des deux cartes et probes réussis ; aucun nouveau test Android physique, réserves P8 conservées. Publication en attente d'autorisation, aucun commit/push/déploiement. [Préparation et procédure PUB2](docs/PUBLICATION_PUB2.md). La version publique reste PUB1 Jura `29a4089`.

**P8 — essai Bâle local clos avec réserves le 26 octobre 2026.** Même application, trois cadrages, bâtiments cantonaux limités au secteur étudié et couche de seize parkings avec observations datées, ancienneté, panne/réessai et fiches. [Ouvrir l'essai sur ce PC](http://127.0.0.1:4305/) si sa preview tourne. Les observations reçues sont anciennes (21 octobre), sans disponibilité actuelle garantie. A53 Faible : 24 étapes/600 lectures sur 12 min 29 s ; avec parkings, médianes 23–36 FPS selon les vues/passages, pauses conservées et 30 FPS constants non acquis. Référence Jura, sélections et usage portrait/paysage vérifiés ; propriétaire satisfait de la fluidité et des fiches/liens, léger ralentissement transitoire à la rotation. Préférences et accès USB nettoyés ; S23 non testé. [Validation et reprise P8](docs/VALIDATION_P8.md). Le site public ci-dessous reste la version Jura `29a4089` ; Bâle n'est pas publié.



État de référence P6/P7 au **25 octobre 2026** : **bilan P6 clos avec réserves**, après mesures PC/Tab S8/A53 et acceptation du propriétaire. A53 Faible : bus complets 30 → 32 FPS à Delémont, 17 → 27 à Porrentruy ; gain non uniforme et 30 FPS constants non acquis. Gestes physiques A53 en portrait/paysage et clic sur une ligne contrôlés ; préférences/onglets/tunnels nettoyés. CesiumJS conservé ; **P7 réalisé et validé sur PC**. Configuration territoriale et cycle de vie des couches séparés, sans changement des données ou des réglages P6. [Validation P7](docs/VALIDATION_P7.md). [Résultats et limites P6](docs/VALIDATION_P6.md), [bilan P5](docs/VALIDATION_P5.md). [Preview PC locale](http://127.0.0.1:4300/).

Prototype web ouvert pour explorer en 3D le canton du Jura et consulter des informations utiles sur ses bâtiments et ses lieux. Navigation entre **Delémont, Porrentruy, Saignelégier et Saint-Ursanne**, commandes au toucher et **couche patrimoine avec filtres et fiches officielles**. La couche bus propose arrêts, tracés et liens horaires officiels ; couverture exhaustive, trafic et données temps réel ne sont pas réalisés. Le code est nouveau ; aucun code de SunTrail 3D ou de Geneva 3D n'a été copié.

![Vue de Delémont à midi](docs/images/delemont-midi.png)

## Ce qui fonctionne

- **Bus et horaires** : ouvrir le panneau et activer la couche. Choisir le secteur autour de la destination (~5 km, portions voisines des tracés) ou tout le réseau avec les lignes entières, filtrer jour/nuit et afficher séparément arrêts, tracés et zones Noctambus. Toucher « B », un groupe ou un tracé pour consulter les attributs et liens officiels ; les tracés superposés proposent une liste. Réseau statique du 13 septembre 2026, aucun véhicule ou départ suivi en direct. [Contrôles et limites P4](docs/VALIDATION_P4.md).

- **Patrimoine et lieux** : ouvrir ce panneau et cocher « Afficher le patrimoine ». Filtrer par localité/catégorie, toucher un repère « P » ou choisir un lieu puis « Voir la fiche et le lieu ». Noms, descriptions disponibles et PDF officiels ; chiffres ancrés au relief ouvrant la liste des lieux du groupe, trois fiches sans position consultables, aucun nom attribué automatiquement au bâtiment voisin. Couche désactivée au départ. Sur téléphone, menu replié à la sélection et fiche défilante avec titre/fermeture/crédit fixes. [Contrôles P3 et protocole physique](docs/VALIDATION_P3.md).

- Quatre boutons de destination, indication de la dernière destination atteinte et retour au cadrage initial de Delémont.
- Commandes de zoom, rotation et inclinaison ; glissement et pincement au toucher. Panneau entier repliable par « Replier »/« Explorer », compact au départ sur téléphone. En paysage tactile, le menu ouvert utilise toute la hauteur disponible jusqu'aux crédits Cesium ; destination, erreurs et crédit restent accessibles, réglages défilables. Après le retour A53 du 1er octobre, en-tête compact et résumés des couches dans les rubriques ; « Faites défiler ↕ » indique le défilement. Les erreurs/réessais et crédits restent accessibles même replié.
- Compteur FPS visible en haut à droite, actif au démarrage et masquable via « Afficher le compteur FPS » dans les réglages. Il donne la cadence de rendu sur environ une seconde ; observer aussi les mouvements et les pauses.
- Qualité **Auto / Faible / Moyen / Élevé / Ultra**, dans « Qualité, fond et heure ». Auto affiche le GPU WebGL utilisé, mesure la cadence au premier plan et confirme son choix ; « Réévaluer » relance la mesure. Le preset choisi est mémorisé. Les presets réduisent résolution/anticrénelage et ombres, en gardant le choix de visibilité des bâtiments. Faible rend la carte moins nette ; Ultra est plus exigeant. Modifier ombres/bâtiments passe en « Personnalisé ». [Réglages, mesures A53 et limites](docs/DIAGNOSTIC_PERFORMANCE.md).
- Sélection d'un bâtiment réel avec surbrillance, nom uniquement s'il existe dans les données et EGID s'il est fourni. Sinon : « Bâtiment 3D », sans nom ni adresse inventés. Un point sur le terrain affiche seulement sa position, sans fiche de lieu.
- Chargement de la vue, erreurs distinctes de fond/relief/bâtiments et réessai ; message après 30 secondes de chargement prolongé.
- Relief 3D : `ch.swisstopo.terrain.3d` (quantized mesh)
- Bâtiments : `ch.swisstopo.swissbuildings3d.3d` (3D Tiles)
- Vue aérienne jusqu'au niveau de tuile 20 ; fond topographique limité à 18 (voir [données et limites](docs/DONNEES.md)).
- Éclairage selon la date/heure choisies ; ombres simulées activables séparément. Élevé/Ultra gardent projection et réception sur les bâtiments, filtrage doux et contraste réduit ; Faible/Moyen désactivent les ombres simulées. Leur réception produit encore des stries dans certaines vues.
- Curseur pour faire varier l'heure et voir la lumière et les ombres pendant le déplacement
- Commande pour masquer les bâtiments
- Glisser au clic droit pour tourner et incliner la caméra ; molette pour zoomer

Les services de données sont accessibles en ligne. Le prototype ne demande ni clé MapTiler ni compte Cesium ion. Une connexion Internet et un navigateur avec WebGL sont nécessaires.

## Site de test public

**[Ouvrir Jura 3D sur GitHub Pages](https://jackseg80.github.io/jura3d/)** — disponible depuis le 25 octobre 2026, sans serveur PC ni câble. Publication et contrôle du rendu public réussis après P7 : navigation, patrimoine, bus, fiches, conditions et crédits. Version servie `29a4089`, limites mobiles P6 conservées ; aucune nouvelle mesure Android. [Bilan, preuves et procédure](docs/PUBLICATION.md).

Les mises à jour publiques sont déclenchées manuellement : envoyer du code ou de la documentation sur GitHub ne republie pas automatiquement le site. Le marqueur [build-info.json](https://jackseg80.github.io/jura3d/build-info.json) indique la révision effectivement servie.


## Démarrage

Node.js 22 ou plus récent :

```powershell
npm ci
npm run dev
```

Ouvrir `http://127.0.0.1:5173/`. Le chargement exige une connexion Internet. La commande `npm run build` produit la version statique, et `npm run preview` la sert sur `http://127.0.0.1:4173/`.

## Comment les informations sont chargées

Le site ne possède pas de serveur de base de données. Patrimoine et bus sont des instantanés GeoJSON servis avec le site : téléchargement à l’activation, puis cache en mémoire de l’onglet pour les filtres et les fiches. Les GeoPackage/SQLite originaux servent uniquement à la préparation Python. Aucun cache persistant ou mode hors ligne propre au projet ; le navigateur peut appliquer son cache HTTP habituel.

Les tuiles terrain, bâtiments et images arrivent directement de swisstopo. Les PDF de fiches et les horaires restent sur les sites officiels, ouverts par un lien : leur contenu n’est pas recopié. Seul le PDF des conditions est livré avec le site. Actualiser les instantanés exige une nouvelle préparation validée ; aucune synchronisation automatique.

## Configuration territoriale — P7

Le Jura reste la configuration par défaut. Identité, destinations, vue initiale, sources, crédits et couches disponibles sont décrits dans `src/territories/jura.js`. Une autre configuration peut être sélectionnée avant compilation par la variable d'environnement `VITE_TERRITORY`, correspondant à un fichier dans ce dossier. Aucune copie de l'application ni renommage du dépôt n'est nécessaire.

Le témoin `navigation-control` vérifie un départ à Porrentruy, deux destinations et aucune couche cantonale ; il n'est pas une seconde ville publiée. La [validation P7](docs/VALIDATION_P7.md) décrit les commandes et les limites. Les adaptateurs patrimoine et bus restent propres aux schémas du Jura ; Bâle et ses parkings ne sont pas intégrés.

## Données Jura préparées — P2

Le lot P2 prépare les sources officielles : **1 159 fiches patrimoine (1 156 positions exploitables), 464 arrêts, 140 tracés et 2 zones Noctambus**. Fichiers GeoJSON WGS84, provenance, empreintes et conditions dans [data/jura](data/jura/README.md). P3/P4 copient les quatre GeoJSON et les conditions pour les couches activables. Les trois fiches aux coordonnées aberrantes restent conservées sans position inventée.

Python 3.12+ est nécessaire uniquement pour préparer les données, pas pour lancer le site. [Installation isolée, reconstruction et contrôles](docs/VALIDATION_P2.md#commandes-reproductibles) : versions Python verrouillées, archives officielles vérifiées, reproduction et attributs contrôlés. Huit repères des quatre localités comparés à REFRAME swisstopo et examinés sur orthophoto. Conditions cantonales jointes, crédit à préserver ; aucun EGID déduit. P3 affiche le patrimoine et P4 le réseau de bus statique.

## Préparer les mesures PC et Galaxy — P5

Le [protocole P5](docs/VALIDATION_P5.md) fournit un parcours de sept configurations et les commandes PC/Android. Vérification courte : `node scripts/measure-performance.mjs --device desktop --preset medium --smoke`. La session complète parcourt les quatre localités pendant plus de dix minutes, avec preset fixe, lectures FPS/pauses, réseau et mémoire disponibles ; conditions de l’appareil consignées. Rapports uniques ignorés sous `.vite/p5/`. Campagnes complètes du 1er octobre : A53 **13 min 17 s**, PC **11 min 56 s**, chacune **28 phases/616 lectures**, au preset Faible commun. La version du panneau et les fenêtres diffèrent ; aucun rapport de puissance déduit. Tab S8 Faible **13 min 27 s** et Moyen **12 min 28 s** terminés, chacun 28 phases/616 lectures sans erreur et avec nettoyage confirmé. Récupération réseau Android vérifiée et essais manuels dans deux orientations déclarés réalisés ; retour global final du propriétaire reçu, détail manuel non exhaustif conservé au bilan ; P5 clos avec réserves ; les chiffres du parcours court ne sont pas des résultats de performance.

## Contrôle du site

Le contrôle automatisé utilise Chrome installé à `C:\Program Files\Google\Chrome\Application\chrome.exe` ; il est actuellement adapté à Windows et nécessite le réseau :

```powershell
npm run probe
```

GitHub Actions reconstruit le projet à chaque push ou pull request. Ce contrôle distant ne teste pas la scène 3D en direct.

Pour contrôler la version compilée :

```powershell
$env:JURA3D_URL='http://127.0.0.1:4173/'
npm run probe
```

## Reprendre le projet

Lire dans cet ordre :

1. [État du projet et points ouverts](docs/ETAT_DU_PROJET.md)
2. [Architecture du prototype](docs/ARCHITECTURE.md)
3. [Données, niveaux de tuiles et conditions d'usage](docs/DONNEES.md)
4. [Décisions techniques](docs/DECISIONS.md)
5. [Historique des changements](CHANGELOG.md)

Le [plan de réalisation](docs/PLAN_DE_REALISATION.md) définit les lots, critères de réussite, modèles/efforts conseillés et moments de reprise dans une autre discussion. Le [relais](docs/RELAIS.md) indique la prochaine action. Une [étude exploratoire des villes, couches et moteurs](docs/ETUDE_VILLES_COUCHES_MOTEURS.md) conserve les sources et leurs limites.

Les règles pour maintenir ces documents à chaque évolution figurent dans [AGENTS.md](AGENTS.md). L'étude contient un audit de quatre localités et deux archives cantonales inspectées. P1 est implémenté et contrôlé sur bureau. **Tab S8 (Adreno 730)** : Auto Moyen, parcours automatisé partiel à cause des coupures USB, accès Wi-Fi privé fonctionnel selon le propriétaire, 45–49 FPS manuels sans ombres contre environ 30 et fort moiré avec ombres. Conditions de ces plages non verrouillées. **A53** : Auto Faible, parcours physique réussi. **PC (RTX 4080 Laptop GPU)** : Auto Élevé puis Moyen selon les mesures de deux sessions Chrome ; le propriétaire confirme Élevé dans le navigateur intégré. Le choix dépend de la performance de scène, pas d'un niveau matériel fixe. Ces premiers résultats P1 sont historiques : P5/P6 sont ensuite clos avec réserves et P7 validé sur PC ; voir le bilan courant en tête. S23 reste indisponible et la preuve multicité P8 reste à réaliser. Voir [validation P1 et protocole téléphone](docs/VALIDATION_P1.md).

## État vérifié le 30 septembre 2026

P4 : `build` et `probe` complet P1 + P3 + P4 réussis à **22:35:53 Europe/Zurich**. Huit fiches d’arrêts, quatre cadres et clics sur tracés dans les quatre localités ; groupes, filtres, zones, cache mémoire, coexistence et erreurs/réessais contrôlés. Captures bureau et toucher simulé revues ; aucune nouvelle mesure physique Galaxy. Liens CFF avec préremplissage non confirmé. [Résultats et limites P4](docs/VALIDATION_P4.md). Prochaine étape : P5, mesures reproductibles sur appareils réels.

Contrôle précédent du patrimoine :

P3 : `build` et `probe` complet P1 + patrimoine réussis à **20:20:42 Europe/Zurich**, douze fiches comparées aux sources, clics réels sur repère/groupe et choix de membre, ancrage au relief après rotation/zoom à Saignelégier, filtres, masquage, chargements annulés et erreurs/réessais contrôlés. Captures bureau et toucher simulé revus en portrait/paysage ; aucune nouvelle validation physique A53/Tab S8/S23. Les anciens résultats FPS ne mesurent pas le coût de la couche. Crédit cantonal et conditions accessibles ; douze PDF officiels vérifiés disponibles lors du contrôle. [Résultats et limites P3](docs/VALIDATION_P3.md).

`npm run build` et `npm run probe` ont réussi sur la version compilée P1. Chrome de bureau sans interface a chargé les quatre localités, contrôlé le retour initial, les fonds, l'heure, les bâtiments et la sélection. Les glissements, pincements et boutons ont aussi été contrôlés avec toucher simulé, en portrait et paysage. Cinq pannes injectées ont été suivies d'un réessai réussi avec les données réelles. Aucune erreur n'a été relevée dans le parcours normal. Méthode, relevés bureau et limites : [validation P1](docs/VALIDATION_P1.md).

Les captures ci-dessous restent des références du prototype du 29 septembre ; les captures P1 figurent dans le document de validation :

- [Vue à midi](docs/images/delemont-midi.png)
- [Vue à minuit](docs/images/delemont-nuit.png)
- [Fenêtre étroite](docs/images/delemont-mobile.png)
- [Comparaison des réglages d'ombres sur les maisons](docs/ARCHITECTURE.md#qualité-visuelle-des-ombres)

Cette vérification décrit une session de navigateur automatisé. La fluidité, la mémoire et la consommation d'énergie sur un téléphone réel restent à mesurer. Les ombres du relief et le changement d'éclairage sont visibles ; l'exactitude des ombres portées par chaque bâtiment n'est pas encore qualifiée. Les ombres déjà présentes sur la photographie aérienne ne changent pas avec l'heure sélectionnée. Le projet ne couvre pour l'instant ni le canton entier, ni les données en direct, ni le mode hors ligne.

## Licence et données

- [Terrain swisstopo](https://docs.geo.admin.ch/visualize-data/terrain-service.html)
- [Bâtiments 3D swisstopo](https://docs.geo.admin.ch/visualize-data/3d-tiles.html)
- [Tuiles XYZ swisstopo](https://docs.geo.admin.ch/visualize-data/xyz.html)
- [Conditions d'utilisation geo.admin.ch](https://www.geo.admin.ch/en/general-terms-of-use-fsdi)

Le code propre à ce dépôt est publié sous [licence MIT](LICENSE). Les bibliothèques et les données tierces restent soumises à leurs propres conditions. Les données sont créditées « © swisstopo » dans l'interface. Avant une publication à large audience, vérifier les mentions requises pour chaque couche et le respect des règles de fair use ; voir [DONNEES.md](docs/DONNEES.md).

La vue aérienne était auparavant limitée au niveau 18 par le prototype. Le service fournit des tuiles au niveau 20 près de Delémont. La couche topographique annonce un niveau 19, mais la tuile vérifiée à Delémont est vide ; le prototype conserve donc le plafond 18 pour cette couche.
