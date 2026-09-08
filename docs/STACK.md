# Stack technique — décision finale

La plateforme BENZAMIA repose sur trois services seulement : **GitHub, Supabase et Hostinger Cloud**.

## Invariant d'architecture

- 1 dépôt GitHub : `kardahmed/benzamia-promotion-web`
- 1 projet Supabase : `benzamia-promotion`
- 1 base PostgreSQL Supabase
- 1 application de production Hostinger Cloud reliée à la branche `main`

Aucun second dépôt et aucune seconde base permanente ne doivent être créés.

| Plateforme | Responsabilités |
|---|---|
| GitHub | Dépôt unique, branches, pull requests, CI, Codespaces et Dependabot |
| Supabase | Projet unique, PostgreSQL, Auth, Storage, API, Queues, Cron, Edge Functions et RLS |
| Hostinger Cloud | Node.js managé, déploiement GitHub automatique, domaine, DNS, SSL, CDN et email professionnel |

## Technologies applicatives

| Domaine | Technologie |
|---|---|
| Web | Next.js 16.3.4, React 19.2.8, TypeScript |
| Design | Tailwind CSS 4 (PostCSS), tokens centralisés dans `src/app/globals.css` |
| Polices | `next/font` — Inter (interface), Fraunces (accents serif éditoriaux), Montserrat (logotype), Caveat (annotations manuscrites) |
| Données | Une base Supabase PostgreSQL |
| Back-office | Interface Next.js protégée par Supabase Auth |
| Médias | Supabase Storage dans le même projet |
| Tâches fiables | Supabase Queues |
| Planification | Supabase Cron |
| Fonctions asynchrones | Supabase Edge Functions |
| Email | SMTP Hostinger |
| Exécution | Application Node.js managée par Hostinger Cloud |
| Livraison | GitHub Actions pour la CI, intégration GitHub Hostinger pour le CD |

## Intégrations externes

Google Analytics, Google Ads, Meta Pixel/CAPI et IMMO PRO-X restent nécessaires au produit, mais ne stockent ni le code, ni les médias, ni la base principale.

## Explicitement exclus

- VPS
- Docker et Docker Compose
- Caddy
- GHCR
- Payload CMS
- Redis et BullMQ
- Cloudflare et R2
- Vercel
- Firebase
- Postmark
- ~~Resend~~ — finalement retenu comme fournisseur SMTP des e-mails
  transactionnels (via son endpoint `smtp.resend.com`, décision 2026-09-08)
- Sentry

## Politique de versions

- Node.js 22, conformément à `package.json`.
- Dépendances runtime épinglées.
- Dependabot propose les mises à jour.
- Toute mise à jour passe par une pull request et la CI avant le déploiement Hostinger.
