# Déploiement Hostinger Cloud

Le projet utilise l'hébergement Cloud managé de Hostinger avec son support natif des applications Node.js. Aucun VPS et aucun conteneur Docker ne sont nécessaires.

## Connexion initiale dans hPanel

1. Ouvrir **Websites → Add website → Node.js Web App**.
2. Choisir **Import Git Repository** puis autoriser GitHub.
3. Sélectionner `kardahmed/benzamia-promotion-web`.
4. Sélectionner la branche `main`.
5. Utiliser le preset Next.js.
6. Utiliser Node.js 24, conformément à `package.json`.
7. Définir la commande de build sur `npm run build`.
8. Définir la commande de démarrage sur `npm run start`.
9. Ajouter les variables listées dans [SECRETS.md](SECRETS.md).
10. Activer le déploiement automatique depuis `main`.

## CI/CD

- **CI** : GitHub Actions valide chaque pull request.
- **CD** : après fusion, l'intégration GitHub de Hostinger récupère `main`, installe les dépendances, construit et redémarre l'application.
- **Protection** : la branche `main` doit exiger la réussite du workflow CI avant fusion.
- **Retour arrière** : revenir sur le commit fautif dans GitHub ; Hostinger redéploie ensuite automatiquement l'état corrigé.

## Domaine et email

- Relier `benzamiapromotion.com` à l'application dans hPanel.
- Activer le SSL géré par Hostinger.
- Configurer les boîtes professionnelles sur le domaine.
- Utiliser le SMTP Hostinger pour les messages du formulaire et les confirmations de visite.
- Retirer toute dépendance à l'ancienne boîte `zinelkelma.houari@gmail.com`.

## Éléments volontairement absents

- Pas de VPS
- Pas de Dockerfile
- Pas de Docker Compose
- Pas de Caddy
- Pas de GHCR
- Pas de secrets SSH de déploiement
