/* Navigation, coordonnées et pied de page — cahier des charges V2 §5 & §12. */

export const routes = {
  home: "/",
  projets: "/projets",
  visiteVirtuelle: "/visite-virtuelle",
  reserver: "/reserver-une-visite",
  investir: "/investir",
  conseils: "/conseils",
  benzamia: "/benzamia",
  contact: "/contact",
  mentionsLegales: "/mentions-legales",
  confidentialite: "/politique-de-confidentialite",
  cookies: "/politique-de-cookies",
} as const;

export const primaryNav = [
  { label: "Projets", href: routes.projets },
  { label: "Visite virtuelle", href: routes.visiteVirtuelle },
  { label: "Investir à Chlef", href: routes.investir },
  { label: "Conseils", href: routes.conseils },
  { label: "BENZAMIA", href: routes.benzamia },
  { label: "Contact", href: routes.contact },
] as const;

export const bookingCta = { label: "Réserver une visite", href: routes.reserver };

export const legalNav = [
  { label: "Mentions légales", href: routes.mentionsLegales },
  { label: "Politique de confidentialité", href: routes.confidentialite },
  { label: "Politique de cookies", href: routes.cookies },
] as const;

export const contact = {
  company: "BENZAMIA Promotion",
  since: 2013,
  email: "contact@benzamiapromotion.com",
  phones: ["+213 561 73 97 62", "+213 560 43 92 22", "+213 560 50 64 39"],
  city: "Chlef, Algérie",
  /** Siège & lieu de toutes les visites : le bureau de vente, jamais le chantier. */
  salesOffice: "Résidence La Cité, Chlef",
  hours: "Samedi – jeudi, 9h – 17h",
  signature: "Bâtir haut, tenir parole.",
  /** Fiche Google Maps « Benzamia promotion - la résidence la cité ». */
  map: {
    lat: 36.1625357,
    lng: 1.3257277,
    link: "https://maps.app.goo.gl/bW4BqUv9xwQLhTFa7",
    /** Embed « Partager > Intégrer une carte » (sans clé API, n'expire pas). */
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3951.9737504853265!2d1.3249629970864905!3d36.16303999307056!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12840f0043b51e5d%3A0x4caabb4379eb68f3!2sBenzamia%20promotion%20-%20la%20r%C3%A9sidence%20la%20cit%C3%A9!5e0!3m2!1sfr!2sdz!4v1747880381750!5m2!1sfr!2sdz",
  },
} as const;

/**
 * Visite virtuelle 3DVista (export « BENZAMIA Promotion 360° »).
 * Les fichiers (~120 Mo, 29 000 fichiers) sont hébergés HORS du dépôt :
 * bucket Supabase Storage public ou sous-domaine statique Hostinger
 * (voir docs/VISITE-VIRTUELLE.md). `NEXT_PUBLIC_VIRTUAL_TOUR_URL` doit
 * pointer vers le `index.htm` de la visite. Tant qu'il est vide, la page
 * affiche un état « bientôt disponible ».
 */
const virtualTourUrl = process.env.NEXT_PUBLIC_VIRTUAL_TOUR_URL ?? "";
export const virtualTour = {
  url: virtualTourUrl,
  enabled: virtualTourUrl.length > 0,
} as const;

/** Délai minimum entre une demande et le créneau de visite (heures). */
export const BOOKING_MIN_LEAD_HOURS = 24;

/** Numéro au format lien `tel:` (chiffres et « + » uniquement). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
