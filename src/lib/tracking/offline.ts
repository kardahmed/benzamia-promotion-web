/*
 * Conversions HORS LIGNE vers Meta (Conversions API).
 *
 * Différence avec ./server.ts : ces événements ne viennent pas d'une action
 * sur le site mais d'un fait constaté par l'équipe commerciale, remonté par le
 * CRM — une visite réellement effectuée au bureau de vente, une vente signée.
 * C'est ce qui donne à Meta la variation de valeur dont il a besoin : un lead
 * vaut 16,67 $, une visite réalisée 135 $, une vente sa marge.
 *
 * Les coordonnées (téléphone, e-mail) ne transitent PAS par le CRM : elles
 * viennent de notre propre base, celle du formulaire que le visiteur a rempli.
 * Meta ne reçoit que des empreintes SHA-256, jamais les valeurs en clair.
 */
import { OFFLINE_VALUE } from "./config";
import { hashEmail, hashName, hashPhone, postJson, META_API_VERSION } from "./server";

const META_PIXEL_ID =
  process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || "";
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";

/** Événements hors ligne envoyés à Meta, avec leur valeur par défaut (USD). */
export const OFFLINE_EVENTS = {
  visit_completed: { name: "VisiteEffectuee", value: OFFLINE_VALUE.visit_completed },
  sale: { name: "Purchase", value: OFFLINE_VALUE.sale_margin },
} as const;

export type OfflineConversionInput = {
  kind: keyof typeof OFFLINE_EVENTS;
  /** Identifiant stable de l'opération — déduplication côté Meta. */
  eventId: string;
  /** Date du fait constaté (pas celle de l'envoi). */
  eventTime: Date;
  phone?: string;
  email?: string;
  fullName?: string;
  projectSlug?: string;
  /** Remplace la valeur par défaut (ex. marge réelle d'une vente). */
  value?: number;
};

export async function sendOfflineConversion(
  input: OfflineConversionInput,
): Promise<"sent" | "skipped" | "error"> {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return "skipped";

  const event = OFFLINE_EVENTS[input.kind];
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

  // Sans au moins une coordonnée, Meta ne peut rattacher la conversion à
  // personne : inutile d'envoyer, et ça fausserait le taux de correspondance.
  if (!em && !ph) return "skipped";

  try {
    await postJson(
      `https://graph.facebook.com/${META_API_VERSION}/${encodeURIComponent(
        META_PIXEL_ID,
      )}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN)}`,
      {
        data: [
          {
            event_name: event.name,
            event_time: Math.floor(input.eventTime.getTime() / 1000),
            event_id: input.eventId,
            // Le fait s'est produit au bureau de vente, pas sur le site.
            action_source: "physical_store",
            user_data: userData,
            custom_data: {
              currency: "USD",
              value: input.value ?? event.value,
              ...(input.projectSlug ? { content_category: input.projectSlug } : {}),
            },
          },
        ],
        ...(META_TEST_EVENT_CODE ? { test_event_code: META_TEST_EVENT_CODE } : {}),
      },
    );
    return "sent";
  } catch (error) {
    console.error("[tracking] conversion hors ligne échouée :", String(error));
    return "error";
  }
}
