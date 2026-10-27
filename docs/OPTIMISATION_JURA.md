# Complément P6 — Étendre le rendu en tuiles aux tracés du Jura

27 octobre 2026. Après un retour PC positif sur Bâle, le propriétaire demande si la méthode doit aussi bénéficier au Jura. **Extension inscrite au plan, non implémentée à ce stade.** Le Jura utilise encore les polylignes terrain P6 ; Bâle utilise le fond en tuiles depuis `2c8c6b2`. Les validations P5/P6/P7 restent attachées à leurs versions et à leurs réserves.

## Périmètre

Réutiliser le fournisseur de tuiles locales et la recherche de tracés créés pour Bâle, en rendant le choix de renderer indépendant du schéma de données. Conserver les données et la simplification1m/découpe5,25km P6, toutes les identités/fiches/liens, les arrêts et leurs groupes, les filtres jour/nuit, les styles et les zones Noctambus. Les polygones Noctambus restent une couche distincte du fond des lignes ; ne pas les convertir implicitement en tracés. Garder la surbrillance et la priorité des objets au premier plan.

Il s'agit d'un complément du rendu des bus. Patrimoine, bâtiments, destinations, conditions d'usage et couverture ne changent pas par ce lot. Les gains observés à Bâle ne préjugent pas de ceux du Jura, dont le réseau est moins dense dans les vues mesurées.

## Vérifications et sortie

- Comparer avant/après sur PC Intel et RTX, à preset, dimensions et cadrage égaux, sur les quatre localités ; réseau coupé, lignes et ensemble, avec rotation et références répétées. Conserver FPS/temps GPU/pauses et limites sans promettre de gain uniforme.
- Vérifier filtres jour/nuit et secteur/réseau entier, arrêts/groupes, vrais clics sur les tracés superposés, choix de fiche, surbrillance/fermeture et liens. Vérifier aussi les zones Noctambus, la coexistence avec le patrimoine et les erreurs/réessais/destruction.
- Exécuter les tests concernés, les builds et le probe complet ; contrôler les deux territoires pour préserver Bâle. Ne pas remplacer une preuve physique par une simulation tactile PC.
- Qualifier ensuite l'A53 en Faible pour Bâle et Jura lorsqu'il sera disponible, en conservant les préférences et en nettoyant les seuls accès créés. B1 Bâle reste ouvert pour cette qualification ; B2/B3 restent différés.

**Prochaine action sans appareil :** préparer cette adaptation puis la comparaison PC. Aucun changement de code, nouvelle mesure ou publication réalisé par la présente mise à jour du plan. Aucun nouveau build/probe nécessaire tant que les sources restent inchangées. Modèle/effort conservés, aucun sous-agent ; sauvegarde locale autorisée, aucun push/déploiement.
