/*
 * Mesure côté serveur — cahier des charges V2 §13.
 *
 * Rejoue l'événement `generate_lead` depuis les routes API, indépendamment du
 * navigateur : immunisé contre les bloqueurs de publicité, Safari/ITP et la
 * perte de tags. La déduplication avec le hit client se fait par `event_id`
 * (GA4) et `event_id` (Meta).
 *
 *   GA4  : Measurement Protocol      → GA4_MEASUREMENT_ID + GA4_API_SECRET
 *   Meta : Conversions API (Graph)   → META_PIXEL_ID + META_CAPI_TOKEN
 *
 * Tant que les secrets ne sont pas renseignés, les fonctions sont inertes
 * (aucun appel réseau). Aucune exception n'est propagée : la mesure ne doit
 * jamais faire échouer un envoi de formulaire.
 */
import { createHash } from "node:crypto";
import { LEAD_CURRENCY, LEAD_VALUE, META_EVENT_BY_LEAD, type LeadType } from "./config";

const GA4_MEASUREMENT_ID =
  process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-DS3H6KY8CF";
const GA4_API_SECRET = process.env.GA4_API_SECRET || "";
const GA4_DEBUG = process.env.GA4_DEBUG === "1";

const META_PIXEL_ID =
  process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || "";
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";
const META_API_VERSION = "v21.0";

const NET_TIMEOUT_MS = 2500;

export type ServerLeadInput = {
  leadType: LeadType;
  /** UUID partagé avec le hit navigateur (déduplication). */
  eventId: string;
  /** `client_id` GA4 transmis par le navigateur. */
  clientId?: string;
  /** Données visiteur en clair — hachées avant tout envoi. */
  email?: string;
  phone?: string;
  fullName?: string;
  /** Cookies / contexte Meta. */
  fbp?: string;
  fbc?: string;
  /** Requête entrante : pour l'IP, le User-Agent et l'URL source. */
  pageUrl?: string;
  userAgent?: string;
  ip?: string;
  /** Paramètres métier repris dans les deux plateformes. */
  projectSlug?: string;
  leadSource?: string;
};

/** SHA-256 hex d'une valeur normalisée (spec Meta Advanced Matching). */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashEmail(email?: string): string | undefined {
  const v = email?.trim().toLowerCase();
  return v ? sha256(v) : undefined;
}

/** Téléphone : chiffres uniquement, indicatif pays inclus (défaut Algérie 213). */
function hashPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `213${digits.slice(1)}`;
  return sha256(digits);
}

function hashName(part?: string): string | undefined {
  const v = part?.trim().toLowerCase().replace(/\s+/g, " ");
  return v ? sha256(v) : undefined;
}

async function postJson(url: string, body: unknown): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(NET_TIMEOUT_MS),
  });
}

// ── GA4 Measurement Protocol ────────────────────────────────────────────────

async function sendGa4Lead(input: ServerLeadInput): Promise<"sent" | "skipped" | "error"> {
  if (!GA4_API_SECRET || !GA4_MEASUREMENT_ID) return "skipped";
  // Sans client_id fiable, on en fabrique un déterministe à partir de l'event_id
  // (le hit restera rattaché à la session serveur, pas à la session navigateur).
  const clientId =
    input.clientId ||
    `${parseInt(input.eventId.replace(/[^0-9a-f]/gi, "").slice(0, 8) || "0", 16)}.${Math.floor(
      Date.now() / 1000,
    )}`;

  const endpoint = GA4_DEBUG
    ? "https://www.google-analytics.com/debug/mp/collect"
    : "https://www.google-analytics.com/mp/collect";

  try {
    await postJson(
      `${endpoint}?measurement_id=${encodeURIComponent(
        GA4_MEASUREMENT_ID,
      )}&api_secret=${encodeURIComponent(GA4_API_SECRET)}`,
      {
        client_id: clientId,
        non_personalized_ads: false,
        events: [
          {
            name: "generate_lead",
            params: {
              // Déduplication avec l'événement navigateur du même nom.
              event_id: input.eventId,
              currency: LEAD_CURRENCY,
              value: LEAD_VALUE[input.leadType],
              lead_type: input.leadType,
              lead_source: input.leadSource ?? "site",
              project: input.projectSlug ?? "(non applicable)",
              transport: "server",
              engagement_time_msec: 1,
            },
          },
        ],
      },
    );
    return "sent";
  } catch {
    return "error";
  }
}

// ── Meta Conversions API ────────────────────────────────────────────────────

async function sendMetaLead(input: ServerLeadInput): Promise<"sent" | "skipped" | "error"> {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return "skipped";

  const [firstName, ...rest] = (input.fullName ?? "").trim().split(/\s+/);
  const lastName = rest.join(" ");

  const userData: Record<string, unknown> = {};
  const em = hashEmail(input.email);
  const ph = hashPhone(input.phone);
  const fn = hashName(firstName);
  const ln = hashName(lastName);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (fn) userData.fn = [fn];
  if (ln) userData.ln = [ln];
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.ip) userData.client_ip_address = input.ip;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: META_EVENT_BY_LEAD[input.leadType],
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.pageUrl ? { event_source_url: input.pageUrl } : {}),
        user_data: userData,
        custom_data: {
          currency: LEAD_CURRENCY,
          value: LEAD_VALUE[input.leadType],
          lead_type: input.leadType,
          content_category: input.projectSlug ?? "contact",
        },
      },
    ],
    ...(META_TEST_EVENT_CODE ? { test_event_code: META_TEST_EVENT_CODE } : {}),
  };

  try {
    await postJson(
      `https://graph.facebook.com/${META_API_VERSION}/${encodeURIComponent(
        META_PIXEL_ID,
      )}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN)}`,
      body,
    );
    return "sent";
  } catch {
    return "error";
  }
}

// ── Point d'entrée ──────────────────────────────────────────────────────────

/**
 * Envoie le lead vers GA4 et Meta en parallèle. Ne rejette jamais : à appeler
 * en « fire and forget » depuis une route API (`void sendServerLead(...)`).
 */
export async function sendServerLead(
  input: ServerLeadInput,
): Promise<{ ga4: string; meta: string }> {
  const [ga4, meta] = await Promise.all([
    sendGa4Lead(input).catch(() => "error"),
    sendMetaLead(input).catch(() => "error"),
  ]);
  return { ga4, meta };
}

/** Extrait IP + User-Agent d'une requête entrante (repli Hostinger / proxy). */
export function requestClientInfo(request: Request): { ip?: string; userAgent?: string } {
  const h = request.headers;
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    forwarded ||
    h.get("x-real-ip")?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    undefined;
  return { ip, userAgent: h.get("user-agent") ?? undefined };
}
