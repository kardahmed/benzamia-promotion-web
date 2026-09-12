/*
 * Paramètres partagés du tracking avancé — cahier des charges V2 §13.
 *
 * Une seule source de vérité, utilisée à la fois côté navigateur (événement
 * `generate_lead` dans le dataLayer) et côté serveur (GA4 Measurement Protocol
 * + Meta Conversions API), pour que la valeur envoyée soit toujours identique
 * et que la déduplication par `event_id` fonctionne.
 */

/**
 * Devise des montants de conversion. **USD** : la publicité Meta/Google est
 * achetée en dollars, donc raisonner en dollars donne directement le
 * rendement réel (dépensé vs valeur générée), sans dépendre du taux de change.
 */
export const LEAD_CURRENCY = "USD";

/** Type de lead généré par un formulaire public. */
export type LeadType = "visit_request" | "contact";

/**
 * Valeur estimée d'un lead, en USD. Ce n'est pas de l'argent encaissé : c'est
 * la contribution moyenne attendue à la marge, d'après le tunnel commercial
 * mesuré par l'équipe (septembre 2026) :
 *
 *   1 200 leads → 150 visites réalisées → 1 vente, marge 20 000 USD
 *   → un lead vaut 20 000 / 1 200 = 16,67 USD
 *
 * Les deux formulaires alimentent le même vivier de prospects et aucun taux
 * de passage distinct n'est encore mesuré : ils portent donc la même valeur.
 * La valeur d'une visite RÉELLEMENT effectuée (20 000 / 150 = 133,33 USD) et
 * la marge d'une vente appartiennent aux événements hors ligne — voir
 * OFFLINE_VALUE — et non au formulaire, qui n'est qu'une demande.
 *
 * À réévaluer dès qu'il y a plusieurs ventes : le ratio actuel repose sur une.
 */
export const LEAD_VALUE: Record<LeadType, number> = {
  visit_request: 16.67,
  contact: 16.67,
};

/**
 * Valeurs des conversions HORS LIGNE, en USD (téléversées dans Meta ou
 * envoyées par le CRM) : elles ne se déclenchent jamais depuis le site, car
 * elles supposent un fait constaté par l'équipe commerciale.
 */
export const OFFLINE_VALUE = {
  /** Visite effectivement réalisée au bureau de vente (20 000 / 150). */
  visit_completed: 133.33,
  /** Marge attendue sur un appartement vendu — pas le prix de vente. */
  sale_margin: 20000,
} as const;

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
