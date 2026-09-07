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

- [~] Formulaires réservation et contact (UI + validation `/api/booking`, `/api/contact` ; persistance et envoi à faire)
- [ ] Réservation avec disponibilités réelles
- [ ] Adaptateur IMMO PRO-X
- [ ] Rotation transactionnelle des conseillers
- [ ] Email SMTP Hostinger
- [ ] Déduplication, reprises et alertes

## Phase 4 — Acquisition et qualité

- [ ] Consentement et plan de marquage
- [ ] GA4, Google Ads et Meta Pixel/CAPI
- [ ] SEO technique, données structurées et redirections
- [ ] Tests Playwright, accessibilité et Lighthouse
- [ ] Monitoring Hostinger/Supabase et exercice de retour arrière
