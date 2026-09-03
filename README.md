# BENZAMIA Promotion — plateforme web

Refonte complète de [benzamiapromotion.com](https://benzamiapromotion.com/) avec **GitHub + Supabase + Hostinger** comme stack d'infrastructure unique.

## Répartition des responsabilités

- **GitHub** : code, documentation, branches, pull requests, CI/CD, registre Docker et Codespaces.
- **Supabase** : PostgreSQL, Auth, Storage, API, Queues, Cron et Edge Functions.
- **Hostinger** : VPS Docker, application Next.js, reverse proxy Caddy, domaine et email professionnel.
- **Google, Meta et IMMO PRO-X** : intégrations externes, pas fournisseurs d'infrastructure.

## Objectifs

- Présenter les programmes, leurs statuts, typologies, surfaces, plans et équipements.
- Filtrer les projets : tous, nouveau projet, en construction et terminé.
- Proposer des visites virtuelles 360° et la réservation de visites physiques.
- Synchroniser les demandes avec IMMO PRO-X et distribuer les prospects aux conseillers.
- Fiabiliser les emails, Google Analytics, Google Ads et Meta.
- Renforcer le SEO local et la visibilité dans les moteurs de réponse.
- Publier des guides « Investir à Chlef » et des actualités.

## Développement cloud uniquement

- GitHub est la source de vérité.
- Le travail s'effectue dans GitHub Codespaces ou par agents GitHub.
- Les migrations Supabase partent de GitHub Actions.
- Toute évolution passe par une branche et une pull request.
- Les déploiements partent uniquement de GitHub Actions.
- Aucun secret ne doit être commité.

## Documentation

- [Stack technique](docs/STACK.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contenu validé de la homepage](docs/CONTENT-HOMEPAGE.md)
- [Secrets et environnements](docs/SECRETS.md)
- [Plan de réalisation](docs/ROADMAP.md)

## Statut

Fondation technique validée. La connexion au projet Supabase et le déploiement Hostinger restent désactivés jusqu'à la configuration de leurs secrets.
