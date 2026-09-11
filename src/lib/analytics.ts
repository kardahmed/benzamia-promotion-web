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

/** Clés déjà poussées par `track()` pendant la visite. */
const pushedKeys = new Set<string>();

/**
 * Pousse un événement dans le dataLayer (no-op côté serveur).
 *
 * Le modèle de données de GTM est persistant : une clé poussée reste lisible
 * par les variables « Version 2 » lors des événements suivants, et les
 * tableaux/objets sont fusionnés index par index au lieu d'être remplacés.
 * Sans remise à zéro, un `scroll_depth` hériterait du `channel`/`phone` d'un
 * clic précédent, et `items` mélangerait deux listes de programmes. On efface
 * donc toutes les clés connues dans un message sans `event` (qui ne déclenche
 * aucune balise), puis on pousse l'événement.
 */
export function track(
  event: AnalyticsEvent,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  if (pushedKeys.size > 0) {
    const reset: Record<string, undefined> = {};
    for (const key of pushedKeys) reset[key] = undefined;
    window.dataLayer.push(reset);
  }
  for (const key of Object.keys(params)) pushedKeys.add(key);
  window.dataLayer.push({ event, ...params });
}
