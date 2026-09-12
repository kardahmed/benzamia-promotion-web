/*
 * Appel réseau vers IMMO PRO-X (POST /site-integration/v1/bookings).
 * La construction du corps et les créneaux vivent dans ./payload.ts.
 *
 * `202 queued_for_review` n'est PAS un rendez-vous : c'est une demande
 * enregistrée, qu'un conseiller confirmera. Le site continue donc d'annoncer
 * « en attente de confirmation » — voir docs/CALENDRIER-IMMOPROX.md.
 */
import { buildBookingPayload, type BookingSubmission } from "./payload";

const BASE_URL = process.env.IMMOPROX_API_BASE_URL || "";
const TOKEN = process.env.IMMOPROX_API_TOKEN || "";

/** Le CRM revalide de son côté ; on ne bloque jamais le visiteur longtemps. */
const TIMEOUT_MS = 5000;

export type CrmBookingResult =
  | { status: "accepted"; requestId: string; replayed: boolean }
  | { status: "rejected"; code: string }
  | { status: "unavailable"; detail: string }
  | { status: "skipped" };

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
