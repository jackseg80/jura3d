# Bâle A53 — correction du découpage des bâtiments

27 octobre 2026, base `c2a9db3`. **B1 clos avec réserves après correction, contrôles PC et acceptation A53 du propriétaire.** Aucun30FPS constant garanti, S23 et autonomie non qualifiés. Modèle/effort conservés, aucun sous-agent, push ou déploiement. Référence antérieure `.vite/jura-opt/site-final/` sur4306 ; nouvelle livraison figée `.vite/basel-mobile-fix/site-delivery/`, aperçu4317.

## Constats et variantes examinées

La campagne physique initiale et son refus de performance restent dans [VALIDATION_TRANSPORTS_A53.md](VALIDATION_TRANSPORTS_A53.md). Sur PC Intel, une comparaison du découpage polygonal activé/désactivé ne montre pas de gain en le retirant dans les vues testées ; géométries/fréquences variables, pas de cause unique déduite. Quelques branches de métadonnées officielles ont été inspectées, pas le catalogue entier (`model-audit.json`).

Le modèle swisstopo utilisé au Jura a aussi été comparé dans un prototype, avec la même emprise et les transports. Augmenter son seuil réduit les triangles, mais ne prouve pas la conservation des groupes : la hiérarchie ADD et cette limite sont déjà documentées dans [DIAGNOSTIC_PERFORMANCE.md](DIAGNOSTIC_PERFORMANCE.md). Cette variante n'est pas retenue. **Source cantonale, seuil16×résolution, données/fiches, cadrages et attribution conservés.**

## Implémentation retenue

Remplacer, pour le petit cadre bâlois géoréférencé sans transformation, le découpage géographique polygonal par quatre plans verticaux. Le rectangle reste `[7.57,47.54,7.615,47.57]`. `building-clip.js` construit un repère local Est/Nord/Haut, les normales tournées vers l'intérieur et la transformation relative à l'origine du tileset. La collection coupe l'extérieur d'au moins un plan, sans ajouter d'arêtes colorées. Aucun changement de mesh, de source ou de seuil de sélection ; aucune copie de données livrée.

Le rectangle plan approxime le rectangle géographique : sur55contrôles, hauteurs−100/0/250/800/1000m, écart maximal relevé sur les points de bord≈0,51m. Ce maximum échantillonné n'est pas une garantie globale de précision ; de petites différences sont possibles près du bord du cadre d'étude. Tests de points intérieurs/extérieurs et repli sur modèle transformé, grande emprise ou centre non géoréférencé ; ancien polygone conservé dans ces cas, erreur explicite si son contexte est incompatible. Pas d'API privée dans ce calcul.

Le choix des coordonnées et des régions suit l'[API Cesium ClippingPlaneCollection](https://cesium.com/learn/cesiumjs/ref-doc/ClippingPlaneCollection.html), vérifiée aussi dans les sources installées1.145.0. Les sondes exposent le mode de découpe et la conservation de l'intérieur. Jura n'a pas de découpage de bâtiments configuré et garde son comportement.

## Vérifications du candidat compilé

Test numérique55points et cas de repli réussis. Compilations autonome et site Pages, fichiers/données/licences contrôlés ; candidat Jura `index-BzgMQMWa.js`, Bâle `index-hTvvCy4A.js`, CSS inchangée `index-BIPXuHPI.css`. Une première compilation a échoué avec EPERM lors de la copie des ressources ; nouvelle sortie locale et exécution autorisée réussies, journaux séparés.

Le 27 octobre, comparaison compilée à mêmes caméra, qualité Faible, dimensions360×666/DPR3, bâtiments et transports locaux actifs ; contrôles des identités et géométries. Fenêtres courtes de6lectures à1seconde, rotation par commande250ms, ordre des variantes inversé à la gare. Caches et fréquences non verrouillés : pas de gain universel ni de résultat de longue durée déduit.

| Vue | Intel fixe avant → après | Intel rotation | A53 fixe | A53 rotation |
| --- | --- | --- | --- | --- |
| Centre | 68 →70 | 77 →80 | 41,5 →44 | 12 →16,5 |
| Gare CFF | 53 →55 | 95 →91 | 34 →35,5 | 17 →27 |
| Messe | 129 →133 | 104 →105 | 59 →58,5 | 15,5 →23 |

Valeurs médianes en FPS. Intel : gain faible/non uniforme, coût GPU gare12,51→12,87ms à l'arrêt et6,48→6,75ms en rotation ; aucun gain stable général revendiqué. A53 physique SM-A536B, Mali-G68, Android16/Chrome156.0.8078.47,12:31:02–12:34:30 Europe/Zurich :12fenêtres/72lectures,23–24°C/thermique0. Minima en rotation centre4→13, gare11→14, Messe4→7 ; pauses>100ms19→18/17→14/20→18. Amélioration mesurée en mouvement, **30FPS constants non acquis**. Les anciennes mesures16min31s et le refus5–10FPS restent dans le rapport initial ; protocoles différents, pas de comparaison directe avec ces médianes.

Les six blocs A53 de comparaison ont restauré leurs préférences et fermé leurs seuls onglets. Une préparation manuelle supplémentaire a été interrompue par la limite d'usage de l'outil ; contrôle repris le soir sans contourner l'autorisation. Chrome avait déchargé l'onglet, réactivé ensuite par son URL de test unique ; préférence initiale absente restaurée/relecture avant réutilisation. Nouveau parcours18:20:26–18:24:55 Europe/Zurich. Retour propriétaire : « Ça fonctionne mieux […] c'est OK pour moi », puis « tout est ok » à la demande ciblée paysage/défilement/fermeture/lien. Trois destinations, fiches bâtiment/arrêt/groupe,183événements, portrait360×666 et paysage722×274 observés ; retour final portrait. Le relevé ne capture pas de lien externe ni de secteur réseau entier : fonctionnement du lien confirmé oralement, pas de chronométrage manuel du réseau entier déduit. Test tactile injecté sur bâtiment réussi avec adresse et crédit source. Batterie finale83%,23,9°C/thermique0, chargeUSB ; pas de qualification d'autonomie ou de durée prolongée.

Tests purs : découpage55points/replis, configuration,18contrôles parkings, données B1/pagination/conditions, tuiles et géométrie140tracés réussis à la reprise. Builds séparés refaits à18:14 Europe/Zurich : index et JavaScript identiques aux versions mesurées, empreintes dans `resume-audit.json`. Probes finaux bâtiments/parkings Bâle à18:13:54, B1six groupes à18:15:23, accueil/deux territoires à18:16:24 et Jura complet P1/P3/P4/P6 à18:23:33 Europe/Zurich réussis, erreurs/problèmes vides. Contrôles des ressources, données/licences et Workers des sorties autonome et site réussis. Captures centre/gare examinées, bâtiments/fiches et crédits conservés dans les vues contrôlées ; les triangles sélectionnés diminuent selon les vues, ce qui ne constitue pas une preuve exhaustive de chaque bâtiment au bord. Repli et approximation restent explicités ci-dessus.

Un premier banc mobile PC n'a produit aucune mesure : contrôle de qualité masqué ; correction du seul banc, rapport conservé. Le prototype avec deux modules Cesium séparés n'atteignait pas l'état prêt ; il ne qualifie pas le candidat intégré. Un premier probe a échoué avec `ERR_NETWORK_IO_SUSPENDED`, lors d'un épisode de veille Windows consigné ; contrôles repris avec maintien éveillé temporaire du seul processus, relâché à sa fin, sans changer le plan d'alimentation.

Preuves ignorées `.vite/basel-mobile-fix/` : `paired-low.json/log`, `a53-paired.json/log`, `a53-manual.json`, `a53-manual-resumed.json`, `resume-audit.json`, rapports finaux et `check-progress.json`, audits/variantes/erreurs/captures. Aucun résultat du prototype substitué à une validation finale. Nettoyage final18:25:06 : préférence initiale absente restaurée/relecture, onglet propre fermé/absence vérifiée, seuls forward9228 et reverse4176 retirés après contrôle des destinations, listes vides (`access-cleanup-final.json`). Autres onglets préservés ; A53 débranchable.

Suite : qualification des sources/droits B2 lieux et patrimoine, puis B3 services. La clôture avec réserves ne promet pas la fluidité de toute densité/vue ou un réseau entier chronométré ; données statiques et cadre bâlois limité conservés. Publication distincte, toujours différée.
