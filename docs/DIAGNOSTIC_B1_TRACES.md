# B1 — Coût des tracés et GPU du navigateur intégré

**Suite du diagnostic :** l'optimisation décrite comme ouverte dans ce relevé a ensuite été réalisée et qualifiée sur PC. [Rendu retenu, mesures finales et limites](OPTIMISATION_B1.md). Le diagnostic ci-dessous conserve ses versions et observations initiales ; A53/retour utilisateur intégré restent à recueillir.

26 octobre 2026, complément après le signalement du propriétaire. **B1 reste ouvert : optimisation des tracés sur GPU intégré avant qualification A53 et B2.** Sources applicatives `17e93f7` inchangées pendant ce diagnostic ; aucune correction du renderer livrée par ce lot documentaire. Les parcours fonctionnels PC précédents restent valables sur leur version ; le relevé court RTX ne qualifie pas le navigateur intégré.

## Onglet effectivement utilisé

Lecture seule, par le contrôle du navigateur intégré **ChatGPT**, onglet Bâle `http://127.0.0.1:4306/jura3d/bale/`, et non un onglet Brave. Le panneau affiche :

- `ANGLE (Intel, Intel(R) UHD Graphics (0x0000A788) Direct3D11 vs_5_0 ps_5_0, D3D11)` ; le fait que le PC possède une RTX ne signifie pas que cet onglet l'utilise.
- Auto terminé en **Faible**, dernière mesure annoncée **17 FPS** ; compteur instantané observé **14–15 FPS**, après signalement utilisateur d'environ20. Ce ne sont pas des médianes instrumentées de son onglet.
- Secteur local, **562 quais et 155 tracés**, trams et bus activés. Fenêtre1386×1244 CSS, DPR1, tampon831×746, ombres désactivées. Aucun rechargement, case, préférence, navigateur, réglage GPU Windows ou radio modifié par l'agent dans cet onglet. Le changement Auto Moyen→Faible était le fonctionnement propre de l'application pendant la lecture.

La cause du choix Intel par le navigateur intégré n'est pas établie. Ne pas l'attribuer à Brave, à un défaut matériel RTX ou à un réglage Windows non lu. L'ancien incident Auto du navigateur intégré est distinct de ce constat actuel.

## Comparaison mesurée séparément

Chrome156 lancé sans interface dans un profil éphémère, première campagne avec préférence GPU basse consommation du seul processus, seconde avec préférence haute performance ; renderer **relus dans chaque fenêtre**, Intel puis NVIDIA RTX4080Laptop confirmés. Aucun réglage global changé. Instances Vite de diagnostic4311/Jura et4312/Bâle, mêmes sources ; ajout éphémère d'un accès au Viewer dans la réponse JavaScript pour instrumenter le rendu, sans modification des fichiers source.

Faible0,6/MSAA1/sans ombres, fenêtre1386×1244/DPR1/tampon831×746, soleil21juin14UTC, vues initiales centreBâle/Delémont, secteur local. État prêt, attente3,5s, huit lectures FPS à une seconde par état, sans rotation. Référence réseau coupé répétée en fin de chaque bloc. Dix fenêtres Intel **20:23:14–20:25:48 Europe/Zurich**, quatre RTX **20:26:21–20:27:33** ; aucun échec JavaScript ou requête échouée enregistré.

GPU : médiane des requêtes `EXT_disjoint_timer_query_webgl2` entre `scene.preRender` et `postRender`, résultats disponibles et non disjoints seulement. CPU : durée de soumission de cette même portion de rendu, **pas profil CPU total, ni durée RAF totale**. Appels WebGL comptés, pas triangles complets de la scène. Instrumentation susceptible d'affecter les temps ; même méthode dans les états comparés. Charges externes, fréquences, puissance et caches non verrouillés. Pas de rapport de puissance entre GPU ni de causalité par simple différence de FPS.

| GPU / vue | État | FPS médian | GPU médian (ms) | CPU soumission médian (ms) |
| --- | --- | --- | --- | --- |
| Intel / Bâle | Réseau coupé | 29 | 16,35 | 2,3 |
| Intel / Bâle | Quais | 29 | 23,17 | 2,4 |
| Intel / Bâle | Quais et tracés | 6 | 130,67 | 2,4 |
| Intel / Bâle | Tracés en couleur unie expérimentale | 6 | 128,33 | 2,4 |
| Intel / Bâle | Réseau coupé répété | 30 | 15,63 | 2,2 |
| Intel / Delémont | Réseau coupé / quais / complet / coupé répété | 32 / 32 / 25 / 32 | 13,10 / 14,15 / 33,48 / 13,72 | 6,4 / 6,6 / 6,8 / 7,0 |
| RTX / Bâle | Réseau coupé / quais / complet / coupé répété | 144 / 143 / 143 / 144 | 4,98 / 4,20 / 5,29 / 4,85 | 2,8 / 4,2 / 3,4 / 3,3 |

Les **6 FPS instrumentés dans Chrome ne sont pas les 14–20 FPS observés dans ChatGPT**. Deux navigateurs et modalités distinctes, même puce Intel identifiée ; ne pas les confondre. Le coût GPU supplémentaire des tracés est net dans cette campagne Intel. Sur RTX, les lectures restent proches du plafond : ce test ne prouve pas une absence de coût sur toutes les vues/résolutions/presets.

## Ce qui diffère de Delémont

Même `transport.js`, primitives Cesium de polylignes plaquées au terrain, matériau avec contour, découpe5,25km et simplification projetée1m P6. Aucun moteur moins optimisé choisi spécialement pour Bâle. Mais :

| Vue locale | Tracés source filtrés | Portions de rendu | Points source / rendu |
| --- | --- | --- | --- |
| Bâle centre | 155 | 180 | 69 689 / **15 229** |
| Delémont | 30 | 41 | 9 503 / **1 465** |

Environ dix fois plus de points de rendu à Bâle, avec superpositions. Cela ne signifie pas dix fois plus d'informations commerciales ni dix fois plus de coût dans tous les matériels. Les appels de dessin Intel Bâle augmentent seulement187→191 entre quais et réseau complet, tandis que le temps GPU monte fortement : le nombre d'appels seul ne décrit pas le problème. La rasterisation des polylignes terrain denses est la cible de travail ; la contribution exacte de chaque shader/zone de recouvrement reste à isoler.

Le test de matériau uni ne change presque pas le résultat : aucune suppression des contours/pointillés livrée comme « optimisation ». Un audit géométrique exploratoire à un centre voisin relève des segments partagés et une baisse de points avec tolérances2/3/5/8/10m ; ce n'est ni un benchmark de ces variantes ni une décision de dégrader la précision. Sources et géométrie1m de l'application conservées.

## Reprise et critères

Prochaine action B1 : comparer des variantes de rendu bornées (travail des segments partagés, adaptation géométrique au zoom ou couche drapée alternative), **mesurer avant/après sur Intel et RTX**, retenir une solution seulement avec précision explicitée et sélections/fiches/groupes/surbrillance/secteurs/annulation préservés. Ne pas masquer le problème en forçant Faible ou en retirant des lignes sans l'annoncer. Puis contrôle A53 physique ; B2/B3 différés pendant cette qualification.

Preuves ignorées `.vite/b1-perf/` : `diagnose.mjs`, `low.json/log`, `rtx.json/log`, `geometry-audit.json/mjs`, `summary.json`. L'audit géométrique utilise un centre voisin7.5892/47.55, différent du cadrage officiel : ses effectifs ne remplacent pas le tableau ci-dessus. Instances de diagnostic4311/4312 et navigateurs éphémères arrêtés. Au contrôle final, aucun serveur4300/4305/4306 n'était détecté ; seul4306 a été relancé sur le même build `site-delivery`, sans recharger l'onglet utilisateur. Les builds de référence4300/4305 sont conservés sur disque, leurs serveurs ne sont pas actifs. Aucun changement applicatif : build/probe complets de15:46 réutilisés, pas de recompilation documentaire. Aucun push/déploiement ; sauvegarde locale des documents autorisée.
