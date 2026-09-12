/*
 * Vérification des webhooks IMMO PRO-X.
 *
 * Contrat de signature fourni par l'équipe CRM (HMAC-SHA256) :
 *
 *   v1\n<integration_id>\n<event_id>\n<key_id>\n<timestamp>\n + corps brut
 *
 * Trois protections, toutes nécessaires :
 *  - la signature prouve l'origine (secret partagé, jamais exposé au client) ;
 *  - la fenêtre temporelle (300 s) limite le rejeu d'une requête interceptée ;
 *  - la déduplication par `event_id` en base (voir crm_events) empêche qu'un
 *    même événement soit compté deux fois — c'est elle qui protège vraiment,
 *    la fenêtre ne faisant que réduire la surface.
 *
 * Deux secrets peuvent être actifs en parallèle (`key_id`) pour permettre une
 * rotation sans coupure.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Fenêtre d'acceptation de l'horodatage, en secondes (contrat CRM). */
export const SIGNATURE_WINDOW_S = 300;

export type WebhookHeaders = {
  integrationId?: string | null;
  eventId?: string | null;
  keyId?: string | null;
  timestamp?: string | null;
  signature?: string | null;
};

export type VerifyResult =
  | { ok: true; integrationId: string; eventId: string }
  | { ok: false; status: 400 | 401 | 503; reason: string };

/** Secrets connus, indexés par `key_id`. Vide = intégration non configurée. */
function secrets(): Map<string, string> {
  const map = new Map<string, string>();
  const add = (keyId?: string, secret?: string) => {
    if (keyId && secret) map.set(keyId, secret);
  };
  add(process.env.IMMOPROX_WEBHOOK_KEY_ID, process.env.IMMOPROX_WEBHOOK_SECRET);
  // Clé de remplacement pendant une rotation : les deux sont acceptées.
  add(
    process.env.IMMOPROX_WEBHOOK_KEY_ID_NEXT,
    process.env.IMMOPROX_WEBHOOK_SECRET_NEXT,
  );
  return map;
}

export function signaturePayload(
  h: { integrationId: string; eventId: string; keyId: string; timestamp: string },
  rawBody: string,
): string {
  return `v1\n${h.integrationId}\n${h.eventId}\n${h.keyId}\n${h.timestamp}\n${rawBody}`;
}

/**
 * L'en-tête envoyé par IMMO PRO-X est préfixé par la version du schéma :
 * `v1=<hex minuscule>`. On accepte aussi le hex nu, pour ne pas dépendre d'un
 * détail de format côté émetteur.
 */
export function normalizeSignature(header: string): string {
  const value = header.trim();
  const prefixed = /^v1=/i.exec(value);
  return (prefixed ? value.slice(3) : value).toLowerCase();
}

/**
 * IMMO PRO-X distribue le secret en hexadécimal : il faut signer avec les
 * octets qu'il représente, pas avec la chaîne elle-même. Utiliser la chaîne
 * donnerait une signature valide en apparence mais différente de la leur, donc
 * un 401 sur chaque événement.
 *
 * Un secret qui n'est pas de l'hexadécimal est utilisé tel quel : ça évite de
 * dépendre du format d'un futur émetteur.
 */
export function secretKey(secret: string): Buffer {
  const hex = /^[0-9a-fA-F]+$/.test(secret) && secret.length % 2 === 0;
  return hex ? Buffer.from(secret, "hex") : Buffer.from(secret, "utf8");
}

export function computeSignature(secret: string, payload: string): string {
  return createHmac("sha256", secretKey(secret)).update(payload).digest("hex");
}

function equals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual exige la même longueur : on compare d'abord, sans fuite
  // d'information utile (la longueur d'une signature est publique).
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function verifyWebhook(
  headers: WebhookHeaders,
  rawBody: string,
  nowMs: number = Date.now(),
): VerifyResult {
  const { integrationId, eventId, keyId, timestamp, signature } = headers;
  if (!integrationId || !eventId || !keyId || !timestamp || !signature) {
    return { ok: false, status: 400, reason: "en-têtes de signature incomplets" };
  }

  const known = secrets();
  if (known.size === 0) {
    // Intégration pas encore fournie par IMMO PRO-X : on refuse explicitement
    // plutôt que d'accepter un événement non vérifié.
    return { ok: false, status: 503, reason: "intégration non configurée" };
  }

  const expectedIntegration = process.env.IMMOPROX_INTEGRATION_ID;
  if (expectedIntegration && integrationId !== expectedIntegration) {
    return { ok: false, status: 401, reason: "intégration inconnue" };
  }

  const secret = known.get(keyId);
  if (!secret) return { ok: false, status: 401, reason: "clé de signature inconnue" };

  const sent = Number(timestamp);
  if (!Number.isFinite(sent)) {
    return { ok: false, status: 400, reason: "horodatage invalide" };
  }
  // Le timestamp du contrat est en secondes.
  if (Math.abs(nowMs / 1000 - sent) > SIGNATURE_WINDOW_S) {
    return { ok: false, status: 401, reason: "horodatage hors fenêtre" };
  }

  const expected = computeSignature(
    secret,
    signaturePayload({ integrationId, eventId, keyId, timestamp }, rawBody),
  );
  if (!equals(expected, normalizeSignature(signature))) {
    return { ok: false, status: 401, reason: "signature invalide" };
  }

  return { ok: true, integrationId, eventId };
}
