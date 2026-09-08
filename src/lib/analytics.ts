/*
 * Couche de mesure — cahier des charges V2 §13.
 * On pousse des événements dans `dataLayer` ; Google Tag Manager les relaie
 * vers GA4 et Meta selon le consentement (voir docs/TRACKING.md et
 * docs/TRACKING-AVANCE.md).
 * Aucun identifiant secret ici : GTM et Pixel sont publics par nature.
 */

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-K22BDCXQ";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

/**
 * Plan de marquage (CDC §13). Deux familles :
 *  - événements « historiques » du CDC, conservés pour ne pas casser les
 *    balises GTM déjà en place ;
 *  - événements normalisés GA4 (view_item / select_item…) + entonnoir de
 *    formulaire + engagement, ajoutés par le tracking avancé.
 */
export type AnalyticsEvent =
  // — historiques CDC —
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
  | "generate_lead"
  // — normalisés GA4 : parcours programme —
  | "view_item_list"
  | "view_item"
  | "select_item"
  // — engagement —
  | "scroll_depth"
  | "outbound_click"
  | "file_download"
  | "contact_channel_click"
  | "virtual_tour_engaged"
  | "virtual_tour_room"
  // — entonnoir formulaire —
  | "form_start"
  | "form_submit"
  | "form_error"
  | "form_abandon";

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
