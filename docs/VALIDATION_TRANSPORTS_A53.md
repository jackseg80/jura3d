# Transports Jura/Bâle — qualification A53 du 27 octobre 2026

**Complément du soir :** une correction du découpage des bâtiments a ensuite été mesurée sur l'A53, avec amélioration en mouvement et retour utilisateur positif ; [rapport séparé, limites et état du dernier parcours](CORRECTION_BALE_A53.md). La campagne initiale ci-dessous reste intacte et ne devient pas une validation de cette nouvelle version.

**Campagne terminée ; fonctionnement contrôlé, performance Bâle non validée par le propriétaire.** Jura jugé correct pour l'A53 ; Bâle signalé à5–10FPS lorsque tout le réseau local est affiché. Correction à qualifier avant B2/B3. Base documentaire21db861, source applicative2dba808 ; modèle/effort conservés, aucun sous-agent, push ou déploiement. Les preuves P5/P6/P8 historiques gardent leurs versions et réserves.

## Appareil et méthode

A53 SM-A536B/R5CT309CGAV, Android16, Chrome156.0.8078.47, Mali-G68 ; écran physique portrait360×666CSS/DPR3, tampon216×400. Faible (échelle0,6, MSAA1, SSE9,6), bâtiments actifs et ombres coupées, soleil21juin2026 à14UTC, secteur local. Patrimoine/parkings/zones coupés pendant les mesures. Aucun émulateur, redimensionnement, purge de cache ou réglage système/radio/VPN par l'agent. Préférence initiale **Auto** sauvegardée avant modification ; un seul onglet propre et accès USB identifiés, voir RELAIS.

Deux passages, ordre des territoires/villes inversé au second ; bus masqués, arrêts seuls, tracés seuls puis ensemble. Chaque fenêtre : remise au cadrage, stabilisation2s puis10lectures FPS natives à1s, rotation par bouton toutes les250ms. Configuration/visibilité/orientation/GPU contrôlés avant/après. Caches ordinaires et charge USB ; chargement et échauffement non isolés. Les changements de cases et de cadrage reconstruisent le fournisseur ; ces transitions font partie du protocole. Ce n'est pas une comparaison avant/après de deux versions et les différences entre états ne prouvent pas à elles seules leur coût causal.

**27.10.26 09:59:22–27.10.26 10:15:52 Europe/Zurich**, 16min31s, **56fenêtres/560lectures**. Batterie 69→71%, température batterie 21.4–26.8°C pendant la mesure, thermique Android 0. Avant préparation, premier relevé68%/19,9°C. Ces températures ne constituent pas une mesure de surface ou de fréquence CPU/GPU ; aucun résultat d'autonomie déduit sous chargeUSB.

Les index et JS réellement reçus sur Android correspondent aux empreintes PC : Jura index-eTTQp0XO.js / Bâle index-Dcj5VX8M.js ; données Jura inchangées, choix du renderer terrain-imagery vérifié, une couche d'imagerie sans tracés/deux avec. Aucun échec JavaScript, rejet fetch observé ou état de couche en erreur enregistré dans les56fenêtres, aucune coupure ADB pendant ce parcours. La surveillance réseau est partielle (fetch et état de l'application), pas un inventaire complet des requêtes image/XHR.

Les rotations déclenchent de nouveaux chargements : **468/560lectures** portent le statut global loading, et 49/56fenêtres se terminent encore dans cet état. Le protocole attend prêt avant la rotation, sans imposer que toutes les vues suivantes soient préchargées. Ces fenêtres caractérisent donc aussi l'exploration avec chargements, pas un rendu fixe entièrement en cache ; toutes sont conservées.

## Cadences et pauses conservées

Valeurs **passage1 / passage2**, médianes des10lectures ; ne pas lire ces paires comme avant/après optimisation.

| Vue | Bus masqués | Arrêts seuls | Tracés seuls | Arrêts + tracés |
| --- | --- | --- | --- | --- |
| Delémont | 18.5 / 12.5 | 17 / 14.5 | 33 / 15.5 | 27 / 15 |
| Porrentruy | 30.5 / 18 | 25.5 / 14 | 25.5 / 6 | 26.5 / 23 |
| Saignelégier | 58 / 34 | 57.5 / 34.5 | 52.5 / 36 | 48 / 33.5 |
| Saint-Ursanne | 56 / 13.5 | 59 / 20.5 | 58.5 / 40 | 57.5 / 41 |
| Bâle · centre | 6 / 15.5 | 9 / 15.5 | 12 / 17 | 11.5 / 8 |
| Bâle · gare CFF | 22.5 / 21 | 17 / 15 | 19 / 13.5 | 16.5 / 11 |
| Bâle · Messe | 28.5 / 31 | 21.5 / 29.5 | 41.5 / 25.5 | 19 / 10 |

Avec arrêts et tracés, minimaFPS / nombre d'intervalles RAF≥100ms / plus grand intervalle enms :

| Vue | Minimum FPS, passages1 /2 | Intervalles ≥100ms, passages1 /2 | Maximum ms, passages1 /2 |
| --- | --- | --- | --- |
| Delémont | 16 / 11 | 13 / 28 | 167 / 242 |
| Porrentruy | 20 / 17 | 14 / 9 | 192 / 225 |
| Saignelégier | 24 / 28 | 2 / 1 | 142 / 108 |
| Saint-Ursanne | 7 / 33 | 8 / 0 | 243 / 92 |
| Bâle · centre | 0 / 7 | 36 / 59 | 1364 / 259 |
| Bâle · gare CFF | 4 / 6 | 29 / 45 | 410 / 326 |
| Bâle · Messe | 11 / 6 | 19 / 44 | 184 / 335 |

**Limite matérielle observée :** ralentissements et pauses marqués à Bâle, y compris lors de références sans bus ; ensemble8–19FPS médians dans ces fenêtres. Jura ensemble15–57,5FPS selon vue/passage.30FPS constants non acquis. Les références et les passages varient ; pas de gain causal Android revendiqué, ni de cause isolée (rendu, chargements/cache, fréquences/charge non mesurées). Le retour sur les gestes usuels doit rester distinct de cette rotation instrumentée.

## Contrôles de fonctionnement et propriétaire

Les deux parcours injectés dans Chrome physique sont réussis : arrêt réellement touché, vrais tracés/groupes de2identités Jura et6Bâle, choix de fiche, liens présents, surbrillance/fermeture, réseau fourni/local, filtres jour/nuit (550/313objets sur réseau fourni) et tram/bus (397/443), zones Noctambus distinctes et coexistence patrimoine/parkings. Rapports functional-jura/basel.json. Ce ne sont pas des gestes humains ni une validation de la disponibilité de chaque lien externe.

**Jura, retour humain :** l'utilisateur juge que cela fonctionne et reste correct pour un A53 peu puissant. Portrait360×666 et paysage722×274 observés, avec gestes, fiches d'arrêts/groupes et interactions patrimoine/bâtiments ; défilements/fermetures observés. Filtrages jour/nuit, secteur et liens manuels non confirmés séparément par ce retour global ; leurs vérifications automatisées restent distinguées.

**Bâle, retour humain :** « quand tout est affiché », environ5–10FPS et fonctionnement passablement lent. Configuration relevée : Faible, gareCFF, secteur local active,699objets filtrés, sourceCount1 (pas de parking actif),2couches d'imagerie, bâtiments actifs/1,65million de triangles à cette vue. Le ralentissement ne résulte donc pas d'un choix réseau entier constaté. Seul le portrait est observé à ce stade ; le paysage et l'usage manuel complet restent à reprendre après correction. **B1 physique n'est pas clos.**

## Diagnostic après le refus de performance Bâle

Vue exacte du propriétaire conservée, sans rotation ni navigation : huit états, stabilisation5s puis8lectures. Avec bâtiments, médianes31–32FPS sans bus et23,5–32,5avec ensemble ; lignes seules30,5, arrêts seuls30,5. Sans bâtiments, terrain seul et réseau complet59FPS. Données de transport conservées, bâtiments rétablis ensuite. Ce contrôle différent ne remplace pas les mesures en mouvement ni le retour5–10FPS. Rapport isolate.json/log : coût important des bâtiments observé, cause de tous les ralentissements en déplacement non isolée.

Prototype local ignoré pour mesurer plusieurs détails géométriques, même scène/Mali/Faible/réseau ; aucune source applicative modifiée. Diagnostic-site copié de la référence PC, seul accès Viewer ajouté dans le bundle probe, empreintes dans prototype.json ; serveur4316 et reverse4175→4316 temporaires. Seulement3fenêtres obtenues : SSE9,6 fixe31FPS/1,48Mtriangles ; SSE9,6 rotation16,5FPS ; SSE16 fixe32FPS/1,65Mtriangles. **Aucune réduction de géométrie ou correction validée par ce partiel.** Essai interrompu par Runtime.evaluate timeout, A53 ensuite absent d'ADB ; rapport incomplete sse.json terminé10:44Europe/Zurich et journaux/captures conservés. Ne pas remplacer les56fenêtres par ce prototype. La référence4306 et ses sources restent intactes.

**Prochaine action :** poursuivre sur PC l'analyse de la structure du modèle et du coût du rendu/découpage des bâtiments ; choisir une correction concrète puis la mesurer sur l'A53 avant de reprendre Bâle en paysage et son usage manuel complet. Conserver bâtiments, données/fiches et attribution ; aucun changement de fournisseur ou de découpage retenu à ce stade. B2/B3 restent différés.

## Préparation, preuves et nettoyage

Avant le parcours, liaison USB interrompue à plusieurs reprises ; câble/port changé par le propriétaire, transport stable ensuite pendant les mesures. Réglages USB initialement au premier plan, Chrome remis devant. Le mode diagnostic impose Élevé au démarrage : preset Faible ensuite appliqué explicitement et vérifié avant mesure. Journaux de préparation exclus des résultats, conservés séparément.

Preuves ignorées .vite/mobile-transit-2026-10-27/ : access.json, session.json (toutes les lectures et états), metrics.json, measure.log, scripts, journaux de préparation, functional-jura/basel.json et relevés manuels, isolate.json, prototype.json et sse.json. Les sources applicatives n'ont pas changé ; builds/probes PC réutilisés sur empreintes stables.

**Nettoyage confirmé le27octobre vers10:57Europe/Zurich après reconnexion demandée :** minuteurs propres arrêtés, Auto restauré puis relu ; onglet original absent, onglet de récupération créé pour relire/restaurer la préférence puis fermé et absence vérifiée après attente de la fermeture asynchrone Android. Autre onglet préservé. Seulement forward9228 et reverse4175 retirés de l'A53 ; listes restantes vides. Preuves cleanup-final.log, cleanup.json, access-cleanup.json ; premier contrôle immédiat de fermeture trop tôt, journal distinct conservé. Serveur diagnostic4316 arrêté ; preview utilisateur4306 conservée. Aucun Browser.close Android ou réglage système modifié ; A53 débranchable. B1 physique/performance Bâle restent ouverts, B2/B3 différés. Aucun push/déploiement.
