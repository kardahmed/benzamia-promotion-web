# Calendrier & réservation de visites — intégration IMMO PRO-X

**Statut : cible validée le 2026-09-07. Non opérationnel.**
Les endpoints de réservation et les webhooks côté IMMO PRO-X n'existent pas
encore (audit du 2026-09-07 : `POST /visits` renvoie `404` volontaire,
`emit-webhook` retiré `410`). Ce document décrit la cible à implémenter des
deux côtés. Tant qu'il n'est pas branché, `/reserver-une-visite` reste une
**demande à confirmer** (validation seule dans `POST /api/booking`).

## 1. Principes

- **IMMO PRO-X est la source de vérité** du planning des agents. Le site prend
  la demande et affiche un cache de disponibilités ; il ne planifie rien.
- **Confirmation manuelle.** Une demande du site n'est jamais un rendez-vous
  ferme. Un agent la confirme (ou propose un autre créneau) dans le CRM.
- **Le site ne doit jamais apprendre si un client existe déjà** dans le CRM.
  La résolution d'identité est entièrement interne à IMMO PRO-X.
- **Aucun secret CRM dans le navigateur.** Appels serveur à serveur
  uniquement, depuis les routes Next.js / Edge Functions Supabase.
- **Multi-tenant :** l'intégration est propre à un couple
  (tenant × site × environnement), révocable séparément. Le `tenant_id` est
  déduit exclusivement du token authentifié.

## 2. Répartition des rôles

| Responsabilité | Porté par |
|---|---|
| Disponibilité réelle des agents, blocage d'un créneau | IMMO PRO-X |
| Résolution / création du client | IMMO PRO-X (endpoint partenaire) |
| Attribution de l'agent (round-robin) | IMMO PRO-X |
| Confirmation / replanification / annulation d'une visite | Agent, dans IMMO PRO-X |
| Prise de la demande, validation des champs, délai 24 h | Site |
| Cache public des disponibilités (libre / occupé) | Site (Supabase) |
| File de rejeu, journal de synchro | Site (Supabase) |
| **Emails au client** (accusé de réception, confirmation, replanification) | **Site**, après réception d'un événement CRM signé et dédupliqué |
| Notification à l'agent | IMMO PRO-X (in-app), puis email/SMS selon réglages tenant |

Un seul responsable des emails client = le site. IMMO PRO-X n'envoie pas
d'email au client.

## 3. Règles métier

1. **Délai minimum 24 h.** Aucun créneau demandable à moins de 24 h de son
   début. Filtré au formulaire (date/heure minimale), revalidé côté serveur,
   revalidé par IMMO PRO-X à la confirmation.
2. **Lieu : toujours le bureau de vente** (configurable par tenant ;
   Benzamia = « Cité 20 Août 1955, Chlef »). Jamais sur le chantier. Affiché
   sur le formulaire et dans tous les emails.
3. **Attribution de l'agent : IMMO PRO-X, en round-robin** parmi les agents
   autorisés pour le projet et disponibles. Le site n'envoie aucune
   préférence d'agent.
4. **Client déjà connu.** L'endpoint partenaire résout le client en interne
   et **accepte** la demande. Il conserve **l'agent déjà assigné** (pas de
   nouveau round-robin). Un `409` n'est renvoyé **que** pour un conflit réel :
   identité ambiguë, créneau indisponible, requête incohérente.
5. **Agent existant indisponible.** Si l'agent assigné est inactif ou
   indisponible, la demande passe en **arbitrage administratif** dans le CRM.
   Pas de réaffectation silencieuse, pas de garantie de créneau.
6. **Coordonnées.** Une coordonnée (téléphone, email) fournie dans la demande
   est enregistrée comme **coordonnée déclarée, à vérifier**, rattachée à la
   demande — pas ajoutée automatiquement à la fiche client. **Aucune fusion
   automatique** : si le téléphone désigne un client et l'email un autre,
   c'est un cas d'arbitrage, jamais un rapprochement.
7. **CRM indisponible.** Voir §6.

## 4. Modèle de données (Supabase, côté site)

```
visit_slots
  id                uuid pk
  project_slug      text
  starts_at         timestamptz
  ends_at           timestamptz
  availability      text   -- 'free' | 'busy'  (jamais de nom d'agent ni de client)
  crm_source_id     text   -- id de l'occupation côté IMMO PRO-X, si connu
  updated_at        timestamptz

visit_requests
  id                  uuid pk
  idempotency_key     uuid unique          -- généré par le site, stable sur tous les rejeux
  external_ref        text unique          -- réf de LA réservation (≠ réf du contact)
  project_slug        text
  requested_start     timestamptz
  contact             jsonb                -- prénom, nom, téléphone, email, canal préféré, message
  consent             jsonb                -- finalité, choix, date, version du texte
  source              jsonb                -- pageUrl, referrer, utm*, gclid, fbclid
  status              text                 -- 'en_attente_stockage' -> 'recue' -> 'transmise'
                                           --   -> 'confirmee' | 'replanifiee' | 'refusee'
                                           --   | 'en_file' | 'arbitrage'
  crm_client_op_id    text                 -- id d'opération renvoyé par IMMO PRO-X
  crm_visit_id        text
  soft_hold_until     timestamptz          -- limite les demandes simultanées côté site ; PAS une réservation
  created_at          timestamptz
  updated_at          timestamptz

crm_sync_log
  id            uuid pk
  request_id    uuid fk visit_requests
  direction     text   -- 'push' | 'webhook' | 'poll'
  event_id      text   -- pour dédup des webhooks
  event_type    text   -- 'visit.created' | 'visit.updated' | 'visit.cancelled' | ...
  payload       jsonb
  received_at   timestamptz
```

## 5. Flux

### 5.1 Réservation (site → IMMO PRO-X)

1. Le client choisit un créneau **≥ 24 h** au bureau de vente et remplit le
   formulaire.
2. Le site génère `idempotency_key` + `external_ref` et **écrit
   `visit_requests` en base de façon durable**.
   - Tant que ce stockage n'a pas réussi, le client **ne voit pas**
     « demande reçue » : on affiche une invitation à réessayer ou à appeler.
3. Réponse au client : « demande reçue, un conseiller vous recontacte pour
   confirmer ». Statut `recue`.
4. `soft_hold_until` est posé (courte durée) pour éviter deux demandes
   simultanées **sur le même créneau depuis le site**. Ce n'est **pas** une
   réservation CRM.
5. Un job (Supabase Queue) appelle l'**endpoint partenaire** IMMO PRO-X avec
   `idempotency_key` et `external_ref` :
   - résolution / création du client (interne) ;
   - attribution de l'agent en round-robin, ou agent existant si client
     connu, ou arbitrage si agent indisponible ;
   - vérification + réservation du créneau ;
   - création de la visite au bureau de vente, statut « à confirmer » ;
   - enregistrement de l'interaction « demande de visite via le site web »
     avec `source = site_web`, **sans écraser la source d'origine**.
6. IMMO PRO-X renvoie `crm_client_op_id` + `crm_visit_id`. Statut `transmise`.
   Notification à l'agent (IMMO PRO-X).
7. Échec / timeout → §7 (rejeu) ou §6 (CRM indisponible).

### 5.2 Confirmation (IMMO PRO-X → site)

1. L'agent confirme / replanifie / refuse dans IMMO PRO-X.
2. IMMO PRO-X émet un **webhook signé** (`visit.confirmed`,
   `visit.rescheduled`, `visit.cancelled`) — voir §8.
3. Le site vérifie la signature, **déduplique par `event_id`**, met à jour
   `visit_requests` + `visit_slots`, puis **envoie l'email au client**
   (un seul email par transition, dédupliqué).
4. Pas de webhook disponible → **polling** par curseur (Supabase Cron), avec
   traitement des annulations et suppressions.

### 5.3 Délai / arbitrage

- Créneau demandé désormais à moins de 24 h et aucune opération CRM
  correspondante trouvée → **traitement humain** (statut `arbitrage`,
  notification interne).
- Agent assigné indisponible → `arbitrage`, jamais de réaffectation
  silencieuse.

## 6. CRM indisponible

- La demande n'est considérée « reçue » **qu'après stockage durable**
  (`visit_requests`). Si le stockage échoue, le client est invité à
  réessayer ou à appeler — pas de faux « c'est bon ».
- Une fois stockée : **email immédiat au `BOOKING_FALLBACK_EMAIL`**
  (Benzamia = `contact@benzamiapromotion.com`) avec toutes les infos, +
  statut `en_file`.
- **File de rejeu** (Supabase Cron) qui repousse vers IMMO PRO-X dès
  rétablissement, avec la **même `idempotency_key` et le même
  `external_ref`**.
- Emails de secours et de confirmation **dédupliqués** (une seule occurrence
  par demande et par type).

## 7. Idempotence & rejeu

- `idempotency_key` (uuid) et `external_ref` sont **générés une fois** par le
  site et **réutilisés à l'identique sur tous les rejeux**.
- Un timeout peut survenir **après** création côté CRM. Le rejeu doit
  **retrouver l'opération existante** (via `idempotency_key`) et **ne pas
  recréer** visite, interaction ni notification.
- L'endpoint partenaire IMMO PRO-X doit donc exposer une réponse idempotente
  stable (rejouer la même clé renvoie le même résultat, sans effet de bord).
- `external_ref` identifie **la réservation**, séparément de toute référence
  du contact. Les fusions / suppressions de clients côté CRM doivent rester
  sans impact sur cette référence.

## 8. Sécurité

- Auth site → IMMO PRO-X : `Authorization: Bearer <IMMOPROX_API_TOKEN>`
  (token par intégration, jamais `NEXT_PUBLIC_`).
- Webhooks IMMO PRO-X → site : **HMAC-SHA256** sur `timestamp + corps brut`,
  secret propre à l'intégration (`IMMOPROX_WEBHOOK_SECRET`), contrôle
  d'ancienneté du timestamp, protection anti-rejeu (`event_id` déjà vu).
- Destinations webhook en HTTPS validé, protégées contre l'accès aux réseaux
  privés (anti-SSRF).
- Le cache public (`visit_slots`) ne contient **que** `project_slug`,
  `starts_at`, `ends_at`, `availability`. Jamais de nom d'agent ni de donnée
  client.
- Contrôles anti-abus sur le formulaire public (rate-limit, honeypot /
  challenge) en complément de l'auth serveur à serveur.
- Une réservation est **toujours revalidée** par IMMO PRO-X : le cache ne
  garantit jamais une place.

## 9. Configuration (par tenant)

Variables serveur (`.env`, jamais `NEXT_PUBLIC_`) :

```
IMMOPROX_API_BASE_URL      # https://…/functions/v1/api-gateway/api/v1
IMMOPROX_API_TOKEN         # ipx_live_…  (propre à l'intégration)
IMMOPROX_INTEGRATION_ID    # identifiant de l'intégration site/tenant/env
IMMOPROX_WEBHOOK_SECRET    # secret HMAC propre à l'intégration
BOOKING_FALLBACK_EMAIL     # email de secours si CRM indisponible
```

Contenu :

```
Bureau de vente Benzamia : « Cité 20 Août 1955, Chlef »  (src/content/site.ts)
Email de secours Benzamia : contact@benzamiapromotion.com
```

## 10. À obtenir de l'équipe IMMO PRO-X

1. **Endpoint partenaire de réservation** : crée client (ou résout) +
   attribue agent (round-robin / agent existant) + réserve créneau + crée
   visite « à confirmer », le tout **transactionnel** et **idempotent**
   (`idempotency_key`, `external_ref`).
2. **Lecture des disponibilités** : créneaux libres par projet, ou liste des
   visites avec `updated_since` (aujourd'hui `/visits` n'expose ni
   `updated_at`, ni durée, ni suppressions).
3. **Webhooks** `visit.created | updated | cancelled` : journal transactionnel,
   livraison avec reprises, dédup par `event_id`, version par visite,
   endpoint de rattrapage par curseur, signature HMAC-SHA256. À défaut :
   endpoint « changements depuis un curseur ».
4. **Liste des agents** : id, actif/inactif, rôle, projets autorisés,
   horaires — pour l'affichage libre/occupé et l'arbitrage.
5. **Interaction / touchpoint** : possibilité d'ajouter une interaction
   « demande de visite via le site web » sur une fiche existante sans écraser
   la `source`.
6. **Round-robin** : confirmer que le CRM porte l'attribution (une amorce
   round-robin existe pour les landing pages internes mais n'est pas branchée
   sur l'API).
7. **Notifications agent** : l'agent est-il notifié quand une visite est
   créée via l'API ? Comment (in-app, email, SMS) ?
8. **Mapping** : `project_id` ↔ `project_slug`, `desired_unit_types`,
   `marketing_campaign_id`, canal préféré, **preuve de consentement**
   (finalité + choix + date + version — `do_not_contact` ≠ consentement).
9. **Sandbox** : URL / tenant de test.
10. **Quotas** : plafond 60 req/min/token + 120 req/min/IP — impact si
    plusieurs tenants partagent l'IP du serveur du site.
