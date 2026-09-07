/*
 * Navigation, coordonnées et pied de page — cahier des charges V2 §5 & §12.
 * Les href pointent pour l'instant vers les ancres de la homepage ; ils
 * basculeront vers les routes dédiées (/projets, /visite-virtuelle, …) au
 * fur et à mesure de la création des pages.
 */

export const primaryNav = [
  { label: "Projets", href: "/#projets" },
  { label: "Visite virtuelle", href: "/#visite-virtuelle" },
  { label: "Investir à Chlef", href: "/#investir" },
  { label: "Conseils", href: "/#conseils" },
  { label: "BENZAMIA", href: "/#benzamia" },
  { label: "Contact", href: "/#contact" },
] as const;

export const bookingCta = { label: "Réserver une visite", href: "/#reservation" };

export const legalNav = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Politique de confidentialité", href: "/politique-de-confidentialite" },
  { label: "Politique de cookies", href: "/politique-de-cookies" },
] as const;

export const contact = {
  company: "BENZAMIA Promotion",
  since: 2013,
  email: "contact@benzamiapromotion.com",
  city: "Chlef, Algérie",
  hours: "Samedi – jeudi, 9h – 17h",
  signature: "Bâtir haut, tenir parole.",
} as const;
