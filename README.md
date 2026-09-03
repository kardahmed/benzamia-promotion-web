# BENZAMIA Promotion — plateforme web

Refonte complète de [benzamiapromotion.com](https://benzamiapromotion.com/) avec GitHub comme source de vérité et une chaîne CI/CD sans développement local.

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
- Toute évolution passe par une branche et une pull request.
- La CI bloque les régressions avant fusion.
- Les déploiements partent uniquement de GitHub Actions.
- Aucun secret ne doit être commité.

## Démarrage dans Codespaces

1. Ouvrir **Code → Codespaces → Create codespace on main**.
2. Le conteneur cloud installe Node.js 24 et les dépendances.
3. Utiliser `npm run dev` dans le terminal du Codespace.

## Commandes

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Documentation

- [Stack technique](docs/STACK.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contenu validé de la homepage](docs/CONTENT-HOMEPAGE.md)
- [Secrets et environnements](docs/SECRETS.md)
- [Plan de réalisation](docs/ROADMAP.md)

## Statut

Fondation technique. Les intégrations externes restent désactivées jusqu'à la fourniture et la validation des accès IMMO PRO-X, email, Google, Meta et Hostinger.
