/*
 * Paramètres partagés du tracking avancé — cahier des charges V2 §13.
 *
 * Une seule source de vérité, utilisée à la fois côté navigateur (événement
 * `generate_lead` dans le dataLayer) et côté serveur (GA4 Measurement Protocol
 * + Meta Conversions API), pour que la valeur envoyée soit toujours identique
 * et que la déduplication par `event_id` fonctionne.
 */

/** Devise des montants de conversion (dinar algérien). */
export const LEAD_CURRENCY = "DZD";

/** Type de lead généré par un formulaire public. */
export type LeadType = "visit_request" | "contact";

/**
 * Valeur estimée d'un lead, en DZD. Ce n'est pas un chiffre d'affaires : c'est
 * un poids relatif pour comparer les canaux dans GA4 / Meta (une demande de
 * visite pèse plus qu'un simple message). À ajuster avec l'équipe commerciale.
 */
export const LEAD_VALUE: Record<LeadType, number> = {
  visit_request: 5000,
  contact: 1500,
};

/** Nom d'événement Meta correspondant (standard « Lead »). */
export const META_EVENT_BY_LEAD: Record<LeadType, string> = {
  visit_request: "Lead",
  contact: "Lead",
};

/** Représentation « article » GA4 d'une résidence (view_item / select_item). */
export function projectItem(slug: string, name: string, index?: number) {
  return {
    item_id: slug,
    item_name: name,
    item_category: "residence",
    item_brand: "BENZAMIA Promotion",
    ...(typeof index === "number" ? { index } : {}),
  };
}
