# Stack technique de référence

| Domaine | Technologie | Rôle |
|---|---|---|
| Application web | Next.js 16, React 19, TypeScript | Site public, rendu serveur, routes API et SEO |
| CMS | Payload CMS 3 | Projets, logements, médias, visites virtuelles, guides et actualités |
| Base de données | PostgreSQL | Contenus structurés, disponibilités, demandes et journal d'intégration |
| File de tâches | Redis + BullMQ | Retries IMMO PRO-X, emails et conversions publicitaires |
| Validation | Schémas TypeScript/Zod | Contrats de formulaires, webhooks et API |
| Médias | Stockage S3 compatible / Cloudflare R2 | Images, plans, brochures et panoramas |
| Edge | Cloudflare | DNS, CDN, WAF, cache et protection |
| Exécution | Docker sur Hostinger VPS | Staging et production |
| Registre | GitHub Container Registry | Images Docker immuables par SHA |
| CI/CD | GitHub Actions + Environments | Qualité, build, approbation, déploiement et rollback |
| Email | Postmark ou Resend, choix à valider | Emails transactionnels et délivrabilité |
| Observabilité | Sentry + supervision HTTP | Erreurs, performance et disponibilité |
| Mesure | GTM, GA4, Google Ads, Meta Pixel + CAPI | Mesure consentie et rapprochement des conversions |

## Politique de versions

- Node.js 24 LTS.
- Next.js 16.3.4 et React 19.2.8 au démarrage.
- Versions exactes pour le runtime.
- Mises à jour proposées chaque semaine par Dependabot.
- Les mises à jour majeures exigent une pull request séparée et une recette staging.

## CMS

Payload sera activé après création de PostgreSQL et validation du modèle de données. Le build initial n'exige aucun accès base de données. Ce séquencement empêche la CI d'être liée à des secrets non encore fournis.

## Pas de développement local

GitHub Codespaces constitue l'environnement de développement. GitHub Actions constitue l'environnement de validation, de construction et de déploiement.
