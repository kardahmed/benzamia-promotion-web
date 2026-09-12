/*
 * Transmission d'une demande de visite à IMMO PRO-X
 * (POST /site-integration/v1/bookings).
 *
 * Ce que le CRM renvoie n'est PAS un rendez-vous : `202 queued_for_review`
 * signifie « demande enregistrée durablement, un conseiller la traitera ».
 * Le site continue donc d'annoncer « demande envoyée, en attente de
 * confirmation » — voir docs/CALENDRIER-IMMOPROX.md.
 *
 * On conserve `request_id` : c'est la référence qui reliera plus tard les
 * événements du CRM (visite confirmée, effectuée) à notre demande.
 *
 * Inerte tant que les variables ne sont pas renseignées : le formulaire
 * continue de fonctionner (stockage + e-mail), rien n'est perdu.
 */
const BASE_URL = process.env.IMMOPROX_API_BASE_URL || "";
const TOKEN = process.env.IMMOPROX_API_TOKEN || "";

/** Le CRM revalide de son côté ; on ne bloque jamais le visiteur longtemps. */
const TIMEOUT_MS = 5000;

/** Durée d'un rendez-vous de visite, en minutes (contrat : 15 à 480). */
const DURATION_MINUTES = 30;

/**
 * Version du texte d'information affiché au visiteur. À incrémenter quand la
 * politique de confidentialité change : le CRM conserve cette version comme
 * preuve de ce qui a été montré, pas seulement la date.
 */
export const PRIVACY_NOTICE_VERSION = "2026-09-v1";

/** Le bureau de vente ouvre à 9 h le matin, 13 h l'après-midi (heure d'Alger). */
const SLOT_START_HOUR: Record<string, number> = { matin: 9, "après-midi": 13, "apres-midi": 13 };

/** Alger est à UTC+1 toute l'année (pas d'heure d'été). */
const ALGIERS_UTC_OFFSET_H = 1;

export type BookingSubmission = {
  externalRef: string;
  projectSlug: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredDate: string;
  preferredTime: string;
  typology?: string;
  preferredChannel?: string;
  note?: string;
  marketingConsent: boolean;
  source: Record<string, unknown>;
  idempotencyKey: string;
  submittedAt?: Date;
};

export type CrmBookingResult =
  | { status: "accepted"; requestId: string; replayed: boolean }
  | { status: "rejected"; code: string }
  | { status: "unavailable"; detail: string }
  | { status: "skipped" };

/** « Matin (9h – 12h) » → heure de début, en UTC, au format exact du contrat. */
export function slotToUtcStart(preferredDate: string, preferredTime: string): string | null {
  const label = preferredTime.trim().toLowerCase();
  const key = Object.keys(SLOT_START_HOUR).find((k) => label.startsWith(k));
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return null;
  const hour = SLOT_START_HOUR[key] - ALGIERS_UTC_OFFSET_H;
  const [y, m, d] = preferredDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, hour, 0, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  // Le contrat impose les millisecondes explicites.
  return date.toISOString().replace(/\.\d{3}Z$/, ".000Z");
}

const CHANNELS: Record<string, "phone" | "whatsapp" | "email"> = {
  téléphone: "phone",
  telephone: "phone",
  phone: "phone",
  whatsapp: "whatsapp",
  email: "email",
};

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

/** Construit le corps exact attendu par le CRM (champs inconnus refusés). */
export function buildBookingPayload(
  input: BookingSubmission,
): Record<string, unknown> | null {
  const startsAt = slotToUtcStart(input.preferredDate, input.preferredTime);
  if (!startsAt) return null;

  // Le formulaire demande « Nom et prénom » en un seul champ. Si le visiteur
  // n'écrit qu'un mot, on le met dans les deux : le CRM exige les deux champs,
  // et inventer un nom serait pire qu'une répétition visible.
  const parts = input.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = (parts[0] ?? "").slice(0, 80);
  const lastName = (parts.slice(1).join(" ") || parts[0] || "").slice(0, 80);
  if (!firstName || !lastName) return null;

  const channel = CHANNELS[(input.preferredChannel ?? "").trim().toLowerCase()];
  const email = input.email?.trim() || undefined;

  const attribution: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    // La source du formulaire utilise le camelCase (utmSource) ; le CRM
    // attend exactement ces sept clés en snake_case.
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    const value = input.source[key] ?? input.source[camel];
    if (typeof value === "string" && value.trim()) {
      attribution[key] = value.trim().slice(0, 256);
    }
  }

  const capturedAt = (input.submittedAt ?? new Date()).toISOString();

  return {
    external_booking_id: input.externalRef,
    project_ref: input.projectSlug,
    starts_at: startsAt,
    duration_minutes: DURATION_MINUTES,
    client: {
      first_name: firstName,
      last_name: lastName,
      phone: input.phone,
      ...(email ? { email } : {}),
    },
    ...(input.typology ? { desired_unit_types: [input.typology.slice(0, 80)] } : {}),
    ...(input.note ? { notes: input.note.slice(0, 2000) } : {}),
    // Le canal « email » exige une adresse : sans elle, on n'envoie pas le champ.
    ...(channel && (channel !== "email" || email)
      ? { preferred_contact_channel: channel }
      : {}),
    ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
    privacy_notice: {
      version: PRIVACY_NOTICE_VERSION,
      acknowledged_at: capturedAt,
    },
    marketing_consent: {
      granted: input.marketingConsent,
      version: PRIVACY_NOTICE_VERSION,
      captured_at: capturedAt,
    },
  };
}

/**
 * Transmet la demande. Ne jette jamais : l'échec est une information, pas une
 * panne du formulaire — le repli e-mail prend le relais côté route.
 */
export async function submitBookingToCrm(
  input: BookingSubmission,
): Promise<CrmBookingResult> {
  if (!BASE_URL || !TOKEN) return { status: "skipped" };

  const payload = buildBookingPayload(input);
  if (!payload) {
    return { status: "rejected", code: "payload_invalide" };
  }

  try {
    const response = await fetch(`${BASE_URL.replace(/\/+$/, "")}/v1/bookings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TOKEN}`,
        // Même clé + même contenu à chaque tentative : un rejeu renvoie le
        // même request_id et `replayed: true`, sans créer de doublon.
        "x-idempotency-key": input.idempotencyKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.status === 202) {
      return {
        status: "accepted",
        requestId: String(body.request_id ?? ""),
        replayed: body.replayed === true,
      };
    }
    // 409 (idempotence), 422 (délai de 24 h), 4xx : rejouer ne servirait à rien.
    if (response.status >= 400 && response.status < 500) {
      return { status: "rejected", code: String(body.error ?? `http_${response.status}`) };
    }
    return { status: "unavailable", detail: `http_${response.status}` };
  } catch (error) {
    return { status: "unavailable", detail: String(error).slice(0, 200) };
  }
}
