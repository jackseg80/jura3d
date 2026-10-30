# Démonstration Jura

## Finition du 30 octobre

Le propriétaire demande une dernière petite finition avant un premier échange. Image d’accueil remplacée par une capture réelle du rendu Original, cadrage proche, résolution normale et ombres simulées désactivées pour la capture seulement. Aucune modification des réglages de démarrage ; la légende précise ces réglages. Le JPEG346967octets remplace le PNG1729093octets, sans retouche d’image ou géométrie. L’ancien habillage C1 n’est plus l’illustration principale ; il reste une option dans la carte. Présentation et deux libellés du bandeau raccourcis, gestionnaires de commandes inchangés.

Les preuves de cette finition sont dans `.vite/presentation-polish-2026-10-30/`, notamment `photo-check.json` et le nouveau `final-check.json`. L’intégralité des copies/probes du29octobre est conservée sous `.vite/presentation/` ; les paragraphes de cette date ci-dessous sont historiques. Même périmètre local : aucun commit, push, publication, message, appareil ou benchmark. Prochaine action : revue de la version finie puis décision séparée de mise en ligne.

**Remise du30octobre :** build autonome et assemblages racine/Pages réussis. Deux répétitions ont terminé les trois groupes propres à la présentation Jura (page, parcours/fiches/bus/autre localité, portrait/paysage320/390/722px), puis vérifié le retour au Jura normal. Le contrôle final de Bâle échoue lors du chargement de tuiles `3d.geo.bs.ch`, avec `ERR_HTTP2_PROTOCOL_ERROR` et attente de90s. Rapports complets d’échec conservés : `probe/` et `probe-repeat/`. Cause réseau non isolée, aucun contournement ; ne pas déclarer le probe global réussi. Bâle à recontrôler avant une démonstration de ce territoire.

Les paquets Jura et Bâle compilés ne diffèrent de ceux du29octobre que par les deux textes du bandeau, comparaison intégrale `bundle-comparison.json`. Scène, actions, styles, rendu et sources restent identiques : contrôles globaux P1/P3/P4/P6 et C1 du29octobre réutilisés dans leur portée, sans en faire un succès réseau actuel de Bâle. Aucune nouvelle mesure FPS ou qualification physique. Copie803fichiers figée sous `site-delivery/`, nouvelle capture [page de présentation](images/presentation-jura-2026-10-30.png). La remise Jura reste locale et indépendante, prête pour un premier retour exploratoire ; publication et envoi à autoriser séparément.

## Objectif et autorisation

Préparer un premier échange exploratoire sur l’intérêt d’une vitrine du territoire. Prototype indépendant, sans soutien officiel annoncé. La complémentarité avec le GéoPortail reste à discuter ; aucune utilité exclusive, commande ou application Android acquise.

Le propriétaire approuve une petite préparation locale : présentation claire, parcours court et premier affichage allégé. Aucun commit, push, déploiement, message au canton, service payant ou appareil dans ce lot. P9 et l’extension de l’habillage restent en attente.

## Ouvrir et présenter

[Présentation locale](http://127.0.0.1:4337/jura3d/presentation/) et [carte de démonstration](http://127.0.0.1:4337/jura3d/jura/?presentation=1). Ces liens fonctionnent uniquement sur le PC qui sert l’aperçu ; ne pas les envoyer au canton.

La page est statique, sans moteur 3D, police distante, statistique ou géoservice avant d’ouvrir la carte. La capture est issue du prototype C1 : cadrage proche de Delémont, Élevé, habillage illustratif activé et commandes masquées pour la prise de vue ; crédit Cesium conservé dans le fichier, attribution swisstopo visible dans la page. Ce n’est pas une photographie réelle des façades. La carte démarre en Original.

`presentation=1` concerne seulement le Jura : compteur FPS masqué, réglages détaillés repliés, trois accès aux commandes existantes et retour vers la présentation. Ni preset mémorisé, données, caméra initiale, heure, ombres ou rendu modifiés. Compteur réactivable. Sans ce paramètre, Jura et Bâle conservent leur entrée habituelle.

## Parcours proposé — environ trois minutes

1. **Territoire, 45 secondes.** Ouvrir la carte et déplacer la vue à Delémont. Choisir Faible si nécessaire ; ne pas promettre une fluidité universelle.
2. **Patrimoine, une minute.** « 2 · Patrimoine », choisir Eglise Saint-Marcel et « Voir la fiche et le lieu ». Montrer le lien PDF officiel, puis fermer la fiche. Le repère n’est pas une association automatique au volume voisin.
3. **Transports, 45 secondes.** « 3 · Bus », choisir un arrêt et ouvrir ses informations/liens horaires. Réseau statique du 13 septembre 2026 ; aucun véhicule, retard ou départ en direct.
4. **Autre localité, 30 secondes.** « 1 · Explorer », choisir Porrentruy ou Saint-Ursanne. Montrer la continuité de navigation puis revenir à la présentation.

L’essai visuel de Delémont reste facultatif dans « Essai visuel du centre ». Aucun habillage généralisé, fenêtre ou porte reconstruite. La projection seule des ombres conserve les limites C1 documentées.

## Discussion et limites

Déterminer le public et l’usage : découverte touristique, patrimoine ou autre besoin précis. Demander si un parcours simplifié compléterait les outils existants, quels contenus seraient prioritaires et qui assurerait leur actualisation. Android est une piste après confirmation du besoin, avec qualification de performance et maintenance distinctes.

Le [GéoPortail jurassien](https://geo.jura.ch/) propose déjà patrimoine, transports, loisirs et orthophotos historiques. Son [visualiseur 3D](https://geo.jura.ch/geo3d/), lancé en 2023, présente des nuages de points colorés ; pas de maillage urbain avec façades photographiques équivalent à Bâle trouvé dans les sources examinées le 28 octobre. Cela ne prouve pas l’absence d’autres données. La comparaison initiale était insuffisante ; aucune valeur ajoutée exclusive présumée.

Les jeux publics sont réutilisables selon leurs conditions ; l’usage direct des géoservices dans un portail web demande une prise de contact avec le SIT-Jura. Aucune nouvelle source ou permission déduite. Voir [données et conditions](DONNEES.md).

Aucune qualification physique A53 de l’habillage C1 ou de cette révision d’interface ; les anciens essais mobiles restent distincts. Pas d’application Android native, mode hors ligne ou couverture fonctionnelle exhaustive livrés.

## Vérifications et remise

Vérifications du 29 octobre, Chrome156 Windows : `npm run build` et assemblages racine/Pages réussis ; contrôle complet `npm run probe` Jura P1/P3/P4/P6 terminé à09:51:22 Europe/Zurich, zéro problème et aucune erreur patrimoine/transports. Probe présentation quatre groupes, accueil/Jura/Bâle quatre groupes et C1 cinq groupes, tous réussis sans erreur. Portrait/paysage simulés320/390/722px, captures examinées. Aucun nouveau benchmark ou test physique ; aucune cadence mobile déduite. Les deux premiers échecs du nouveau probe (URL de contrôle relative, identifiant de sélection incomplet) sont conservés séparément et corrigés dans le script, sans défaut applicatif observé.

Copie figée803fichiers identiques aux empreintes sous `.vite/presentation/site-delivery/`, référence racine sous `root-delivery/`. Aperçu4337 rattaché à la copie figée ;4335 C1 conservé. Le shader C1 est strictement identique à la version qualifiée du28octobre. Capture de la page : [présentation Jura](images/presentation-jura-2026-10-29.png).

Rapports, captures et empreintes sous `.vite/presentation/`, bilan des contrôles terminés dans `final-check.json`. Preuves C1 préservées sous `.vite/c1/`, aucune ancienne copie figée remplacée.

Le site public a été revérifié le 29 octobre : `573e55ca152996acbce07c9a92651ebcf7bc62f6`, quatre groupes du probe HTTPS réussis, zéro erreur ; rapport `.vite/presentation-review-2026-10-29/public/probe-site.json`. Ce contrôle porte sur la version du 27 octobre, pas sur cette préparation locale. Les documents GitHub restent à la version précédente.

Prochaine action : retour du propriétaire sur cette démonstration, puis décision séparée de publication. Aucun message préparé ou envoyé au canton dans ce lot.
