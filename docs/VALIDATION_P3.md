# Validation P3 — patrimoine et fiches

**Complément physique du 1er octobre 2026 :** première campagne A53 avec la couche, contrôles tactiles injectés et revue de captures réalisés ; retour manuel général positif, panneau corrigé après le défaut paysage. Échantillon de fiches/groupes, sans validation exhaustive des liens ni récupération réseau physique. [Preuves et limites P5](VALIDATION_P5.md). Les contrôles bureau datés ci-dessous sont conservés.

**30 septembre 2026 — développement local autorisé par « continue » après P2.** Patrimoine uniquement ; aucun transport, temps réel ou autre ville ajouté. P2 et changements antérieurs conservés, `main`, base `57eb361`. Aucun stage, commit, push ou déploiement.

**Build et probe complet réussis, dernier contrôle achevé à 20:20:42 Europe/Zurich** (`2026-09-30T18:20:42.527Z`), Chrome `154.0.8037.92`. P1 : cinq erreurs/réessais récupérés, parcours normal 1003 réponses imagerie / 1864 terrain / 799 bâtiments, zéro erreur signalée. P3 : douze fiches, clic réel sur repère/groupe, choix d'un membre de groupe sur bureau et toucher simulé, filtres/cache/annulations et deux erreurs patrimoine récupérées. Mesures de flux de cette session, pas benchmark mobile.

Version : JS `index-CelgaD5v.js` (4197.79 kB), CSS `index-DeC9mk-m.css` (29.52 kB). SHA256 : index `cb425e8c22bc4ddc7ccf23d0a0d9233c51e775aa00e974f7a16c4da0892c164c`, JS `350b7b39455fa1b5f856436e11e24a68b9533e136df1430be1efc9a00eb61c3f`, CSS `3a2700620f7540d82d55a913e772d4f2d2510ecd6a63dec277ff247b296df213`. Avertissement de taille Vite existant, compilation réussie. Données patrimoine et conditions P2 inchangées.

## Correction des groupes après retour utilisateur

Le contrôle initial à 19:34 vérifiait le clic sur un groupe, mais pas son ancrage au relief pendant une rotation. Le propriétaire signale ensuite des chiffres qui glissent et un zoom peu exploitable. Les « P » avaient une référence de hauteur, les primitives de groupe aucune ; leurs positions moyennes issues des entités sans Z restaient près de l'ellipsoïde. Correction : `CLAMP_TO_TERRAIN` explicite pour repères et chiffres. Le clic sur un chiffre ouvre ses membres réels, triés par nom source, avec boutons de consultation ; la fiche ne force pas un vol caméra. Liste retirée au changement de sélection/filtre/masquage et accès conservé même si des repères ne se séparent pas au zoom.

Régression ciblée à Saignelégier : dix vues demandées (initiale, quatre rotations, inclinaison, deux zooms avant et deux arrière). Sept vues comportaient un groupe visible et ont été mesurées : groupes de quatre/cinq lieux, relief 977,45 à 981,67 m, référence terrain et **écart d'ancre projetée 0 px** dans cet échantillon (seuil de test 3 px). L'API publique de projection du billboard rendu est comparée au même point projeté avec la hauteur du globe ; ces hauteurs sont des observations de relief, pas des attributs patrimoniaux. Les vues sans groupe visible ne prouvent pas une séparation exhaustive : les repères peuvent se séparer ou sortir du cadre. La composition reste calculée en pixels et peut varier avec la vue ; le chiffre représente son groupe courant, pas un monument fixe.

Clic réel sur un groupe de six lieux puis choix d'une fiche source sur bureau ; tap sur un groupe et choix d'un membre en portrait simulé, cible d'au moins 44 px. Titre, fermeture et crédit fixes, liste défilante. Captures dédiées : [Saignelégier](images/p3-groups-saignelegier.png), [après rotation](images/p3-groups-rotation.png), [membres du groupe](images/p3-group-list.png), [liste tactile simulée](images/p3-group-touch.png). Aucun essai physique supplémentaire ; confirmer ce correctif dans le navigateur intégré et sur Galaxy avec le protocole ci-dessous.

## Périmètre et fonctionnement

Dans « Patrimoine et lieux », activer la couche puis choisir localité, catégorie et lieu. Par défaut elle est désactivée : aucun fichier patrimoine téléchargé et aucune entité ajoutée avant activation. « Destination courante » suit la dernière navigation P1 achevée ; un filtre localité explicite reste choisi. « Toutes les localités » donne accès au répertoire complet, sans nouveau bouton de destination. Les repères « P » peuvent être touchés ; les groupes chiffrés indiquent plusieurs lieux et ouvrent au clic la liste de leurs membres. Chaque bouton ouvre la fiche du lieu source, sans déplacement de caméra forcé. Le zoom peut séparer les repères, mais il n’est pas requis pour consulter ces lieux. « Voir la fiche et le lieu » ouvre la fiche et cadre le lieu s'il a une position.

Les noms, descriptions, catégories, communes/localités, références RBC et datations viennent de `data/jura/heritage.geojson`. Aucune adresse, importance ou jointure EGID fabriquée. La sélection d'un repère est une fiche de **lieu**, distincte du bâtiment 3D. Les trois fiches aux positions aberrantes restent dans la liste avec mention « sans position », sans repère ni déplacement de caméra. Description absente : mention explicite. Les PDF restent hébergés par le canton ; chaînes affichées avec `textContent` et liens limités au chemin officiel `geo.jura.ch/doc/OCC/RBC/<numéro>.pdf`, en HTTPS. Un lien absent/illégal ou connu indisponible n'est pas actif.

Sur téléphone, l'ouverture d'une fiche replie le menu pour libérer la scène. Titre, fermeture et crédit de la fiche restent fixes ; description/propriétés/liens défilent. Le panneau a une hauteur limitée et le bouton/lien PDF une cible de 44 px minimum. Le compteur FPS et les crédits swisstopo restent présents. Les réglages de rendu et la sélection préexistante des bâtiments sont conservés.

## Sources livrées au site

Vite copie seulement le GeoJSON patrimoine, les conditions cantonales et les contrôles de liens sous `/jura/`. Les fichiers d'arrêts/tracés/zones restent hors `dist/`, pour P4. Source et crédit lisibles dans le menu actif et les fiches : « © Géodonnées de la République et Canton du Jura », Office de la culture / SIT-Jura, lien de catalogue. Conditions originales accessibles dans le menu ; [préparation/droits P2](VALIDATION_P2.md) inchangés. Les fiches PDF individuelles et leurs illustrations ne sont pas copiées.

Une `CustomDataSource` Cesium contient uniquement les lieux géoréférencés correspondant aux filtres, avec regroupement de repères proches. Par défaut Delémont : 80 lieux et repères. Tous les lieux : 1 159 fiches / 1 156 repères ; trois géométries nulles. Retirer la couche enlève la source, les callbacks et sa sélection ; des réponses tardives ne doivent pas réactiver la couche. Les données validées sont gardées en mémoire pour une réactivation dans la page. Changement de filtre ferme une fiche devenue incohérente. La hauteur de cadrage utilise le relief disponible, sans publier une altitude patrimoniale. Repères et chiffres sont explicitement ancrés au terrain ; cela ne prouve pas une correspondance au bâtiment.

## Liens officiels échantillonnés

Douze requêtes réelles vers les URL HTTPS du canton le 30 septembre : **12 HTTP 200 et signatures `%PDF-`**. Seuls les cinq premiers octets lus, sans copie du contenu. URL originales et résultats datés dans [jura-heritage-link-checks.json](../data/jura-heritage-link-checks.json). L'URL HTTP d'origine reste dans les propriétés source ; seul le lien d'interface utilise HTTPS. Une observation n'est pas une garantie de disponibilité future ; les autres liens ne sont pas qualifiés exhaustivement. Le navigateur n'effectue pas de sondage supplémentaire de chaque PDF à l'ouverture de la fiche.

| Localité | Trois fiches contrôlées |
| --- | --- |
| Delémont | Château (fiche 2285), Château de Domont (2307), Église de Montcroix (3135). |
| Porrentruy | Château de Porrentruy (1304), « - église Saint-Pierre » (1308), Église Saint-Germain (1309). |
| Saignelégier | Ancienne châtellenie, Halle du Marché-concours, Juventuti. |
| Saint-Ursanne | Collégiale (1657), « - ruines du château » (1660), Mur d'enceinte et tour. |

## Contrôles automatisés

`npm run probe` conserve les régressions P1 et appelle `scripts/probe-heritage.mjs`. Celui-ci peut aussi s'exécuter seul avec `node scripts/probe-heritage.mjs`. Version compilée sur `127.0.0.1:4173`, Chrome Windows sans interface, Playwright ; services relief/bâtiments/imagerie réels. Le rapport P3 est `probe-p3-report.json`, ignoré par Git.

Parcours : absence de téléchargement avant activation, cardinalités et filtre catégorie, suivi des quatre destinations, douze fiches comparées aux attributs du GeoJSON, sélection réelle d'un repère et d'un groupe, fiche réelle sans position, effacement au filtre/masquage, répétitions activation/désactivation, réutilisation du cache mémoire, annulation de chargement retardé et bascules rapides. Les tests tactiles sont des **simulations Chrome 390 × 844 puis 844 × 390** : liste/bouton, menu replié, absence de débordement, lien de 44 px, titre/fermeture/crédit présents après défilement. Ce ne sont pas des essais physiques Galaxy.

Pannes contrôlées dans des pages séparées : HTTP 503 du GeoJSON, JSON incomplet, puis réessai sur le fichier réel. Les cas de description absente et de lien dangereux ou connu HTTP 404 sont simulés avec des copies des données en mémoire, sans modifier les livraisons. Ils ne décrivent pas une panne observée du service cantonal. Le statut de la scène P1 reste indépendant du statut patrimoine. Les erreurs attendues sont séparées du parcours normal.

Une première copie statique conservait des sous-dossiers `data/jura` et faisait répondre la page HTML à l'URL GeoJSON ; réglage `stripBase` corrigé et vrai contenu servi vérifié avant le parcours réussi. La fiche longue faisait initialement disparaître titre/fermeture dans son défilement ; ils ont été fixés avant validation finale. Le contrôle FPS P1 attend maintenant une nouvelle fenêtre de lecture positive après retour au premier plan/preset, au lieu de vérifier immédiatement une ancienne valeur de pause. L'exigence de valeur positive est conservée.

Captures initiales P3 à 19:34 revues, y compris simulation tactile (captures dédiées du correctif ci-dessus) : [Delémont](images/p3-delemont.png), [Porrentruy](images/p3-porrentruy.png), [Saignelégier](images/p3-saignelegier.png), [Saint-Ursanne](images/p3-saint-ursanne.png), [clic sur un repère](images/p3-marker.png), [fiche sans position](images/p3-unplaced.png), [portrait](images/p3-touch-portrait.png), [paysage](images/p3-touch-landscape.png), [erreur simulée](images/p3-error.png). Sur téléphone simulé, fiche 320 × 413,55 px, lien 44 px, aucune largeur dépassant les 390 px ; titre/fermeture/crédit conservés après défilement et rotation. Ces vues ne sont pas des captures Galaxy physiques.

## Essais physiques à préparer

Sur A53 et Tab S8, recharger la preview disponible, ouvrir « Patrimoine et lieux », activer la couche, choisir un château/église dans les quatre localités et consulter la fiche. Vérifier glissement/pincement, stabilité des chiffres sur le relief en rotation/zoom autour de Saignelégier, touche sur un chiffre puis choix d’une fiche dans ses membres, touche sur un repère, choix localité/catégorie, fermeture et masquage, titre/crédit/lien après défilement en portrait/paysage. En « Toutes les localités », consulter une fiche marquée sans position : aucune caméra déplacée au jugé. Contrôler l'ouverture d'un PDF externe et le retour à la carte. Comparer une même vue avec/sans patrimoine et bâtiments en gardant le même preset ; relever la fluidité, pauses et chauffe sur une session prolongée. Garder les ombres désactivées en Moyen sur Tab S8. S23 toujours indisponible.

Aucune mesure P3 physique effectuée dans ce lot ; ne pas réutiliser les anciens FPS P1 comme preuve du coût de la nouvelle couche. Les limites A53, stries des ombres et vrai LOD restent séparées. Le propriétaire avait reporté le contrôle spécifique de la hauteur du menu paysage.

## Limites et suite

Les points ne définissent pas l'emprise des biens et peuvent partager une même position ; les groupes et la liste permettent leur consultation sans attribuer un nom au bâtiment sous-jacent. Le répertoire contient 17 descriptions vides, trois positions douteuses et aucun champ autonome d'importance/EGID. Les PDF peuvent fournir davantage d'informations ; aucune extraction/republication de celles-ci. Liens externes dépendants du réseau et du service cantonal, contrôle limité à douze. Cache mémoire facultatif à la page, aucun mode hors ligne garanti. Coût mobile et rendu des groupes à qualifier sur appareil réel.

Prochain lot prévu : **P4 transports statiques**, avec arrêts/tracés et liens horaires, en conservant les zones Noctambus comme variante. Aucun bus animé présenté comme GPS ; autorisation de publication/commit toujours distincte.
