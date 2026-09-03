# Architecture GitHub + Supabase + Hostinger Cloud

## Flux de livraison

1. Une branche et une pull request sont créées dans l'unique dépôt GitHub.
2. GitHub Actions exécute lint, typage, tests et build.
3. La pull request ne peut être fusionnée sur `main` qu'après validation de la CI.
4. Hostinger Cloud suit la branche `main` via l'intégration GitHub de hPanel.
5. Après chaque fusion, Hostinger installe les dépendances, construit puis redémarre l'application Next.js managée.
6. Un retour arrière passe par un revert du commit défaillant, puis par le même déploiement automatique.

Il n'y a ni image Docker, ni serveur VPS, ni reverse proxy à administrer.

## Une seule source de données

Le projet Supabase `benzamia-promotion` est l'unique source de vérité persistante :

- **PostgreSQL** : projets, typologies, lots, statuts, demandes, agents et journal d'intégration.
- **Auth** : accès au back-office et rôles administrateur, marketing et commercial.
- **Storage** : images, plans, brochures, vidéos et panoramas 360°.
- **Queues** : création IMMO PRO-X, emails, Meta CAPI et reprises après incident.
- **Cron** : consommation des files, relances et contrôles de cohérence.
- **Edge Functions** : webhooks et traitements asynchrones.
- **RLS** : lecture publique limitée aux contenus publiés ; données personnelles interdites au rôle anonyme.

Aucun projet Supabase de staging n'est créé. Les changements de schéma sont versionnés dans le dépôt, contrôlés en pull request puis appliqués une seule fois à la base unique après approbation.

## Hostinger Cloud

Hostinger exécute l'application Next.js comme application Node.js managée. hPanel prend en charge la construction, le redémarrage, le domaine et le SSL. Les variables runtime sont configurées dans hPanel. L'email transactionnel utilise le SMTP Hostinger.

## IMMO PRO-X

Chaque réservation est d'abord enregistrée dans Supabase avec un identifiant d'idempotence. Une entrée Supabase Queue déclenche ensuite la création du prospect dans IMMO PRO-X. Les reprises sont archivées et les erreurs définitives deviennent visibles dans le back-office.

## Rotation commerciale

La transaction d'attribution s'exécute dans PostgreSQL afin d'éviter les doubles attributions. Elle considère les agents actifs, les projets autorisés, les horaires, la charge, la dernière attribution et les indisponibilités.

## Google et Meta

Le navigateur envoie uniquement les événements autorisés par le consentement. Les conversions serveur sont placées dans Supabase Queues puis envoyées par une Edge Function, sans exposer les secrets au navigateur.
