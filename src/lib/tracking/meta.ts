/*
 * Événements Meta (Pixel navigateur) — complément de la Conversions API
 * côté serveur (voir ./server.ts).
 *
 * `fbq` n'existe que si le visiteur a accepté les cookies marketing et si
 * `NEXT_PUBLIC_META_PIXEL_ID` est défini : sans cela ces appels ne font rien.
 * Pour les leads, on passe le MÊME `eventId` que l'envoi serveur : Meta
 * reconnaît alors un seul et même événement (déduplication) au lieu de le
 * compter deux fois.
 */

/** Événements standards Meta utilisés par le site. */
export type MetaEvent = "ViewContent" | "Search" | "Contact" | "Schedule" | "Lead";

export function metaTrack(
  event: MetaEvent,
  params: Record<string, unknown> = {},
  eventId?: string,
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, params, eventId ? { eventID: eventId } : undefined);
}

/** Fiche résidence au format « contenu » Meta. */
export function metaResidence(slug: string, name: string) {
  return {
    content_ids: [slug],
    content_name: name,
    content_type: "product",
    content_category: "residence",
  };
}
