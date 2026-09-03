# Architecture

## Flux de publication

1. Une branche est créée depuis `main`.
2. Une pull request déclenche lint, typage, tests et build.
3. Après fusion, GitHub Actions construit une image Docker identifiée par le SHA.
4. L'image est publiée dans GHCR et déployée automatiquement en staging.
5. La recette staging valide les parcours, le tracking et les intégrations.
6. La production utilise exactement le tag testé, après approbation de l'environnement `production`.
7. Un rollback réutilise le tag GHCR précédent.

## Domaines applicatifs

- **Catalogue immobilier** : projets, blocs, typologies, lots, équipements et disponibilité.
- **Médias** : galeries, plans, brochures, vidéos et visites 360°.
- **Réservation** : créneaux, coordonnées, consentement, confirmation et annulation.
- **CRM** : création de prospect IMMO PRO-X, déduplication et attribution par rotation.
- **Marketing** : UTM, gclid/fbclid, GA4, Google Ads, Meta Pixel/CAPI et consentement.
- **Éditorial** : guides « Investir à Chlef », actualités et avancement de chantier.

## Intégration IMMO PRO-X

L'adaptateur doit être idempotent. Chaque demande reçoit un identifiant interne avant l'appel CRM. Les erreurs temporaires vont dans une file Redis avec backoff. Les erreurs définitives sont journalisées et alertées. Aucun endpoint ou champ métier non documenté ne sera inventé.

## Rotation commerciale

La rotation doit prendre en compte : agents actifs, projet autorisé, horaires, plafond de charge, dernière attribution et indisponibilités. Chaque décision d'attribution est traçable et rejouable.

## Données personnelles

- Consentement séparé pour la demande et la prospection.
- Minimisation des données.
- Chiffrement en transit et au repos.
- Durées de conservation configurables.
- Suppression/export par processus administratif.
- Les données de formulaire ne sont jamais écrites dans les logs CI.
