/*
 * Couche de mesure — cahier des charges V2 §13.
 * On pousse des événements dans `dataLayer` ; Google Tag Manager les relaie
 * vers GA4, Google Ads et Meta selon le consentement (voir docs/TRACKING.md).
 * Aucun identifiant secret ici : GTM et Pixel sont publics par nature.
 */

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-K22BDCXQ";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

/** Événements du plan de marquage (CDC §13). */
export type AnalyticsEvent =
  | "view_project"
  | "filter_projects"
  | "open_plan"
  | "download_brochure"
  | "start_virtual_tour"
  | "click_phone"
  | "click_whatsapp"
  | "begin_booking"
  | "select_slot"
  | "submit_booking"
  | "submit_contact"
  | "generate_lead";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

/** Pousse un événement dans le dataLayer (no-op côté serveur). */
export function track(
  event: AnalyticsEvent,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}
