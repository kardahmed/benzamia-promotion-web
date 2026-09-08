# Secrets — environnement de production unique

Créer un seul GitHub Environment : `production`. Il protège les opérations sensibles, notamment l'application des migrations sur l'unique projet Supabase.

## GitHub Actions vers Supabase

Ces secrets ciblent tous le même projet `benzamia-promotion` :

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Aucun jeu de secrets staging et aucune seconde référence de projet ne sont nécessaires.

## Runtime Hostinger Cloud

Configurer dans hPanel, pour l'application Node.js :

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_DATABASE_URL`
- `IMMOPROX_API_URL`
- `IMMOPROX_API_KEY`
- `IMMOPROX_WEBHOOK_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `CONTACT_RECIPIENT`

La clé Supabase secrète, la connexion PostgreSQL, les identifiants IMMO PRO-X et le mot de passe SMTP ne doivent jamais être préfixés par `NEXT_PUBLIC_`.

## Déploiement Hostinger

Le CD utilise la connexion GitHub native de hPanel sur la branche `main`. Il ne nécessite pas de clé SSH, de secret VPS, de registre Docker ou de webhook stocké dans le dépôt.
