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
  city: "Chlef, Algérie",
  hours: "Samedi – jeudi, 9h – 17h",
  signature: "Bâtir haut, tenir parole.",
} as const;
