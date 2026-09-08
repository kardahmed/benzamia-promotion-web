export type BookingRequest = {
  projectSlug: string;
  requestedAt: string;
  /** Clé stable renvoyée à chaque retry — dédoublonnage. */
  idempotencyKey?: string;
  /** Référence de LA réservation, distincte de toute référence de contact. */
  externalRef?: string;
  /** Nom complet tel que saisi (le CRM IMMO PRO-X utilise `clients.full_name`). */
  fullName: string;
  email?: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  typology?: string;
  preferredChannel?: string;
  note?: string;
  marketingConsent: boolean;
  source: {
    pageUrl: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    gclid?: string;
    fbclid?: string;
  };
};

export type BookingResult =
  | { status: "accepted"; leadId: string; assignedAgentId?: string }
  | { status: "rejected"; reason: string }
  | { status: "retry"; reason: string };

export interface CrmGateway {
  createLead(request: BookingRequest): Promise<BookingResult>;
}
