/*
 * Créneaux, conversions et corps de la demande envoyée à IMMO PRO-X.
 *
 * Ce module est volontairement SANS IMPORT : il est chargé aussi bien par le
 * formulaire (navigateur) que par la route serveur et par les tests, qui
 * s'exécutent sous Node sans résolution d'alias.
 *
 * Source de vérité des horaires : la configuration du tenant dans IMMO PRO-X.
 * Ce qui suit n'en est qu'un miroir, le temps que le site interroge
 * `GET /v1/availability` et affiche les créneaux réellement libres.
 *
 * Réglage Benzamia constaté dans le CRM le 2026-09-12 : ouverture 09:00–17:00,
 * pause 12:00–14:00, visites de 30 minutes, bureau fermé le vendredi. D'où un
 * après-midi qui commence à 14 h : un créneau à 13 h aurait été refusé au
 * traitement, après avoir fait espérer le visiteur.
 */

/** Heure d'Alger : UTC+1 toute l'année, pas d'heure d'été. */
export const ALGIERS_UTC_OFFSET_H = 1;

/** Durée d'un rendez-vous, en minutes (réglage du tenant). */
export const VISIT_DURATION_MINUTES = 30;

export type BookingSlot = { label: string; startHour: number };

export const BOOKING_SLOTS: BookingSlot[] = [
  { label: "Matin (9h – 12h)", startHour: 9 },
  { label: "Après-midi (14h – 17h)", startHour: 14 },
];

/** Jour de fermeture hebdomadaire (0 = dimanche … 5 = vendredi). */
export const CLOSED_WEEKDAY = 5;

export function isClosedDay(date: string): boolean {
  const d = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.getUTCDay() === CLOSED_WEEKDAY;
}

export function findSlot(label: string): BookingSlot | undefined {
  return BOOKING_SLOTS.find((s) => s.label === label.trim());
}

/**
 * Version du texte d'information affiché au visiteur. À incrémenter quand la
 * politique de confidentialité change : le CRM conserve cette version comme
 * preuve de ce qui a été montré, pas seulement la date.
 */
export const PRIVACY_NOTICE_VERSION = "2026-09-v1";

/** Durée envoyée au CRM (contrat : 15 à 480 minutes). */
const DURATION_MINUTES = VISIT_DURATION_MINUTES;

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
  const slot = findSlot(preferredTime);
  if (!slot || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return null;
  const hour = slot.startHour - ALGIERS_UTC_OFFSET_H;
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

