# Publication de la présentation Jura

## Autorisation et portée — 30 octobre 2026

Après revue de la version locale et de sa réserve réseau Bâle, le propriétaire demande explicitement l’envoi sur GitHub pour disposer d’une adresse externe. Cette instruction autorise la sauvegarde Git, le push et la publication de la version préparée, puis les contrôles HTTPS et le bilan documentaire. Aucun message au canton ou appareil autorisé.

Publier la finition du30octobre avec C1 et la préparation du29octobre : page statique `presentation/`, entrée Jura `?presentation=1`, fonctions et sources existantes, C1 limité à Delémont. Ancienne version publique `573e55c`, base locale/distance vérifiée `5f146b1`, main identique au début de l’opération. Ne pas remplacer le modèle ou contourner les erreurs HTTP2 Bâle.

Adresse cible : [présentation Jura](https://jackseg80.github.io/jura3d/presentation/). La disponibilité sera confirmée après le déploiement et le parcours public.

## Contrôles requis

Conserver la copie et les preuves locales `.vite/presentation-polish-2026-10-30/`. Vérifier les fichiers testés, la revue Git et l’absence de ressources ignorées/secrets dans le commit. Push non forcé, attendre le workflow Build, puis déclencher `pages.yml` manuellement et attendre build/deploy. Vérifier le même SHA dans les marqueurs accueil/Jura/Bâle et les ressources de la présentation ; aucune réussite CI ou HTTP200 seule ne prouve le parcours.

Le contrôle public ciblé utilise `JURA3D_PROBE_SCOPE=jura` avec `scripts/probe-presentation.mjs`. Son rapport déclare explicitement Bâle exclu. Le mode par défaut `all` continue de vérifier Bâle : ses deux échecs réseau du30octobre restent conservés, aucune validation globale de disponibilité Bâle déduite. Fonctions communes/C1 qualifiées au29octobre et comparaison intégrale des paquets conservées, aucun nouveau benchmark Android.

## État de l’opération

**Publication terminée et contrôlée le30octobre2026 à23:35:31 Europe/Zurich.** Révision applicative `55a6d610913c6ff6c2dcf1c5a44d0ffdfbf3d2b9`, envoyée sur main sans forcer. [Build41138726130](https://github.com/jackseg80/jura3d/actions/runs/41138726130) réussi ; [Pages41138849795](https://github.com/jackseg80/jura3d/actions/runs/41138849795), build et deploy réussis. [Ouvrir la présentation publique](https://jackseg80.github.io/jura3d/presentation/), [carte en mode découverte](https://jackseg80.github.io/jura3d/jura/?presentation=1).

Trois marqueurs accueil/Jura/Bâle servent ce même SHA, source `github-actions`. Dix-huit ressources contrôlées : pages et CSS statiques identiques aux blobs Git du commit avec substitution de base ; JPEG identique ; quatre assets applicatifs et licences Cesium identiques à la copie compilée testée ; sept ressources de données/conditions Jura identiques aux blobs Git. Le déploiement ne met pas à jour les instantanés cantonaux.

Parcours HTTPS Chrome156.0.8078.75 Windows, sans interception : `scope:jura`, Bâle explicitement exclu. Quatre groupes réussis, zéro erreur et zéro échec réseau : page/clavier/image/conditions sans appel externe initial ; Saint-Marcel/PDF, bus/liens, Porrentruy, crédits et retour ; présentation et carte320/390/722px en portrait/paysage simulés ; entrée Jura normale et ses réglages préservés. Captures examinées. Aucune disponibilité actuelle Bâle ou qualification Android physique déduite ; les échecs HTTP2 locaux Bâle restent conservés, sans contournement. C1 reste facultatif au centre de Delémont ; application Android non livrée.

Preuves locales ignorées sous `.vite/publication-presentation-2026-10-30/` : `release-sha.txt`, `release-files.json`, `staged-files.json`, `local-probe/`, `ci-run.json`, `pages-run.json`, `served-check.json`, `public-probe/`, `final-check.json`. [Capture publique](images/presentation-publique-2026-10-30.png). Copies C1 et présentation29/30octobre préservées. Le bilan documentaire peut être sauvegardé dans un commit ultérieur sans republier les assets : le SHA du dépôt peut alors dépasser celui du site.

Prochaine action : partager le lien de la présentation par le propriétaire et recueillir un premier retour sur l’utilité complémentaire au GéoPortail. Aucun message au canton envoyé, aucun appareil utilisé ou nouvelle ville ajoutée.
