# Secrets et environnements GitHub

Créer deux GitHub Environments : `staging` et `production`. La production doit exiger une approbation manuelle.

## Variable de dépôt

`HOSTINGER_DEPLOY_ENABLED=false` tant que le serveur n'est pas préparé, puis `true`.

## Secrets Hostinger par environnement

- `HOSTINGER_SSH_HOST`
- `HOSTINGER_SSH_PORT`
- `HOSTINGER_SSH_USER`
- `HOSTINGER_SSH_PRIVATE_KEY`
- `HOSTINGER_SSH_KNOWN_HOSTS`

## Secrets applicatifs sur le serveur

Ils restent dans `/opt/benzamia/{staging|production}/.env`, avec permissions restreintes :

- `DATABASE_URL`
- `REDIS_URL`
- `IMMOPROX_API_URL`
- `IMMOPROX_API_KEY`
- `IMMOPROX_WEBHOOK_SECRET`
- `EMAIL_API_KEY`
- `SENTRY_DSN`

Les jetons serveur, clés CAPI et secrets webhook ne doivent jamais être exposés au navigateur.

## Préparation VPS

Créer `/opt/benzamia/staging` et `/opt/benzamia/production`, puis y placer `docker-compose.deploy.yml`, `Caddyfile` et le fichier `.env` correspondant. Le compte SSH de déploiement doit être limité à ce périmètre.
