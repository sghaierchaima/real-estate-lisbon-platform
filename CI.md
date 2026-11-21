# Vérification du backend avec Jenkins

Le pipeline real-estate-backend-ci réalise :
- la récupération du code depuis GitHub ;
- l’installation des dépendances du backend ;
- la compilation du backend NestJS ;
- l’exécution des tests Jest avec mesure de couverture ;
- l’archivage des résultats.

Jenkins vérifie les changements de la branche main
toutes les cinq minutes lorsqu’il est démarré.