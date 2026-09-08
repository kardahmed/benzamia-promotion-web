/* Navigation, coordonnées et pied de page — cahier des charges V2 §5 & §12. */

/** Fiche Google Maps d'un lieu (embed sans clé API + lien court « Itinéraire »). */
export type MapPlace = {
  lat: number;
  lng: number;
  /** Lien court maps.app.goo.gl pour « Itinéraire ». */
  link: string;
  /** Src de l'iframe « Partager > Intégrer une carte » (sans clé, n'expire pas). */
  embedSrc: string;
};

export const routes = {
  home: "/",
  projets: "/projets",
  visiteVirtuelle: "/visite-virtuelle",
  reserver: "/reserver-une-visite",
  investir: "/investir",
  conseils: "/conseils",
  /** Ancre vers la section « BENZAMIA » de l'accueil (plus de page dédiée). */
  benzamia: "/#benzamia",
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
  /** Fiche Google Maps « Benzamia promotion - la résidence la cité » (= le siège). */
  map: {
    lat: 36.1625357,
    lng: 1.3257277,
    link: "https://maps.app.goo.gl/bW4BqUv9xwQLhTFa7",
    embedSrc:
      "https://maps.google.com/maps?q=36.1625357,1.3257277&z=16&hl=fr&output=embed",
  } satisfies MapPlace,
} as const;

/**
 * Visite virtuelle 3DVista (export « BENZAMIA Promotion 360° »).
 * Les ~28 000 fichiers sont hébergés HORS du dépôt applicatif — voir
 * docs/VISITE-VIRTUELLE.md. Hébergement actuel : GitHub Pages
 * (dépôt kardahmed/benzamia-360). `NEXT_PUBLIC_VIRTUAL_TOUR_URL` permet de
 * basculer vers un autre hôte (ex. sous-domaine Hostinger) sans redéployer
 * le code. Mettre la variable à `off` force l'état « bientôt disponible ».
 */
const VIRTUAL_TOUR_DEFAULT = "https://kardahmed.github.io/benzamia-360/index.htm";
const virtualTourEnv = process.env.NEXT_PUBLIC_VIRTUAL_TOUR_URL ?? "";
const virtualTourUrl =
  virtualTourEnv === "off"
    ? ""
    : virtualTourEnv || VIRTUAL_TOUR_DEFAULT;
export const virtualTour = {
  url: virtualTourUrl,
  enabled: virtualTourUrl.length > 0,
} as const;

/** Délai minimum entre une demande et le créneau de visite (heures). */
export const BOOKING_MIN_LEAD_HOURS = 24;

/** Numéro au format lien `tel:` (chiffres et « + » uniquement). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
