# BENZAMIA Promotion — plateforme web

Refonte complète de [benzamiapromotion.com](https://benzamiapromotion.com/) avec une architecture volontairement simple : **un dépôt GitHub, un projet Supabase avec une seule base PostgreSQL, et un hébergement Hostinger Cloud**.

## Architecture retenue

- **GitHub** : le dépôt unique `kardahmed/benzamia-promotion-web`, les branches, pull requests, revues, CI et Codespaces.
- **Supabase** : un seul projet `benzamia-promotion` et une seule base PostgreSQL pour Auth, Storage, API, Queues, Cron et Edge Functions.
- **Hostinger Cloud** : application Next.js gérée, déploiement automatique depuis la branche `main`, domaine, SSL, CDN et email professionnel.
- **Google, Meta et IMMO PRO-X** : intégrations externes au produit, pas fournisseurs d'infrastructure.

Il n'y a pas de second dépôt, pas de seconde base Supabase, pas de VPS, pas de Docker, pas de Caddy et pas de registre d'images GHCR.

## Objectifs

- Présenter les programmes, leurs statuts, typologies, surfaces, plans et équipements.
- Filtrer les projets : tous, nouveau projet, en construction et terminé.
- Proposer des visites virtuelles 360° et la réservation de visites physiques.
- Synchroniser les demandes avec IMMO PRO-X et distribuer les prospects aux conseillers.
- Fiabiliser les emails, Google Analytics, Google Ads et Meta.
- Renforcer le SEO local et la visibilité dans les moteurs de réponse.
- Publier des guides « Investir à Chlef » et des actualités.

## Développement et livraison cloud uniquement

1. Chaque évolution part d'une branche du dépôt unique.
2. Une pull request déclenche lint, typage, tests et build dans GitHub Actions.
3. La branche `main` n'accepte que du code validé par la CI.
4. Hostinger Cloud est connecté à `main` dans hPanel et redéploie automatiquement après fusion.
5. Les migrations versionnées sont appliquées au projet Supabase unique après approbation.
6. Aucun secret n'est commité et aucun travail local n'est requis.

## Documentation

- [Stack technique](docs/STACK.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Déploiement Hostinger Cloud](docs/HOSTINGER-CLOUD.md)
- [Contenu validé de la homepage](docs/CONTENT-HOMEPAGE.md)
- [Secrets et environnement](docs/SECRETS.md)
- [Plan de réalisation](docs/ROADMAP.md)

## Statut

La fondation Next.js et la CI sont en place. La création du projet Supabase unique et la connexion du dépôt à Hostinger Cloud dans hPanel restent à effectuer avec les accès des comptes concernés.
