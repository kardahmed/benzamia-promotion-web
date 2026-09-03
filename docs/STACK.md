# Stack technique — décision finale

L'infrastructure BENZAMIA utilise trois plateformes uniquement : **GitHub, Supabase et Hostinger**.

| Plateforme | Responsabilités |
|---|---|
| GitHub | Dépôt, branches, pull requests, CI/CD, Codespaces, Dependabot et images Docker GHCR |
| Supabase | PostgreSQL, Auth, Storage, API, Queues, Cron, Edge Functions et politiques RLS |
| Hostinger | VPS Docker, application Next.js, Caddy/TLS, domaine, DNS et email professionnel |

## Technologies applicatives

| Domaine | Technologie |
|---|---|
| Web | Next.js 16.3.4, React 19.2.8, TypeScript |
| Données | Supabase PostgreSQL |
| Back-office | Interface Next.js protégée par Supabase Auth |
| Médias | Supabase Storage |
| Tâches fiables | Supabase Queues, basé sur pgmq |
| Planification | Supabase Cron, basé sur pg_cron |
| Fonctions asynchrones | Supabase Edge Functions |
| Email | SMTP Hostinger |
| Exécution | Docker sur Hostinger VPS |
| Reverse proxy | Caddy sur Hostinger |
| Livraison | GitHub Actions → GHCR → Hostinger |

## Intégrations externes

Google Analytics, Google Ads, Meta Pixel/CAPI et IMMO PRO-X restent nécessaires au produit, mais ne stockent pas le code, les médias ou la base principale.

## Ce qui est explicitement exclu

- Payload CMS
- Redis et BullMQ
- Cloudflare et R2
- Vercel
- Firebase
- Resend et Postmark
- Sentry

## Politique de versions

- Node.js 24 LTS.
- Dépendances runtime épinglées.
- Dependabot propose les mises à jour.
- Toute mise à jour passe par CI et recette staging.
