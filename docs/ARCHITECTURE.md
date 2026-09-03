# Architecture GitHub + Supabase + Hostinger

## Flux de livraison

1. Une branche et une pull request sont créées dans GitHub.
2. GitHub Actions exécute lint, typage, tests et build.
3. Les migrations validées sont appliquées au projet Supabase de staging.
4. Après fusion, GitHub Actions construit une image Docker immuable dans GHCR.
5. Hostinger VPS déploie cette image sur le domaine de staging.
6. La production utilise exactement le tag testé, après approbation GitHub Environment.
7. Le rollback redéploie le tag GHCR précédent.

## Supabase

- **PostgreSQL** : projets, typologies, lots, statuts, demandes, agents et journal d'intégration.
- **Auth** : accès au back-office et rôles administrateur, marketing et commercial.
- **Storage** : images, plans, brochures, vidéos et panoramas 360°.
- **Queues** : création IMMO PRO-X, emails, Meta CAPI et reprises après incident.
- **Cron** : consommation des files, relances et contrôles de cohérence.
- **Edge Functions** : webhooks et traitements asynchrones.
- **RLS** : lecture publique limitée aux contenus publiés ; données personnelles interdites au rôle anonyme.

## Hostinger

Hostinger exécute l'application Next.js en Docker avec Caddy. L'application sert le site public, le back-office et les routes serveur. L'email transactionnel utilise le SMTP Hostinger. Aucun service de données durable ne réside dans le conteneur web.

## IMMO PRO-X

Chaque réservation est d'abord enregistrée dans Supabase avec un identifiant d'idempotence. Une entrée Supabase Queue déclenche ensuite la création du prospect dans IMMO PRO-X. Les reprises sont archivées et les erreurs définitives deviennent visibles dans le back-office.

## Rotation commerciale

La transaction d'attribution s'exécute dans PostgreSQL afin d'éviter les doubles attributions. Elle considère les agents actifs, projets autorisés, horaires, charge, dernière attribution et indisponibilités.

## Google et Meta

Le navigateur envoie uniquement les événements autorisés par le consentement. Les conversions serveur sont placées dans Supabase Queues puis envoyées par une Edge Function, sans exposer les secrets au navigateur.
