/**
 * Version du texte d'information affiché au visiteur. À incrémenter quand la
 * politique de confidentialité change : le CRM conserve cette version comme
 * preuve de ce qui a été montré, pas seulement la date.
 */
export const PRIVACY_NOTICE_VERSION = "2026-09-v1";

export type BookingSubmission = {
  durationMinutes: number;
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

/** Exact local slot label, in Algeria (UTC+1), never a half-day. */
export function slotToUtcStart(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const day = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== date) return null;
  const [hour, minute] = time.split(':').map(Number);
  return new Date(day + (hour - 1) * 3600000 + minute * 60000).toISOString();
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
  if (!startsAt || !Number.isInteger(input.durationMinutes) || input.durationMinutes < 15 || input.durationMinutes > 480) return null;

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
    duration_minutes: input.durationMinutes,
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

