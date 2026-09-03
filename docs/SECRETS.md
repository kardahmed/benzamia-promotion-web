# Secrets — GitHub, Supabase et Hostinger

Créer les GitHub Environments `staging` et `production`. La production exige une approbation manuelle.

## GitHub Actions vers Hostinger

- `HOSTINGER_SSH_HOST`
- `HOSTINGER_SSH_PORT`
- `HOSTINGER_SSH_USER`
- `HOSTINGER_SSH_PRIVATE_KEY`
- `HOSTINGER_SSH_KNOWN_HOSTS`

Variable : `HOSTINGER_DEPLOY_ENABLED=false` jusqu'à la préparation du VPS.

## GitHub Actions vers Supabase

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

## Runtime Hostinger

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_DATABASE_URL`
- `IMMOPROX_API_URL`
- `IMMOPROX_API_KEY`
- `IMMOPROX_WEBHOOK_SECRET`
- `HOSTINGER_SMTP_HOST`
- `HOSTINGER_SMTP_PORT`
- `HOSTINGER_SMTP_USER`
- `HOSTINGER_SMTP_PASSWORD`

Les secrets serveur restent dans `/opt/benzamia/{staging|production}/.env` avec permissions restreintes. La clé Supabase secrète et les mots de passe SMTP ne sont jamais préfixés par `NEXT_PUBLIC_`.
