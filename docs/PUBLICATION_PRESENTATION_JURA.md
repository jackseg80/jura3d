# Publication de la présentation Jura

## Autorisation et portée — 30 octobre 2026

Après revue de la version locale et de sa réserve réseau Bâle, le propriétaire demande explicitement l’envoi sur GitHub pour disposer d’une adresse externe. Cette instruction autorise la sauvegarde Git, le push et la publication de la version préparée, puis les contrôles HTTPS et le bilan documentaire. Aucun message au canton ou appareil autorisé.

Publier la finition du30octobre avec C1 et la préparation du29octobre : page statique `presentation/`, entrée Jura `?presentation=1`, fonctions et sources existantes, C1 limité à Delémont. Ancienne version publique `573e55c`, base locale/distance vérifiée `5f146b1`, main identique au début de l’opération. Ne pas remplacer le modèle ou contourner les erreurs HTTP2 Bâle.

Adresse cible : [présentation Jura](https://jackseg80.github.io/jura3d/presentation/). La disponibilité sera confirmée après le déploiement et le parcours public.

## Contrôles requis

Conserver la copie et les preuves locales `.vite/presentation-polish-2026-10-30/`. Vérifier les fichiers testés, la revue Git et l’absence de ressources ignorées/secrets dans le commit. Push non forcé, attendre le workflow Build, puis déclencher `pages.yml` manuellement et attendre build/deploy. Vérifier le même SHA dans les marqueurs accueil/Jura/Bâle et les ressources de la présentation ; aucune réussite CI ou HTTP200 seule ne prouve le parcours.

Le contrôle public ciblé utilise `JURA3D_PROBE_SCOPE=jura` avec `scripts/probe-presentation.mjs`. Son rapport déclare explicitement Bâle exclu. Le mode par défaut `all` continue de vérifier Bâle : ses deux échecs réseau du30octobre restent conservés, aucune validation globale de disponibilité Bâle déduite. Fonctions communes/C1 qualifiées au29octobre et comparaison intégrale des paquets conservées, aucun nouveau benchmark Android.

## État de l’opération

Publication autorisée, en préparation. Preuves à conserver sous `.vite/publication-presentation-2026-10-30/` : révision envoyée, résultats CI/Pages, marqueurs et ressources servis, rapport HTTPS, bilan final. Ne déclarer la publication terminée qu’après ces vérifications. Une sauvegarde documentaire du bilan peut suivre sans republier les assets applicatifs.
