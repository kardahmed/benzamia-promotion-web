# Mesure d'audience & consentement

Cahier des charges V2 §13. **Léger, documenté, testé avant lancement.**

> Mesure serveur (GA4 Measurement Protocol + Meta CAPI), entonnoir de
> formulaire, valorisation des leads, cross-domain : voir
> **`docs/TRACKING-AVANCE.md`**.

## Ce que fait le code du site

| Élément | Fichier |
|---|---|
| Consent Mode v2 (refus par défaut) + chargement GTM | `src/components/analytics/tag-manager.tsx` |
| Bannière de consentement + bouton « Gérer les cookies » | `src/components/analytics/consent-banner.tsx` |
| Cookie `benzamia_consent` (2 catégories, 180 j, versionné) | `src/lib/consent.ts` |
| Meta Pixel (chargé seulement si consentement marketing + `NEXT_PUBLIC_META_PIXEL_ID`) | `src/components/analytics/meta-pixel.tsx` |
| `track(event, params)` → `dataLayer` | `src/lib/analytics.ts` |
| Écouteur de clics délégué (`tel:`, `data-analytics-event`) | `src/components/analytics/click-tracking.tsx` |

Le site **ne charge pas GA4 directement**. Il pousse des événements dans
`dataLayer` ; c'est GTM qui décide quoi envoyer, à qui, selon le consentement.

## Identifiants

| Service | ID | Où |
|---|---|---|
| Google Tag Manager | `GTM-K22BDCXQ` | `NEXT_PUBLIC_GTM_ID` (défaut dans le code) |
| Google Analytics 4 | `G-DS3H6KY8CF` | **dans GTM**, pas dans le code |
| Meta Pixel | à fournir | `NEXT_PUBLIC_META_PIXEL_ID` (vide = pixel jamais chargé) |

## Consent Mode v2

Au chargement, avant GTM : tout est **`denied`** sauf
`functionality_storage` / `security_storage`. Le choix déjà enregistré dans le
cookie est réappliqué immédiatement. La bannière met à jour :

| Catégorie site | Signaux Google |
|---|---|
| Mesure d'audience | `analytics_storage` |
| Marketing | `ad_storage`, `ad_user_data`, `ad_personalization` |

## Plan de marquage (événements `dataLayer`)

| Événement | Déclenchement | Paramètres |
|---|---|---|
| `view_project` | fiche projet affichée / clic « Découvrir » | `project`, `project_name` |
| `filter_projects` | clic sur un filtre (accueil ou /projets) | `filter`, `location` |
| `start_virtual_tour` | clic « Lancer la visite virtuelle » | `location` |
| `click_phone` | clic sur un lien `tel:` | `phone` |
| `click_whatsapp` | clic sur un lien WhatsApp | — |
| `begin_booking` | 1er focus dans le formulaire de réservation | `project` |
| `select_slot` | choix d'un créneau | `slot` |
| `submit_booking` | demande de visite acceptée | `project` |
| `submit_contact` | message de contact envoyé | — |
| `generate_lead` | après `submit_booking` ou `submit_contact` | `lead_type` (`visit_request` \| `contact`) |
| `open_plan`, `download_brochure` | à câbler quand les plans/brochures existent | — |

## À configurer dans GTM (par l'administrateur)

1. **Balise GA4 Configuration** — ID `G-DS3H6KY8CF`, déclencheur *Initialization
   – All Pages*. Cocher « Activer le consentement intégré » ; laisser Consent
   Mode gérer le stockage.
2. **Balises GA4 Event** pour chaque événement du plan ci-dessus (déclencheur =
   *Custom Event* du même nom), en mappant les paramètres.
3. **Balise Google Ads** (conversion) sur `generate_lead` si un compte Ads est
   relié — nécessite le consentement `ad_storage`.
4. **Meta** : si le tag Meta est géré dans GTM plutôt que par le pixel du site,
   le conditionner à `consent_marketing = true` (variable *Data Layer*).
5. Publier le conteneur, puis **tester en mode Aperçu GTM** + *DebugView* GA4 :
   vérifier que rien ne part avant acceptation, et que chaque événement du plan
   remonte après acceptation.

## RGPD / CNIL

Bien qu'Algérie hors UE, le CDC impose la gestion du consentement : refus par
défaut, bannière non bloquante avec choix équivalents (« Tout accepter » /
« Continuer sans accepter »), granularité (2 catégories), révocable via
« Gérer les cookies » en pied de page, durée du cookie 6 mois, version
enregistrée pour retracer le consentement.
