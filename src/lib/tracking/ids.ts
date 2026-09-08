/*
 * Identifiants de stitching navigateur ↔ serveur — cahier des charges V2 §13.
 *
 * Le navigateur envoie un `event_id` unique + le `client_id` GA4 + les cookies
 * Meta (`_fbp` / `_fbc`) au moment de l'envoi d'un formulaire. Le serveur rejoue
 * alors le même événement vers GA4 et Meta avec ces identifiants : les deux hits
 * (client et serveur) sont fusionnés au lieu d'être comptés deux fois.
 */

export type LeadAnalyticsContext = {
  /** UUID commun aux hits client et serveur (déduplication). */
  eventId: string;
  /** `client_id` GA4 lu dans le cookie `_ga`. */
  clientId?: string;
  /** Cookie navigateur Meta (`_fbp`). */
  fbp?: string;
  /** Cookie navigateur Meta (`_fbc`), ou reconstruit depuis `?fbclid=`. */
  fbc?: string;
  /** URL de la page d'où part la conversion. */
  pageUrl?: string;
};

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** UUID v4 (avec repli si `crypto.randomUUID` indisponible). */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/**
 * `client_id` GA4 : le cookie `_ga` vaut `GA1.1.1234567890.1700000000` ;
 * le `client_id` est `1234567890.1700000000`.
 */
export function getGaClientId(): string | undefined {
  const raw = cookie("_ga");
  if (!raw) return undefined;
  const parts = raw.split(".");
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : undefined;
}

/** `_fbc` : soit le cookie posé par le pixel, soit reconstruit depuis `?fbclid=`. */
function getFbc(): string | undefined {
  const existing = cookie("_fbc");
  if (existing) return existing;
  if (typeof window === "undefined") return undefined;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

/** Contexte complet à joindre au corps d'une requête de formulaire. */
export function collectLeadContext(eventId: string): LeadAnalyticsContext {
  return {
    eventId,
    clientId: getGaClientId(),
    fbp: cookie("_fbp"),
    fbc: getFbc(),
    pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
  };
}
