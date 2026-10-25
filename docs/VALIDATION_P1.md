# Validation P1 et premier essai téléphone

Ce document conserve les preuves historiques P1. La version courante et le nouveau probe complet P1 + patrimoine sont décrits dans [VALIDATION_P3.md](VALIDATION_P3.md) ; les anciens résultats physiques ne qualifient pas la couche P3.

**30 septembre 2026 — P1, FPS et panneau compact vérifiés sur bureau ; parcours tactile injecté et comparaison FPS réussis sur A53 physique. Tab S8 chargée : Auto, quatre destinations, retour et FPS contrôlés à 16:14 Europe/Zurich, suite interrompue par liaison USB ; fonctionnement général et FPS confirmés manuellement via Wi-Fi. S23 indisponible.** La validation mobile complète reste ouverte. Aucun patrimoine, bus, autre ville, commit, push ou déploiement dans ce lot.

## Version et méthode bureau

- Dépôt principal `D:\Python\Jura3D`, branche `main`, commit de base `57eb361` avec changements locaux préexistants préservés. Il n'existe pas de commit P1.
- Windows, Node.js `22.22.3`, npm `11.16.0`, CesiumJS `1.145.0`, Chrome `154.0.8037.92` sans interface, Playwright.
- `npm run build` réussi ; version compilée du contrôle bureau sur `http://127.0.0.1:4173/`, cible de `JURA3D_URL` pour `npm run probe`. Instance Wi-Fi privée tablette séparée sur `http://192.168.1.184:4174/`, servant le même `dist/`.
- Dernier probe bureau achevé le 30 septembre à **17:20:20 Europe/Zurich** (`2026-09-30T15:20:20.650Z`), après correction de la hauteur du menu ouvert en paysage tactile. Services swisstopo réels pour le parcours normal ; pannes HTTP 503 injectées uniquement dans des pages de test distinctes, puis supprimées avant réessai.
- Bundle JS `index-CiVAcsIl.js` : 4 185,06 kB, 1 132,91 kB gzip ; CSS `index-CYlPrV01.css` : 28,17 kB. Le contenu JS garde son empreinte, seul le style produit est modifié. Avertissement Vite de chunk supérieur à 500 kB, compilation réussie ; taille du bundle distincte de la charge de rendu.
- SHA256 de `dist/index.html` : `07BFA11BD0E42A443789F7D75F4FBCB6E36C4656ADD02FDBC56C5BF39B6359FD`.
- SHA256 du JS ci-dessus : `3780A7C4CACB6445F486F4D7EFA7DF2782AB0B77FFA2D2DA173A78E66A799404`.
- SHA256 du CSS : `632CEA8324718DB228AD081FD42A02466E645B03BC1EF7E17D4BA11D48DFEAA7`.

Le rapport complet de la dernière exécution est `probe-p1-report.json` (ignoré par Git, comme les captures temporaires). Une nouvelle compilation ou un changement de code impose de relever à nouveau la version utilisée pour les essais téléphone.

Contrôle documentaire final le 30 septembre : dix documents concernés, aucun lien local cassé ni espace de fin de ligne ; `git diff --check` réussi. Dépôt, branche et commit de base inchangés, index Git vide ; fichiers générés bien ignorés. Les modifications préexistantes d'AGENTS, documents d'étude et captures d'audit/ombres sont conservées.

## Résultats contrôlés

| Contrôle | Résultat bureau |
| --- | --- |
| Données du parcours normal | 829 réponses fond, 1 630 terrain, 781 bâtiments ; 0 erreur HTTP/réseau/JavaScript signalée. Ces comptages décrivent les réponses, pas le nombre d'objets ou le volume transféré. |
| Navigation | Quatre destinations atteintes, un seul bouton actif, caméra proche du repère attendu et tuiles de la vue chargées. Deux demandes rapprochées conservent la dernière destination. |
| Retour initial | Longitude, latitude, hauteur, cap et inclinaison retrouvent le cadrage initial de Delémont. |
| Régression caméra et réglages | Clic droit rotation/inclinaison, molette, heure 00:00/12:00, bâtiments masquables et fonds aérien/topographique contrôlés ; plafonds configurés 20/18 conservés, requêtes jusqu'à 17 observées dans cette session (20 dans les précédentes). Ombres complètes et réglages préexistants conservés. |
| Sélection | Clic sur un bâtiment réel, fiche comparée aux propriétés de source ; `NAME_KOMPLETT` vide, EGID `190182609`, titre « Bâtiment 3D ». Masquage des bâtiments efface la sélection ; point de terrain sans identité, fermeture contrôlée. |
| Toucher simulé | Contexte Chrome `hasTouch`/mobile, 390 × 844 puis 844 × 390, facteur de pixels 1. Boutons, glissement à un doigt, pincement à deux doigts, réglages et sélection par toucher. 19 cibles contrôlées à 44 px de hauteur, sans débordement horizontal ; crédit dans la fenêtre. Panneau entier compact au départ, ouverture/fermeture et ombres par toucher contrôlées. |
| Compteur FPS | Valeur numérique positive, masquage/rétablissement contrôlés ; aucun recouvrement du panneau en fenêtre étroite et du bouton en paysage. Lecture ponctuelle 29 FPS durant le probe, sans valeur de benchmark. |
| Presets et Auto | Quatre presets : dimensions du tampon, MSAA, ombres et bâtiments conservés contrôlés. Choix manuel mémorisé après rechargement ; case d'ombres annule Auto. Absence de focus simulée : aucune médiane retenue. Renderer effectif de cette session PC : Intel UHD Graphics. Moyen 72,83/72,34 FPS propose Élevé ; Élevé 12,79/12,33 propose Moyen ; règle anti-oscillation retient Moyen. Sessions RTX précédentes documentées dans le diagnostic, changement de renderer non investigué. Choix selon performance de scène, pas niveau matériel garanti. Résultats PC distincts de la Tab S8 Adreno 730. L'onglet intégré PC reste non inspecté, propriétaire y confirme Élevé. |
| Menu ouvert en paysage tactile | Téléphone simulé 844 × 390 : largeur 320 px, hauteur 342 px, bas à 350 px ; tablette simulée 1 205 × 600 : largeur 320 px, hauteur 552 px, bas à 560 px. Contenu défilant : 182/920 px sur téléphone et 392/920 px sur tablette. Bouton Replier de 44 px, crédits visibles, aucun recouvrement FPS. Fermeture rétablit le panneau compact. Racine bâtiments en panne : menu ouvert jusqu'au bas utile, message/réessai accessibles, récupération réussie. |
| Erreur et réessai | Racine terrain, tuile terrain, racine bâtiments, tuile bâtiments, tuile imagerie : 5/5 états d'erreur puis réessais réussis sur les données réelles. État, bouton de réessai et crédit dans la fenêtre. |
| Revue visuelle | Les quatre localités montrent le relief et le bâti ; sélection sans nom inventé, panneau portrait/paysage, réglages défilables et erreur lisibles. L'état, le réessai et le crédit restent hors du contenu défilant. |

Référence de chargement de **cette seule session bureau**, délai entre démarrage/navigation et état « prêt », animation comprise (1,2 s pour une destination). Le cache de cette session est partiellement réutilisé ; le réseau n'a pas été caractérisé. Ce n'est ni un benchmark froid comparable ni une prédiction téléphone.

| Scénario | Temps |
| --- | ---: |
| Chargement initial bureau, date par défaut 21 juin 2026 à 16:00 | 8,737 s |
| Bouton Delémont, parcours après passage à 12:00 | 1,648 s |
| Bouton Porrentruy | 3,119 s |
| Bouton Saignelégier | 2,476 s |
| Bouton Saint-Ursanne | 1,832 s |
| Chargement initial du contexte tactile simulé | 9,547 s |

## Captures conservées

Les captures proviennent de Chrome de bureau, y compris celles au format téléphone. Les captures d'erreur représentent une panne volontaire au démarrage ; elles ne qualifient pas le rendu de la scène pendant une panne réelle prolongée.

| Localité | Vue P1 |
| --- | --- |
| Delémont | [Capture](images/p1-delemont.png) |
| Porrentruy | [Capture](images/p1-porrentruy.png) |
| Saignelégier | [Capture](images/p1-saignelegier.png) |
| Saint-Ursanne | [Capture](images/p1-saint-ursanne.png) |

| Sélection | Portrait simulé | Paysage simulé | Erreur injectée |
| --- | --- | --- | --- |
| [Capture](images/p1-selection.png) | [Capture](images/p1-touch-portrait.png) | [Capture](images/p1-touch-landscape.png) | [Capture](images/p1-error.png) |

Panneau compact : [portrait simulé](images/p1-touch-collapsed.png), [A53 physique](images/p1-a53-collapsed.png). Cette dernière capture est distincte des captures de bureau ci-dessus.

Menu ouvert en paysage : [téléphone simulé](images/p1-touch-landscape.png), [tablette simulée](images/p1-touch-tablet-landscape.png), [erreur paysage simulée](images/p1-error.png). Captures de bureau, pas de nouvelles captures physiques Tab S8.

Réglages après correction : [GPU et preset manuel sur bureau](images/qualite-presets-bureau.png). Cette capture Faible est un choix manuel du probe ; elle ne représente pas le résultat Auto Élevé.

## Essais physiques et suite de validation

### Galaxy A53 — 30 septembre 2026

**Dernier contrôle après correction Auto**, commencé à **15:42:39 Europe/Zurich** (`2026-09-30T13:42:39.376Z`), bundle `index-D3hAlH4s.js` : parcours réussi, aucune erreur relevée. GPU effectif Mali-G68 ; médianes Moyen 16,59 et 15,20 FPS proposent Faible, puis Faible 17,53 et 18,00 confirment ce niveau. Tampon après choix 216 × 399, ombres désactivées, bâtiments conservés. Initialisation 29,318 s ; quatre destinations 3,942 / 9,636 / 4,735 / 3,304 s. Repos 7, 11, 11, 19, 25, 28 FPS ; commandes de rotation 24, 21, 25, 25, 24, 24 FPS. Navigation, retour exact, zoom/inclinaison, glissement/pincement, sélection réelle EGID `973767`, ombres et FPS contrôlés par événements tactiles CDP sur appareil physique. [Capture réelle après correction](images/a53-auto-selection.png). Le gain varie selon la scène et ne garantit pas 30 FPS stables ; [comparaisons et limites](DIAGNOSTIC_PERFORMANCE.md).

Les relevés suivants précèdent les presets et restent une référence historique, pas la cadence du profil Auto actuel.

Appareil connecté `SM-A536B`, Android 16, Chrome `153.0.8010.53`, GPU exposé `ANGLE (ARM, Mali-G68, OpenGL ES 3.2)`. Écran physique 1 080 × 2 400 ; viewport Chrome réel 360 × 666 CSS px, DPR 3, portrait, cinq points tactiles. **Tampon de rendu Cesium relevé : 360 × 666**, identique à la taille CSS malgré DPR 3. La baisse ne peut donc pas être attribuée ici à un rendu 1 080 × 1 998. Avant ces essais : batterie 67 %, USB en charge, 27,4 °C ; `low_power=0`, état thermique Android 0. Ces relevés initiaux ne garantissent pas la température durant tout le parcours.

Version testée `index-CF3hcnHT.js`/`index-BKj7UVKI.css`, même preview et tunnel USB que ci-dessous ; cache non purgé. Événements tactiles CDP injectés dans Chrome **sur appareil physique**, sans émulateur ni changement de viewport, réglages Android ou orientation.

Comparaison FPS commencée à **14:31:12 Europe/Zurich** (`2026-09-30T12:31:12.987Z`) : Delémont, même caméra, fond aérien, 21 juin à 12:00 local, ombres inchangées. Quatre lectures espacées de 1,1 s par état, tableau brut conservant les valeurs transitoires :

| Bâtiments actifs | Masqués | Rétablis |
| --- | --- | --- |
| 7, 5, 7, 7 FPS | 9, 46, 44, 47 FPS | 22, 7, 7, 5 FPS |

Comparaison réussie, aucune erreur HTTP/page/console relevée. Initialisation 27,446 s dans cette session. Les premières lectures après bascule peuvent inclure la transition/fenêtre de mesure ; les valeurs suivantes confirment une forte charge liée aux bâtiments visibles. Cela ne distingue pas géométrie, nombre de commandes de dessin et ombres. Le propriétaire rapporte séparément 4–8 FPS avec bâtiments et plus de 50 sans ; son observation ne partage pas ce protocole verrouillé.

Parcours P1 commencé à **14:33:56 Europe/Zurich** (`2026-09-30T12:33:56.147Z`), réussi sans erreur relevée : ouverture du panneau compact, quatre destinations, retour exact initial, zoom/inclinaison, glissement/pincement, sélection réelle et interrupteur FPS. Initialisation 26,095 s ; destinations Delémont 4,020 s, Porrentruy 12,556 s, Saignelégier 7,738 s, Saint-Ursanne 3,632 s. Lectures au repos 7 FPS six fois ; avec commandes de rotation 7, 9, 6, 6, 7, 6 FPS. Fiche sélectionnée « Bâtiment 3D », EGID source `973767`, sans nom/adresse fournis ; [capture réelle](images/p1-a53-selection.png). Les commandes fonctionnent, mais la fluidité est insuffisante dans ces vues.

Deux tentatives préalables ont échoué dans le script de test (vérification trop rapide de la bascule, puis saisie de date dans les réglages fermés). Elles ne prouvent pas une panne de l'application ; le script a été corrigé et les deux parcours ci-dessus terminés. Captures compactes et sélection revues visuellement. Paysage, panne/réessai physique, usage humain prolongé, mémoire et consommation non contrôlés ; P1 mobile reste ouvert.

### Premier essai réel Galaxy Tab S8 — 30 septembre 2026

Le S23 étant indisponible, le propriétaire propose sa Tab S8 et indique d'abord que l'application « tourne pas mal », puis constate un rendu plus lent avec les bâtiments. Modèle connecté `SM-X706B`, Android 16, Chrome `153.0.8010.53`, écran physique 1 600 × 2 560. Chrome a exposé une fenêtre réelle 753 × 1 030 CSS px, DPR 2,125, orientation portrait et cinq points tactiles. Le DPR ne prouve pas la taille du tampon de rendu, qui n'a pas été relevée.

Accès local par USB : `adb reverse tcp:4175 tcp:4173` permet à la tablette de lire le preview bureau sur `http://127.0.0.1:4175/`. CDP est relié temporairement par `adb forward tcp:9228 localabstract:chrome_devtools_remote`. Aucun accès LAN, règle de pare-feu ou installation d'application. [Méthode ADB officielle](https://developer.android.com/develop/ui/views/layout/webapps/access-local-server).

Parcours automatisé sur **Chrome de la tablette physique**, sans émulation ni redimensionnement : scène chargée, quatre destinations par événements tactiles injectés, retour caméra initial vérifié. Version JS `index-Jkzs6V10.js`. Cache non purgé, chargement initial 6,773 s ; Delémont 2,530 s, Porrentruy 4,514 s, Saignelégier 2,678 s, Saint-Ursanne 2,098 s. Ce relevé court ne caractérise pas les performances de l'appareil.

La liaison USB/CDP s'est interrompue avant la fin du parcours et des relevés FPS ; les redirections disparaissaient lors des reconnexions. Le script `scripts/probe-android.mjs` préserve un résultat partiel ou un échec dans `probe-android-report.json` (ignoré par Git). Le premier résultat partiel a été préservé temporairement avant la deuxième tentative. Aucune erreur de page ou HTTP relevée avant la coupure ; ce n'est pas une validation complète ni une preuve d'absence d'erreur sur toute une session. Le mode `JURA3D_ANDROID_MODE=fps` compare bâtiments actifs/masqués/rétablis au même cadrage, mais cette comparaison automatisée n'a pas abouti.

**Observations manuelles communiquées par le propriétaire, avec le nouveau compteur :**

| Contexte | FPS observés |
| --- | --- |
| Navigateur bureau, bâtiments actifs | Environ 50–120 |
| Tab S8, bâtiments actifs | Environ 18–30 |
| Tab S8, bâtiments masqués | Environ 40–60 |

Ces plages sont des observations utilisateur, sans durée, cadrage, état de cache ou protocole verrouillés. Elles orientent vers un coût lié à l'affichage des bâtiments et/ou à leurs ombres ; elles ne séparent pas la géométrie, les passes d'ombres, le CPU, le GPU ou le chargement. Prochain diagnostic borné : même vue et heure, bâtiments visibles, ombres désactivées puis rétablies ; relever aussi le tampon de rendu. Ne pas attribuer la baisse à la puissance de la tablette ou décider d'un moteur sur ce seul retour.

Le propriétaire a ensuite signalé une batterie Tab S8 à 17–18 %, l'a débranchée pour recharge et a différé ses essais. Aucune limitation de puissance liée à cette batterie n'a été démontrée ; refaire les mêmes vues après recharge en relevant économie d'énergie et température. Les relevés A53 ci-dessus sont distincts.

### Reprise Tab S8 chargée — 30 septembre 2026

Version inchangée `index-D3hAlH4s.js`/`index-BKj7UVKI.css`, mêmes empreintes que le dernier build/probe bureau. Dépôt `main`, base `57eb361`, changements locaux préservés. Aucun code ni réglage de rendu modifié pour cette reprise. Chrome tablette désormais `154.0.8037.57`, Android 16, Adreno 730 ; viewport réel portrait 753 × 1 030 CSS px, DPR 2,125. Batterie initiale 70 %, USB en charge, 26,6 °C ; économie d'énergie 0 et état thermique Android 0. Plus tard 68 %, 28,3 °C et thermique 0 : relevés ponctuels, pas preuve d'absence de bridage durant toute la session ni explication du premier essai à batterie faible.

Trois tentatives à 16:07:58, 16:09:07 et 16:10:28 Europe/Zurich ont perdu le canal CDP avant une scène prête. À 16:12:00 (`2026-09-30T14:12:00.929Z`), la scène charge en 9,392 s : Auto confirme Moyen après médianes 32,59/35,77 FPS, puis coupure avant les destinations. Malgré changement de liaison confirmé par le propriétaire, les tunnels disparaissent et le numéro de transport ADB change. Ce sont des échecs de contrôle, pas des erreurs HTTP/JavaScript établies de l'application ; l'origine matérielle/logicielle des coupures reste inconnue.

Parcours isolé commencé à **16:14:05 Europe/Zurich** (`2026-09-30T14:14:05.151Z`), sans autre commande ADB pendant ce parcours : scène prête en 10,280 s, Auto Moyen confirmé après médianes 26,95/27,59 FPS. Après Auto : résolution 0,75, MSAA 1, ombres désactivées, tampon 564 × 773 ; bâtiments conservés, 243 tuiles / 861 080 triangles / 486 commandes de leur passe principale. Ces compteurs ne comprennent ni terrain ni répétitions des ombres.

| Contrôle réel avant coupure | Résultat |
| --- | --- |
| Quatre boutons de destination par toucher CDP | Delémont 3,220 s ; Porrentruy 5,427 s ; Saignelégier 3,582 s ; Saint-Ursanne 2,417 s |
| Retour initial | Caméra initiale retrouvée, longitude/latitude/hauteur/cap/inclinaison contrôlés |
| FPS au repos après retour | 31, 25, 27, 28, 25, 32 |
| FPS avec boutons de rotation | 28, 25, 25, 27, 27, 26 |
| Erreurs relevées avant coupure | Aucune HTTP/page/console ; portée limitée à ce parcours partiel |

Échec lors de la capture (`Target page, context or browser has been closed`), avant zoom/inclinaison, gestes et sélection. Le rapport complet est donc **non réussi** malgré les contrôles individuels ci-dessus. Une continuation courte à 16:22:14 ne retrouve pas la page de test. Rapports locaux préservés sous `.vite/device-reports/` (ignorés), aucun résultat fictif pour gestes, sélection, paysage, panne ou session prolongée. Cache non purgé, réseau non caractérisé et date initiale du parcours P1 21 juin 2026 à 16:00 ; les FPS ne sont pas directement comparables aux variantes centrales à 12:00 sur A53.

Alternative Wi-Fi : même réseau local confirmé par le propriétaire. Connexion ADB temporaire à la tablette sur 5555 expirée ; mode réseau retiré avec `adb usb`, propriété `service.adb.tcp.port` revenue à `0`, aucun VPN/pare-feu modifié. [Méthode ADB officielle](https://developer.android.com/tools/adb). Preview privée ouverte directement dans Chrome tablette à `http://192.168.1.184:4174/`, liée uniquement à l'interface Wi-Fi du PC, réponse HTTP 200 contrôlée depuis le PC. Aucune publication ; instance temporaire laissée pour l'essai utilisateur, à arrêter après usage.

**Retour manuel sur l'accès Wi-Fi :** le propriétaire confirme que cela fonctionne, Auto Moyen, environ **45–49 FPS**, puis environ **30 FPS avec les ombres** et « moiré terrible ». Ce retour général ne confirme pas séparément chaque geste ou l'orientation paysage ; durée, cadrage, état des tuiles et conditions des deux lectures non verrouillés. Il ne remplace pas la comparaison automatisée et ne prouve pas l'effet de la recharge.

Lecture CDP courte à **16:29:51 Europe/Zurich** (`2026-09-30T14:29:51.025Z`) sur cette page LAN : GPU Adreno 730, portrait 753 × 1 030, tampon 564 × 773, bâtiments actifs, scène prête, ombres désactivées et qualité Personnalisé après bascule manuelle. Lecture ponctuelle 58 FPS, distincte des plages utilisateur et sans valeur de benchmark. La capture échoue à nouveau par perte du canal ; aucune image de tablette finale n'est prétendue vérifiée. Le défaut d'ombres reste ouvert ; Moyen les désactive déjà par défaut.

**Nouvel essai sans captures à 16:42:22 Europe/Zurich** (`2026-09-30T14:42:22.985Z`), application via Wi-Fi et contrôle USB : `JURA3D_ANDROID_SCREENSHOTS=0`, rapport `screenshots:false`, mais perte du canal avant scène prête. Aucun contrôle supplémentaire de gestes/sélection validé. L'option est ajoutée au script pour les prochains essais ; cet échec avant capture ne permet pas d'attribuer les coupures au transfert d'images. Le propriétaire observe ensuite le retour répété du mode « Transfert de fichiers / Android Auto » vers « Recharge uniquement », nécessitant une bascule manuelle. Retour cohérent avec les transports/tunnels perdus, mais raison de la réinitialisation du mode non établie ; aucun réglage USB permanent modifié pour la corriger. Tests USB suspendus, preview Wi-Fi maintenue ; passage paysage et panne/réessai réels restent ouverts.

### Accès local à préparer au moment de l'essai

Le serveur bureau écoute `127.0.0.1` et n'est pas accessible au téléphone. Utiliser le même réseau privé sur le PC et les téléphones. Relever l'IPv4 de l'interface locale choisie, puis lancer une seconde instance de preview sur **cette adresse précise**, port 4174. Ces commandes sont préparées ; l'écoute sur le réseau privé n'a pas été lancée et aucune règle de pare-feu n'a été modifiée.

```powershell
Set-Location D:\Python\Jura3D
Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
  Select-Object InterfaceAlias, @{Name='IPv4';Expression={$_.IPv4Address.IPAddress}}

# Remplacer par l'adresse IPv4 locale relevée, sans utiliser 127.0.0.1.
$p1LanIp = 'ADRESSE_IPV4_DU_PC'
npm run preview -- --host $p1LanIp --port 4174 --strictPort
```

Ouvrir sur le téléphone `http://ADRESSE_IPV4_DU_PC:4174/` sans `?probe=1`. Si la connexion échoue, relever le message et diagnostiquer l'accès avant toute modification réseau. À la fin, arrêter cette instance par Ctrl+C. Il s'agit d'un accès privé temporaire, pas d'un hébergement public.

### Parcours identique sur les deux appareils

1. Noter modèle, version Android/Chrome, date/heure, réseau, orientation, cache et identification de la version compilée ci-dessus. Faire une première ouverture dans une nouvelle session Chrome privée, puis un second passage dans la même session (cache réutilisé) ; ne pas les confondre avec un cache système garanti froid.
2. Relever délai d'ouverture jusqu'à une scène utilisable puis à « Scène 3D prête. ». Régler 21 juin 2026 à 12:00, fond aérien et bâtiments actifs pour le parcours des localités.
3. Toucher Delémont → Porrentruy → Saignelégier → Saint-Ursanne ; relever chaque délai, interruptions, messages et destination active. Toucher deux destinations rapidement ; vérifier que la dernière est atteinte.
4. Glisser, pincer, utiliser zoom/rotation/inclinaison puis « Vue initiale ». Vérifier visibilité et lisibilité des commandes et du crédit, en portrait et paysage. Ouvrir les réglages, faire défiler leur contenu, changer fond/date/heure et masquer/rétablir les bâtiments.
5. Sélectionner un bâtiment, fermer la fiche, sélectionner un point de terrain avec bâtiments masqués. Vérifier qu'aucun nom/adresse n'est inventé et que navigation/masquage effacent la sélection.
6. Pendant une navigation vers une localité encore non chargée, couper temporairement l'accès réseau sur le téléphone, relever l'état, rétablir la connexion et toucher « Réessayer » si affiché. Des tuiles en cache peuvent empêcher une erreur : consigner ce cas, sans déclarer le test d'erreur réussi.
7. Refaire un parcours et noter pauses, gêne tactile ou chauffe observée sur quelques minutes. La campagne FPS/mémoire/batterie et les seuils proposés appartiennent à P5 ; ne pas les considérer validés par ce premier retour P1.

| Appareil | Version/navigateur/réseau/cache | Chargement initial et quatre destinations | Gestes, sélection, réglages, erreur/réessai | Retour et limites |
| --- | --- | --- | --- | --- |
| Galaxy A53 | Android 16 / Chrome 153 / USB, cache non purgé | 26,095 s puis 4,020 / 12,556 / 7,738 / 3,632 s | Toucher injecté réel : navigation, retour, zoom, glissement/pincement, sélection, FPS ; pas de panne physique ni paysage | Fonctionnel, environ 5–7 FPS avec bâtiments ; fluidité insuffisante, suite ouverte |
| Galaxy S23 | Non réalisé | Non réalisé | Non réalisé | En attente |
| Galaxy Tab S8 (comparaison supplémentaire) | Android 16 / Chrome 154 / USB puis Wi-Fi privé, chargée, cache non purgé | 10,280 s puis 3,220 / 5,427 / 3,582 / 2,417 s | Auto Moyen, quatre destinations, retour, rotation contrôlés ; suite automatique coupée avant gestes/sélection | 25–32 FPS automatisés au repos ; retour Wi-Fi 45–49 en Moyen, environ 30 et moiré avec ombres ; fonctionnement général confirmé, paysage non confirmé séparément |

## Limites et prochaine action

Les branches de chargement prolongé (30 s), sélection sans intersection terrain et échec initial de WebGL ne sont pas couvertes par une panne ciblée dans ce probe. Le nom non vide d'un bâtiment n'a pas été validé sur un échantillon réel ; les objets sélectionnés fournissent un nom vide. Crédit vu sur capture A53 ; réessai physique A53/S23 encore à faire. Les stries des toits sont liées à la réception des ombres dans les captures comparées ; désactiver les ombres est un contournement, sans correction de leur précision. Réduire la résolution accentue certains contours et aliasing. Couverture exhaustive, exactitude physique des ombres, campagne de performances/volume/batterie et données patrimoine/bus restent hors de cette preuve.

La [hiérarchie swisstopo de Delémont](DONNEES.md#hiérarchie-des-bâtiments-et-distance) a été inspectée : contenus à géométrie unique, raffinement `ADD`, pas de versions de remplacement simplifiées. Tuiles/triangles proches et lointains et variantes ombres/MSAA/résolution ont été relevés sur A53 ; seuils retirant des groupes rejetés. Les presets réduisent le coût du rendu sans produire de maillages simplifiés. [Diagnostic daté](DIAGNOSTIC_PERFORMANCE.md).

Le propriétaire confirme désormais Élevé dans le navigateur intégré, sans contrôle direct de son renderer. Le retour manuel suivant couvre le fonctionnement général en paysage et la récupération après Wi-Fi réactivé. La demande clarifiée porte sur la hauteur du menu ouvert. Prochaine action : confirmer ce menu sur Tab S8 après rechargement, garder les ombres désactivées en Moyen, puis qualifier la session prolongée et les cas d'erreur physique effectivement affichés. Aucune nouvelle série USB requise pour voir ce changement ; S23 encore indisponible. Un vrai LOD et la précision des ombres demandent un travail distinct. P1 reste développé, qualification mobile complète ouverte ; [relais](RELAIS.md) et [état](ETAT_DU_PROJET.md).

## Retour manuel suivant et correction paysage

Le propriétaire confirme que l'essai fonctionne : pendant la coupure Wi-Fi l'ancienne vue reste affichée, puis revient à la reconnexion. Récupération manuelle observée, sans preuve d'un message d'erreur ou d'un clic Réessayer ; les tuiles déjà chargées peuvent rester visibles hors réseau. Il précise ensuite que le menu **ouvert** s'arrête à mi-écran en paysage : la limite de 55dvh est remplacée par un ancrage bas au-dessus des crédits Cesium, avec contenu défilable et état/réessai/crédit hors défilement. L'interprétation initiale élargissant le bandeau replié a été retirée. La nouvelle hauteur n'est pas encore confirmée physiquement après rechargement.

Build/probe réussis à 17:20:20, revue visuelle du menu ouvert sur téléphone/tablette paysage simulés et erreur paysage réussie. Preview Wi-Fi privée port 4174 contrôlée depuis le PC : sert bien le nouveau JS/CSS. Recharger la page existante suffit pour l'essai physique ; aucune comparaison de performances ou correction d'ombres revendiquée par ce changement de style.
