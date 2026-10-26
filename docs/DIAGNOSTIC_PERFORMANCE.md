# Presets et diagnostic A53 — 30 septembre 2026

**26 octobre au soir — optimisation B1 réalisée et contrôlée sur Intel/RTX.** Fond des tracés Bâle calculé en tuiles locales, mêmes géométries1m/identités et fiches, quais/groupes et surbrillance conservés ; le Jura garde son rendu P6. Comparaisons compilées, probes Bâle/Jura/site et tests de tuiles réussis. [Mesures et limites](OPTIMISATION_B1.md). **Qualification physique A53 et retour subjectif du propriétaire encore ouverts**, B2/B3 différés ; aucun réglage GPU Windows changé, aucun push/déploiement.

**26 octobre 2026 — Bâle B1 :** le navigateur intégré ChatGPT du propriétaire a été lu directement : renderer Intel UHD, AutoFaible,14–15FPS avec les tracés. Ce constat actuel est distinct de l'ancien incident Auto décrit plus bas. Comparaison instrumentée Intel/RTX et Delémont/Bâle dans [DIAGNOSTIC_B1_TRACES.md](DIAGNOSTIC_B1_TRACES.md). Optimisation B1 ouverte avant qualification A53 ; ne pas déduire le GPU utilisé du modèle du PC.

**Complément du 1er octobre 2026 :** première campagne P5 A53 complète, comparaison des sept configurations sur quatre localités, 13 min 17 s. Les anciens chiffres courts ci-dessous restent historiques ; [tableaux, limites et versions P5](VALIDATION_P5.md). Bâtiments/ombres pénalisent fortement les centres denses ; aucun nouveau LOD ou changement de moteur. Panneau corrigé ensuite, sans nouveau benchmark complet du bundle d’interface.

Le propriétaire demande une adaptation automatique et des presets après le premier A53 à 4–8 FPS. Cet ajout local prolonge les essais P1 ; il ne clôture ni P1 mobile ni la campagne P5. S23 indisponible ; Tab S8 rechargée et reprise en fin de document, avec contrôles automatiques partiels et retour manuel Wi-Fi. Sources, identités et crédits conservés, aucun commit/push/déploiement.

## Réglages livrés

| Preset | Dimensions du tampon, par rapport aux pixels CSS | Anticrénelage demandé | Ombres simulées |
| --- | ---: | ---: | --- |
| Faible | 60 % | MSAA 1 | Désactivées |
| Moyen | 75 % | MSAA 1 | Désactivées |
| Élevé | 100 % | MSAA 4 | Complètes, filtrage doux |
| Ultra | 150 % | MSAA 4 | Complètes, filtrage doux |

L'interface garde sa résolution et ses cibles tactiles ; seule la scène change. Les dimensions réduites rendent carte et contours moins nets. Les presets ne masquent pas les bâtiments : la case correspondante conserve le choix utilisateur. Le seuil de sélection est `16 × resolutionScale`, pour maintenir une tolérance de 16 pixels CSS plutôt que retirer des groupes à distance. Les heuristiques Cesium peuvent faire varier les groupes sélectionnés ; ce n'est pas un LOD géométrique et aucune couverture exhaustive n'est garantie. Ultra est un choix manuel plus exigeant, pas une meilleure géométrie du bâtiment.

**Auto, logique révisée après le retour RTX 4080 :** la ligne « GPU WebGL utilisé » affiche le renderer effectif, lorsqu'il est exposé. Un GPU dédié NVIDIA/GeForce, Radeon RX/Pro ou Intel Arc reconnu sert seulement d'indice pour démarrer en Élevé ; un renderer logiciel ou inconnu démarre en Moyen. Ce n'est pas une certification de puissance ni une reconnaissance du matériel installé hors du navigateur.

Après chargement, Auto attend quatre secondes au premier plan, puis calcule la médiane de six fenêtres de rendu d'au moins une seconde. **Deux recommandations consécutives concordantes** sont nécessaires. Depuis Élevé, moins de 35 FPS propose Moyen ; depuis Moyen, moins de 20 propose Faible, à partir de 55 propose Élevé ; depuis Faible, à partir de 45 propose Moyen. Tout nouveau niveau est mesuré avant décision finale. Un retour vers un niveau déjà essayé retient le niveau inférieur et termine, pour éviter l'oscillation. Ces seuils sont des heuristiques à qualifier. Chargement/navigation, onglet masqué ou sans focus effacent les lectures en cours. La mesure reste en attente tant que l'utilisateur ne revient pas au navigateur ; ne pas interpréter cette attente comme un résultat Faible.

Modifier bâtiments/ombres annule Auto et affiche Personnalisé. « Réévaluer » relance une calibration, sans changement continu après le choix. Le compteur visuel peut être masqué : la mesure utilise `postRender`. Le choix explicite Auto/Faible/Moyen/Élevé/Ultra est mémorisé en stockage local et relu au démarrage normal ; les réglages personnalisés de cases ne sont pas persistés par cet ajout. Pas de classement matériel stocké, benchmark synthétique ou réglage Android modifié. Les mesures initiales ci-dessous ont utilisé la première logique (une seule médiane au niveau Moyen) ; elles ne prouvent pas la correction RTX.

Le propriétaire a signalé un choix Faible sur son PC RTX 4080 **dans le navigateur intégré Codex**. L'outil de contrôle de cet onglet a échoué au démarrage (`windows sandbox failed: helper_unknown_error: apply deny-read ACLs`) à deux reprises ; le connecteur DevTools séparé a échoué sur son profil déjà en cours. L'onglet utilisateur et son renderer n'ont donc pas été lus. Ne pas attribuer ce retour à un renderer logiciel, une carte différente ou une cause confirmée. Après correction, le propriétaire confirme le 30 septembre le choix Élevé dans ce navigateur. C'est un retour utilisateur, distinct du contrôle automatisé Chrome ; le renderer de cet onglet et la cause initiale restent non inspectés.

La case **Ombres simulées** permet un contrôle séparé. Élevé et Ultra gardent les ombres préexistantes ; Faible et Moyen gardent l'éclairage solaire mais désactivent les passes d'ombres. Les ombres fixes dans la photo aérienne restent visibles.

## Méthode physique

Galaxy A53 `SM-A536B`, Android 16, Chrome 153.0.8010.53, Mali-G68, viewport 360 × 666 CSS px, DPR 3. Preview local par reverse USB 4175 → 4173, CDP temporaire 9228 ; cache non purgé, pas d'émulation. Avant diagnostic : batterie 65 %, en charge USB, batterie 32,6 °C, état thermique Android 0, économie d'énergie désactivée. Après comparaison des presets : batterie 66 %, 33,3 °C, état thermique 0. Ce sont des relevés ponctuels, pas un suivi continu.

Delémont, 21 juin 2026 à 12:00 dans le navigateur, fond aérien. Chaque variante attend l'état prêt, puis 3,5 s, puis six lectures du compteur à 1,1 s d'intervalle. Statistiques de bâtiments de la passe de rendu Cesium 1.145 : tuiles, triangles sélectionnés et commandes. Champs privés lus uniquement sous `?probe=1`, liés à cette version ; ils ne comptent ni les triangles du terrain ni la répétition des passes d'ombres, ni le coût réel de chaque commande GPU. Captures temporaires et rapports bruts ignorés ; tableaux ci-dessous conservent les lectures sans exclure les baisses.

### Ombres et distance

Session commencée à **14:53:41 Europe/Zurich** (`2026-09-30T12:53:41.048Z`), bundle de diagnostic `index-D9iS3R9r.js`, initialisation 25,641 s. Les variantes d'ombres utilisent un cadrage proche mais une dérive d'environ quelques dizaines de mètres a été relevée : comparaison exploratoire, pas attribution exacte de l'écart FPS aux seules ombres. Les sessions suivantes verrouillent les entrées caméra et replacent chaque variante.

| Variante | FPS bruts | Tuiles / triangles / commandes, dernière lecture |
| --- | --- | --- |
| Ombres complètes, portée caméra 1 800 m | 4, 4, 4, 3, 2, 5 | 105 / 557 712 / 210 |
| Sans ombres | 6, 5, 6, 7, 7, 3 | 104 / 573 628 / 208 |
| Ombres rétablies | 5, 5, 4, 3, 5, 6 | 104 / 573 628 / 208 |
| Bâtiments projettent seulement | 6, 8, 7, 7, 6, 7 | 104 / 573 628 / 208 |
| Ombres sans filtrage doux | 5, 5, 5, 4, 3, 7 | 104 / 573 628 / 208 |
| Sans ombres, portée 900 m | 12, 12, 12, 12, 12, 12 | 57 / 377 262 / 114 |
| Sans ombres, portée 3 600 m | 13, 12, 14, 3, 3, 1 | 124 / 477 788 / 248 |

Les stries des toits disparaissent sur les captures sans réception d'ombres ; leur lien avec cette réception est établi dans ces vues. La cause précise du défaut d'ombrage (précision, biais, etc.) reste non isolée. Désactiver les ombres ne suffit pas à assurer la fluidité ; les baisses de la dernière variante restent à reproduire. Dézoomer change la sélection, mais ne remplace pas chaque bâtiment par un maillage plus simple. [Données et hiérarchie inspectée](DONNEES.md#hiérarchie-des-bâtiments-et-distance).

### Seuil de sélection et résolution

Session à **14:58:35 Europe/Zurich** (`2026-09-30T12:58:35.927Z`), `index-C40eVoso.js`, initialisation 26,657 s ; sans ombres, portée 1 800 m, entrées caméra verrouillées. Même cadrage réappliqué à chaque variante. Résolution normale et MSAA 4, sauf mention contraire.

| Variante | FPS bruts | Tuiles / triangles / commandes |
| --- | --- | --- |
| Seuil 16 | 4, 4, 6, 4, 9, 8 | 105 / 557 712 / 210 |
| Seuil 32 | 12, 9, 9, 7, 10, 3 | 72 / 395 130 / 144 |
| Seuil 64 | 25, 22, 19, 20, 24, 23 | 19 / 61 848 / 38 |
| Seuil 128 | 34, 34, 39, 37, 34, 35 | 0 / 0 / 0 |
| Seuil 16, MSAA 1 | 7, 9, 8, 11, 6, 10 | 105 / 557 712 / 210 |
| Seuil 16, MSAA 1, dimensions à 75 % | 21, 24, 18, 19, 21, 22 | 104 / 551 712 / 208 |
| Résolution et MSAA rétablis | 5, 7, 7, 3, 5, 4 | 105 / 557 712 / 210 |

**Seuils 64/128 rejetés comme optimisation de qualité** : les captures et compteurs montrent la disparition de groupes, jusqu'à zéro bâtiment. Les presets livrés agissent sur le tampon et les ombres, avec compensation du seuil selon la résolution.

### Presets livrés, première comparaison réelle

Session à **15:07:03 Europe/Zurich** (`2026-09-30T13:07:03.020Z`), version `index-tHKVsY_C.js`/`index-BKj7UVKI.css`, initialisation 40,554 s. Caméra verrouillée, portée 1 800 m, presets choisis via le sélecteur. Cache/réseau non caractérisés : ce délai n'est pas un benchmark froid.

| Preset | FPS bruts | Tuiles / triangles / commandes |
| --- | --- | --- |
| Élevé | 2, 4, 3, 4, 3, 5 | 105 / 557 712 / 210 |
| Moyen | 22, 12, 21, 23, 12, 19 | 114 / 577 400 / 228 |
| Faible | 13, 26, 26, 27, 26, 26 | 129 / 636 464 / 258 |
| Auto, choix Faible | 16, 26, 25, 26, 26, 27 | 129 / 636 464 / 258 |

Gain réel dans cette vue, avec bâtiments actifs et sans réduction du nombre de triangles par rapport à Élevé. Les dimensions faibles sacrifient la netteté. Les premières lectures transitoires sont conservées ; les chutes Moyen ne permettent pas de garantir une cadence constante. Objectif provisoire de 30 FPS non atteint de façon stable. Ni Ultra ni les quatre villes sur S23/Tab S8 ne sont qualifiés par cette comparaison.

Auto a mesuré une médiane de 17,27 FPS au niveau Moyen et choisi Faible. Tampons effectivement relevés : Élevé 360 × 666, Moyen 270 × 499, Faible/Auto 216 × 399 ; l'arrondi Cesium réduit les dimensions fractionnaires.

Parcours P1 avec initialisation Auto, commencé à **15:11:02 Europe/Zurich** (`2026-09-30T13:11:02.856Z`), version `index-BFCKht8g.js` : réussi, aucune erreur relevée. Scène prête en 31,245 s, puis Auto a mesuré 10,68 FPS au niveau Moyen et choisi Faible. Quatre destinations : 6,455 / 13,286 / 7,365 / 4,485 s. Retour initial, zoom/inclinaison, glissement/pincement, sélection réelle EGID `973767`, interrupteurs ombres/FPS contrôlés. **Au cadrage initial plus large**, relevés au repos 4, 7, 5, 9, 7, 10 FPS ; avec commandes de rotation 23, 13, 7, 12, 8, 21 FPS. Ce résultat limite la portée du gain à 26–27 FPS obtenu au cadrage central : le preset ne garantit pas cette cadence sur les autres vues. Le tampon 270 × 499 relevé au début du rapport précède la fin du choix Auto, il correspond à sa phase Moyen et ne doit pas être attribué au profil Faible final.

## Contrôle de la correction Auto

Version finale `index-D3hAlH4s.js`, empreintes dans [VALIDATION_P1.md](VALIDATION_P1.md). Le probe bureau achevé à **15:45:20 Europe/Zurich** (`2026-09-30T13:45:20.532Z`) détecte `ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Laptop GPU (0x000027E0) Direct3D11 vs_5_0 ps_5_0, D3D11)` ; deux médianes Élevé 67,29 et 50,90 FPS confirment Élevé. Contrôles réussis : attente sans focus simulée, quatre presets et dimensions réelles du tampon, ombres, bâtiments conservés, annulation manuelle et choix mémorisé après rechargement. Ce Chrome Windows piloté est distinct de l'onglet intégré utilisateur.

Dernier A53 commencé à **15:42:39 Europe/Zurich** (`2026-09-30T13:42:39.376Z`), même JS : GPU `ANGLE (ARM, Mali-G68, OpenGL ES 3.2)`, Moyen 16,59 puis 15,20 FPS proposent Faible ; Faible 17,53 puis 18,00 FPS confirment ce choix. Après calibration : tampon 216 × 399, ombres désactivées, 181 tuiles / 666 622 triangles / 362 commandes des bâtiments. Parcours P1 réussi sans erreur : quatre localités, retour, gestes, sélection, ombres et FPS. Au repos 7, 11, 11, 19, 25, 28 FPS ; commandes de rotation 24, 21, 25, 25, 24, 24 FPS. Cache/réseau non caractérisés, pas de garantie de cadence stable. L'A53 n'est plus nécessaire pour terminer ce changement et peut être débranché.

Revue visuelle des captures finales : [réglages et GPU bureau](images/qualite-presets-bureau.png), [A53 sélection réelle en Auto](images/a53-auto-selection.png). La capture bureau utilise Faible manuellement pour contrôler le preset, elle ne prouve pas un classement Auto Faible sur RTX. Les contours restent moins nets à résolution réduite. Comparaison historique : [ombres complètes A53](images/a53-ombres-completes.png), [sans ombres](images/a53-sans-ombres.png), [Faible](images/a53-qualite-faible.png). Les valeurs FPS sur captures sont ponctuelles ; les tableaux conservent les séries mesurées, les captures peuvent aussi suivre une nouvelle phase de chargement.

## Reprise de la Tab S8 chargée

Le 30 septembre, Chrome physique `154.0.8037.57`, Adreno 730, portrait 753 × 1 030 CSS px, DPR 2,125 ; batterie initiale 70 %, 26,6 °C, économie désactivée, thermique Android 0. Deux calibrations partielles de la version inchangée `index-D3hAlH4s.js` confirment Moyen : médianes 32,59/35,77 FPS puis 26,95/27,59 FPS. Parcours isolé de 16:14:05 Europe/Zurich : quatre localités et retour contrôlés, 31/25/27/28/25/32 FPS au repos et 28/25/25/27/27/26 avec boutons de rotation. Après Auto : tampon 564 × 773, sans ombres, bâtiments conservés, 243 tuiles / 861 080 triangles / 486 commandes. Date initiale P1 21 juin à 16:00, cadrage large ; comparer avec prudence aux presets centraux A53 à 12:00.

Coupure CDP lors de la capture, avant gestes/sélection ; test complet non réussi. Plusieurs reconnexions USB ont effacé les tunnels, même sans requêtes ADB parallèles. Aucun gain dû à la recharge n'est établi par une comparaison contrôlée et aucune panne applicative n'est démontrée. Alternative ADB Wi-Fi expirée, mode retiré et USB restauré ; preview privée directe sur port 4174 : propriétaire confirme fonctionnement et Auto Moyen à 45–49 FPS, environ 30 et fort moiré avec ombres. Lecture CDP courte à 16:29:51 : scène prête en portrait, ombres de nouveau désactivées, Personnalisé, tampon 564 × 773 et 58 FPS ponctuels ; capture interrompue. Cadrages/durées des retours non verrouillés, gestes/paysage non confirmés séparément. [Dates, méthode et limites](VALIDATION_P1.md#reprise-tab-s8-chargée--30-septembre-2026).

## Suite

Le propriétaire signale ensuite que la tablette revient régulièrement en USB « recharge uniquement ». Nouvel essai à 16:42:22 sans captures (`JURA3D_ANDROID_SCREENSHOTS=0`) également interrompu avant chargement : le transfert d'images n'est pas une cause établie. L'option reste disponible dans le probe, sans modification du rendu. Contrôles USB suspendus en attendant une liaison stable ; cause de la bascule de mode non vérifiée, pas de correction permanente des réglages Android.

Build et probe bureau réussis à **16:45:27 Europe/Zurich**, même bundle/empreinte, cinq réessais et interactions simulées sans régression. Dans cette session, RTX 4080 Laptop GPU : Élevé 30,17/32,41 FPS propose Moyen, Moyen 73,21/68,78 propose Élevé ; le retour vers un niveau déjà essayé termine en Moyen selon la règle prévue. Le résultat Élevé de 15:45 reste historique, pas une garantie matérielle. Écart de charge entre sessions non isolé ; le propriétaire confirme Élevé dans son onglet intégré. Revue des nouvelles captures bureau de sélection et paysage simulé réussie ; aucune nouvelle capture physique validée.

La [validation P1](VALIDATION_P1.md) identifie la dernière version compilée. Conserver les ombres désactivées en Moyen sur Tab S8, puis qualifier gestes/sélection, paysage, réseau, batterie et mémoire. Retrouver une liaison stable avant comparaison automatique des presets et campagne prolongée ; S23 indisponible. Un véritable LOD demanderait un jeu de tuiles préparé avec versions simplifiées de remplacement, identifiants et crédits préservés ; aucune conversion ni nouvel hébergement de données dans cet ajout. La précision des ombres reste un défaut distinct à traiter.

Retouche ergonomique du menu ouvert en paysage : build/probe réussis à 17:20:20, contenu JS inchangé, aucune optimisation ou comparaison de performances revendiquée. Renderer de cette dernière session bureau : Intel UHD Graphics ; les mesures RTX ci-dessus restent historiques et distinctes des essais Tab S8. Hauteur du menu contrôlée par simulation tactile bureau, à confirmer après rechargement sur tablette.
