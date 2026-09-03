# Supabase — source de données BENZAMIA

Supabase fournit la base PostgreSQL, Auth, Storage, Queues, Cron et Edge Functions.

## Règles

- Toutes les migrations sont versionnées dans `supabase/migrations`.
- Aucune migration n'est exécutée depuis un ordinateur local.
- GitHub Actions applique d'abord les migrations en staging.
- La production exige une approbation GitHub Environment.
- RLS est obligatoire sur toute table exposée par la Data API.
- Le rôle anonyme ne peut jamais lire les réservations, coordonnées ou attributions.

## Projets requis

- `benzamia-staging`
- `benzamia-production`

Les références et mots de passe de projet sont stockés uniquement dans les GitHub Environments.
