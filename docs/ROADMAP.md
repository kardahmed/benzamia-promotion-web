# Plan de réalisation

## Phase 0 — Fondation

- [x] Dépôt GitHub unique et source de vérité distante
- [x] Next.js, TypeScript et Codespaces
- [x] CI GitHub Actions
- [x] Contenu validé de la homepage
- [x] Stack limitée à GitHub + Supabase + Hostinger
- [x] Architecture corrigée : sans VPS, Docker, Caddy ou GHCR
- [ ] Créer un seul projet Supabase : `benzamia-promotion`
- [ ] Créer le GitHub Environment `production` et ses secrets Supabase
- [ ] Connecter le dépôt et la branche `main` à Hostinger Cloud dans hPanel
- [ ] Configurer les variables runtime Hostinger
- [ ] Générer le `package-lock.json` depuis GitHub Actions

## Phase 1 — Supabase unique

- [ ] Schéma projets, typologies, lots, médias, visites et agents
- [ ] RLS et rôles du back-office
- [ ] Buckets images, plans, brochures et visites 360°
- [ ] Queues IMMO PRO-X, email et conversions
- [ ] Cron et Edge Functions
- [ ] Migrations vers la base unique, après revue et approbation

## Phase 2 — Expérience

- [~] Design system Tailwind + tokens de charte, monogramme vectoriel officiel
- [~] Homepage responsive (visuels réels encore à intégrer via Supabase Storage)
- [x] Catalogue, filtres (partageables par URL) et pages projet
- [~] Visite virtuelle accessible (page + emplacement ; panoramas à intégrer)
- [~] Guides Investir et blog (hub + listes ; contenus rédactionnels à fournir)
- [x] Pages BENZAMIA, Contact et pages légales (gabarits à valider juridiquement)
- [ ] Back-office Supabase Auth

## Phase 3 — Conversion

Spécification cible : [docs/CALENDRIER-IMMOPROX.md](CALENDRIER-IMMOPROX.md)
(règles métier validées le 2026-09-07 ; endpoints de réservation et webhooks
**non encore opérationnels côté IMMO PRO-X** — reprise après livraison de
l'interface partenaire du CRM).

- [x] Formulaires réservation et contact — UI + validation (`/api/booking` :
  délai 24 h, visite au bureau de vente ; `/api/contact`)
- [ ] Persistance durable Supabase des demandes (`visit_requests`) + réponse
  « demande reçue » uniquement après stockage réussi
- [ ] Adaptateur endpoint partenaire IMMO PRO-X (résolution client, idempotence,
  `external_ref`)
- [ ] Attribution des conseillers portée par le CRM (round-robin / agent
  existant), arbitrage si indisponible
- [ ] Webhooks CRM signés (`visit.confirmed / rescheduled / cancelled`) →
  mise à jour + email client (responsable email = le site)
- [ ] Repli e-mail `BOOKING_FALLBACK_EMAIL` si le CRM est indisponible + file de
  rejeu
- [ ] Email SMTP Hostinger
- [ ] Déduplication (emails de secours et de confirmation), reprises et alertes

## Phase 4 — Acquisition et qualité

- [ ] Consentement et plan de marquage
- [ ] GA4, Google Ads et Meta Pixel/CAPI
- [ ] SEO technique, données structurées et redirections
- [ ] Tests Playwright, accessibilité et Lighthouse
- [ ] Monitoring Hostinger/Supabase et exercice de retour arrière
