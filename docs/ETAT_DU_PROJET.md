# État du projet

**Dernière vérification : 29 septembre 2026.** Ce document est le point d'entrée pour reprendre le travail dans une nouvelle discussion.

**Dépôt officiel :** [jackseg80/jura3d](https://github.com/jackseg80/jura3d), public, branche `main`, code du projet sous licence MIT. Le premier push et le contrôle de compilation GitHub Actions ont réussi le 29 septembre 2026.

## Objectif connu

Construire à terme un projet neuf pour le **canton du Jura suisse**, en s'inspirant des briques utiles de SunTrail 3D sans reprendre son application entière. Le propriétaire souhaite discuter ensuite du concept du jeu et d'un plan. Aucune mécanique de jeu ou feuille de route n'est encore approuvée.

## État actuellement vérifié

- Application Vite/CesiumJS utilisable autour de Delémont.
- Terrain swisstopo quantized mesh, bâtiments swisstopo 3D Tiles, fond aérien ou topographique swisstopo.
- Éclairage et ombres liés à l'heure choisie, curseur de 00:00 à 23:59, bâtiments masquables.
- Rotation/inclinaison au clic droit glissé et zoom à la molette.
- `npm run build` et `npm run probe` réussis sur Windows dans Chrome sans interface. Le contrôle a observé des réponses des trois services et des tuiles aériennes de niveaux 1 à 20, sans erreur signalée. Il a vérifié l'heure de minuit et midi, les gestes de caméra et un affichage en fenêtre étroite.

## Limites connues

- La caméra démarre près de Delémont ; aucune limite géographique au canton, navigation ou contenu de jeu n'existe encore.
- Le prototype dépend d'une connexion et des limites de fair use des services swisstopo. Aucun mode hors ligne, cache propre au projet ou mesure de trafic à grande échelle.
- La fluidité, la batterie et la mémoire n'ont pas été mesurées sur un téléphone réel. Un affichage étroit dans Chrome ne remplace pas ce test.
- Les ombres déjà présentes dans la photographie aérienne sont fixes. La précision des ombres simulées de chaque bâtiment n'a pas été qualifiée.
- La date saisie est interprétée dans le fuseau horaire du navigateur ; le projet ne force pas encore `Europe/Zurich`.
- Le niveau 19 du fond topographique existe dans les capacités du service, mais une tuile vérifiée à Delémont était vide ; la limite du prototype reste 18.
- `npm run probe` suppose Chrome dans `C:\Program Files\Google\Chrome\Application\chrome.exe`.

## Points à discuter avec le propriétaire

- Quel est le but précis du jeu et quelles interactions seront prioritaires ?
- Quelle zone du canton doit être couverte en premier et quel niveau de détail est nécessaire ?
- Quelles contraintes de téléphone, réseau, mode hors ligne et nombre d'utilisateurs faut-il viser ?
- Faut-il conserver CesiumJS pour l'application finale après des essais de performance et d'ergonomie ?
- Quelles autres données publiques pourraient être utiles et comment les attribuer ?

Ces questions servent à préparer la discussion. Elles ne sont pas un plan de réalisation validé.

## Reprise pratique

1. Lire `README.md`, `docs/ARCHITECTURE.md`, `docs/DONNEES.md` et `docs/DECISIONS.md`.
2. Vérifier l'état Git et les versions locales avant de changer le code.
3. Démarrer avec `npm ci`, `npm run dev`, puis `npm run build` ; lancer `npm run probe` si Chrome Windows et le réseau sont disponibles.
4. Après chaque changement, mettre à jour cet état, les documents concernés et `CHANGELOG.md` selon `AGENTS.md`.
