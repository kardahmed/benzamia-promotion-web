# Formulaires — stockage & e-mails

Cahier des charges V2 §9 & §12.

## Vue d'ensemble

`/api/contact` et `/api/booking` suivent le même principe :

1. **Validation** des champs
2. **Anti-abus** — honeypot (`company`) + reCAPTCHA v3 (`src/lib/recaptcha.ts`)
3. **Stockage durable** — Supabase (`src/lib/supabase/store.ts`)
4. **E-mails** — SMTP Hostinger (`src/lib/email.ts` + `src/lib/notifications.ts`)
   - notification à l'équipe (`CONTACT_RECIPIENT`, `reply-to` = expéditeur)
   - accusé de réception au client (si e-mail fourni)
5. **Repli** — si le stockage échoue alors que Supabase est configuré, tout
   part par e-mail vers `BOOKING_FALLBACK_EMAIL`

### Comportement selon la configuration

| Supabase | SMTP | Résultat |
|---|---|---|
| absent | absent | accepté (mode MVP, rien n'est conservé) |
| absent | OK | accepté + e-mail équipe |
| absent | en échec | **503** « réessayez / appelez-nous » |
| OK | quelconque | accepté (ligne créée) + tentative d'e-mail |
| en échec | OK | accepté via repli e-mail |
| en échec | en échec | **503** |

`skipped` (non configuré) n'est jamais traité comme une erreur.

## Base de données

Migration `supabase/migrations/0001_form_submissions.sql` :

- `public.contact_messages`
- `public.visit_requests` — `idempotency_key` unique (dédoublonnage des retries),
  `external_ref` unique (référence de la réservation), `status`
  (`recue` → `transmise` → `confirmee` | …), `email_status`

**RLS activée, aucune policy** → inaccessible via la Data API. Seul le rôle
`service_role` (serveur Next.js avec `SUPABASE_SECRET_KEY`) lit et écrit.

Application : voir `supabase/README.md` (jamais depuis un poste local ;
GitHub Environment `production`).

## Variables (hPanel — jamais `NEXT_PUBLIC_` pour les secrets)

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
SMTP_HOST
SMTP_PORT           # 465 (SSL) par défaut
SMTP_USER
SMTP_PASSWORD
EMAIL_FROM                    # "BENZAMIA Promotion <contact@benzamiapromotion.com>"
CONTACT_RECIPIENT            # contact@benzamiapromotion.com
BOOKING_FALLBACK_EMAIL       # = CONTACT_RECIPIENT par défaut
```

Après ajout des variables : redéployer. Vérifier SPF / DKIM / DMARC du domaine
et tester la réception sur Gmail + Outlook.

## Reste à faire

- Idempotence : la clé vient du client (`BookingForm`) ; l'idempotence stricte
  côté serveur (rejouer exactement la même réponse) arrivera avec l'endpoint
  partenaire IMMO PRO-X — voir `docs/CALENDRIER-IMMOPROX.md`.
- File de rejeu vers IMMO PRO-X + webhooks de confirmation (bloqués côté CRM).
- Back-office léger de consultation des demandes.
