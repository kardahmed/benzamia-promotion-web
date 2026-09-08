/*
 * Gestion du consentement — cahier des charges V2 §13.
 * Deux catégories optionnelles : mesure d'audience et marketing. Le
 * « nécessaire » est toujours actif. Par défaut tout est refusé jusqu'au
 * choix explicite du visiteur (Google Consent Mode v2 : default = denied).
 */

export type ConsentCategory = "analytics" | "marketing";
export type ConsentState = Record<ConsentCategory, boolean>;

export const CONSENT_COOKIE = "benzamia_consent";
export const CONSENT_VERSION = 1;
const MAX_AGE_DAYS = 180;

/** Événement navigateur émis à chaque changement de consentement. */
export const CONSENT_EVENT = "benzamia:consent";
/** Événement pour rouvrir le panneau (lien « Gérer les cookies »). */
export const CONSENT_OPEN_EVENT = "benzamia:consent-open";

export const DENIED_ALL: ConsentState = { analytics: false, marketing: false };
export const GRANTED_ALL: ConsentState = { analytics: true, marketing: true };

type StoredConsent = ConsentState & { v: number };

export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as StoredConsent;
    if (parsed.v !== CONSENT_VERSION) return null;
    return { analytics: !!parsed.analytics, marketing: !!parsed.marketing };
  } catch {
    return null;
  }
}

export function writeConsent(state: ConsentState): void {
  if (typeof document === "undefined") return;
  const value: StoredConsent = { ...state, v: CONSENT_VERSION };
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(value),
  )}; path=/; max-age=${maxAge}; samesite=lax`;
  applyConsent(state);
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
}

/** Traduit le choix vers Google Consent Mode v2 + journalise dans le dataLayer. */
export function applyConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  // gtag() n'est qu'un alias de dataLayer.push : on garde exactement la
  // signature attendue par Consent Mode (arguments, pas un tableau).
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args as unknown as Record<string, unknown>);
  }
  gtag("consent", "update", {
    analytics_storage: state.analytics ? "granted" : "denied",
    ad_storage: state.marketing ? "granted" : "denied",
    ad_user_data: state.marketing ? "granted" : "denied",
    ad_personalization: state.marketing ? "granted" : "denied",
  });
  window.dataLayer.push({
    event: "consent_update",
    consent_analytics: state.analytics,
    consent_marketing: state.marketing,
  });
}
