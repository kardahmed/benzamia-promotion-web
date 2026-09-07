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
  hours: "Samedi – jeudi, 9h – 17h",
  signature: "Bâtir haut, tenir parole.",
} as const;

/** Numéro au format lien `tel:` (chiffres et « + » uniquement). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
