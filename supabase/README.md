# Supabase — source de données BENZAMIA

Supabase fournit PostgreSQL, Auth, Storage, Queues, Cron et Edge Functions dans un projet unique.

## Projet unique

- Nom : `benzamia-promotion`
- Nombre de projets Supabase : 1
- Nombre de bases PostgreSQL permanentes : 1

Il n'existe pas de projet staging et aucune seconde base ne doit être créée.

## Règles

- Toutes les migrations sont versionnées dans `supabase/migrations`.
- Aucune migration n'est exécutée depuis un ordinateur local.
- GitHub Actions contrôle les changements proposés.
- L'application sur la base unique exige l'approbation du GitHub Environment `production`.
- RLS est obligatoire sur toute table exposée par la Data API.
- Le rôle anonyme ne peut jamais lire les réservations, coordonnées ou attributions.
- Les sauvegardes et restaurations sont gérées depuis Supabase, sans dupliquer l'architecture applicative.

La référence et le mot de passe du projet sont stockés uniquement dans le GitHub Environment `production`.
