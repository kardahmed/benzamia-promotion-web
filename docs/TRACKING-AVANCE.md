# Tracking avancé

Complète `docs/TRACKING.md` (Consent Mode, bannière, GTM de base). Objectif :
une mesure **fiable malgré les bloqueurs de pub et Safari/ITP**, des conversions
**valorisées**, et un entonnoir exploitable — sans coût récurrent.

Périmètre validé le 2026-09-08 : GA4 + Meta, **pas de Google Ads**.

## 1. Ce que le code fait désormais

### Événements navigateur (`dataLayer`)

| Événement | Déclenchement | Paramètres clés |
|---|---|---|
| `view_item_list` | liste de programmes affichée (accueil, /projets) | `item_list_name`, `items[]` |
| `view_item` | fiche programme affichée | `items[]`, `project` |
| `select_item` | clic « Découvrir » sur une carte | `project`, `projectName`, `listName` |
| `scroll_depth` | 25 / 50 / 75 / 90 % de la page (1× chacun) | `percent`, `page_path` |
| `outbound_click` | clic vers un domaine externe | `link_url`, `link_domain` |
| `file_download` | clic vers un fichier (pdf, plan, image…) | `file_name`, `file_extension` |
| `contact_channel_click` | clic tel / WhatsApp / mailto | `channel`, `phone` |
| `virtual_tour_engaged` | visite 360° ouverte depuis > 30 s | `location` |
| `virtual_tour_room` | changement de panorama (si 3DVista l'émet) | `room` |
| `form_start` / `form_submit` / `form_error` / `form_abandon` | entonnoir des 2 formulaires | `form_name`, `reason` |
| `generate_lead` | visite ou contact accepté | `event_id`, `value`, `currency`, `lead_type`, `items[]` |

Les événements historiques du CDC (`view_project`, `begin_booking`,
`submit_booking`, `click_phone`…) sont **conservés en alias** : les balises GTM
déjà configurées continuent de fonctionner.

### Mesure côté serveur (`src/lib/tracking/server.ts`)

`/api/booking` et `/api/contact` rejouent `generate_lead` **depuis le serveur** :

- **GA4 Measurement Protocol** — `client_id` GA4 transmis par le navigateur +
  `event_id` commun ⇒ le hit serveur est fusionné avec le hit client, pas
  compté deux fois. Adblock / ITP n'ont aucune prise.
- **Meta Conversions API** — événement `Lead` avec `event_id` (dédup pixel),
  e-mail / téléphone / nom **hachés SHA-256** (jamais en clair), `_fbp` / `_fbc`,
  IP et User-Agent côté serveur.

Tant que les secrets sont vides, **aucun appel réseau** n'est fait. Un échec
réseau n'impacte jamais la réponse du formulaire (fire-and-forget, timeout 2,5 s).

### Valeur des leads (`src/lib/tracking/config.ts`)

Devise : **USD** (la publicité est achetée en dollars).

Tunnel mesuré en septembre 2026 : **1 200 leads → 150 visites réalisées →
1 vente**, marge 20 000 USD par vente, coût publicitaire ~3 USD par lead.

| Étape | Valeur (USD) | D'où elle vient | Envoyée par |
|---|---|---|---|
| `visit_request` | 16,67 | 20 000 / 1 200 | site (formulaire) |
| `contact` | 16,67 | idem — même vivier, pas de taux distinct mesuré | site (formulaire) |
| visite **réalisée** | 133,33 | 20 000 / 150 | hors ligne (CRM / fichier) |
| vente | 20 000 | marge, pas le prix de vente | hors ligne (CRM / fichier) |

Ce n'est pas de l'argent encaissé : c'est la contribution moyenne attendue à
la marge. Les trois lignes ne s'additionnent pas, ce sont trois lectures du
même tunnel. Le formulaire « demande de visite » vaut 16,67 et **non** 133,33 :
la visite n'est pas encore réalisée au moment de l'envoi. À réévaluer dès
qu'il y a plusieurs ventes.

## 2. À configurer (hors code)

### a. Secrets à fournir → variables d'environnement Hostinger

| Variable | Où l'obtenir |
|---|---|
| `GA4_API_SECRET` | GA4 → Admin → Flux de données → Web → **Protocole de mesure** → Créer |
| `META_PIXEL_ID` | Gestionnaire d'événements Meta (ID du pixel) |
| `META_CAPI_TOKEN` | Pixel → Paramètres → **Générer un jeton d'accès (API de conversions)** |
| `NEXT_PUBLIC_META_PIXEL_ID` | même ID que ci-dessus (pour le pixel navigateur) |

Test : poser `GA4_DEBUG=1` + `META_TEST_EVENT_CODE=TESTxxxx`, envoyer un
formulaire, vérifier dans **GA4 DebugView** et **Meta → Événements de test**,
puis retirer ces deux variables.

### b. GTM (`GTM-K22BDCXQ`, compte benzamiapromotion@gmail.com)

1. **GA4 Configuration** : activer *Enhanced Measurement* complet (scroll,
   clics sortants, téléchargements, recherche interne, formulaires, vidéo).
2. **Cross-domain** : dans la balise GA4 Config, champ *Configure your domains*
   → `benzamiapromotion.com` **et** `kardahmed.github.io` (la visite 360°).
3. **Balises GA4 Event** pour chaque nouvel événement (déclencheur = *Custom
   Event* du même nom). Pour `generate_lead`, mapper `value`, `currency`,
   `lead_type`, et transmettre `event_id` dans le champ *Event ID*
   (déduplication avec le serveur).
4. **Dimensions personnalisées GA4** (Admin → Définitions personnalisées,
   portée *Événement*) : `project`, `lead_type`, `lead_source`, `form_name`,
   `filter`, `percent`, `room`, `channel`.
5. **Meta** : soit garder le pixel du site (déjà conditionné au consentement
   marketing) + la CAPI serveur ; soit déplacer le pixel dans GTM avec un
   déclencheur conditionné à `consent_marketing = true`. Dans les deux cas,
   la balise `Lead` doit lire `event_id` du dataLayer.
6. **Trafic interne** : variable *Constante* `?internal=1` → cookie → exception
   sur toutes les balises (ou filtre GA4 par IP du bureau de vente).
7. Publier, puis **Aperçu GTM + GA4 DebugView** : rien avant acceptation,
   tout après.

### c. GA4 — rapports

- **Événements clés** (Admin → Événements) : `generate_lead`, `submit_booking`,
  `submit_contact`.
- **Export BigQuery** (Admin → Liaisons BigQuery) : gratuit, quota *sandbox*
  suffisant ; conserve la donnée brute pour analyse fine.
- **Looker Studio** : source GA4 → leads par `project` / `lead_source` /
  `channel`, entonnoir `form_start → form_submit → generate_lead`.

## 3. Fichiers

| Rôle | Fichier |
|---|---|
| Valeurs de lead + items GA4 | `src/lib/tracking/config.ts` |
| IDs de stitching (client) | `src/lib/tracking/ids.ts` |
| Dispatch serveur GA4 + Meta | `src/lib/tracking/server.ts` |
| Entonnoir de formulaire | `src/lib/tracking/use-form-funnel.ts` |
| Scroll depth | `src/components/analytics/engagement-tracking.tsx` |
| Clics sortants / téléchargements / canaux | `src/components/analytics/click-tracking.tsx` |
| Plan de marquage (union de types) | `src/lib/analytics.ts` |

## 4. Ce qui n'est PAS fait (choix explicite)

- **Server-side GTM** (conteneur sur `gtm.benzamiapromotion.com`) : écarté pour
  éviter un coût mensuel. La CAPI Meta + le Measurement Protocol GA4 couvrent
  l'essentiel du besoin « anti-adblock ».
- **Google Ads** : pas de compte publicitaire ⇒ aucune balise de conversion Ads.
  Le code `generate_lead` est prêt si cela change.
