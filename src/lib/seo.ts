/*
 * Helpers SEO centralisés — cahier des charges V2 §14.
 * URL de base, URLs absolues et données structurées schema.org.
 */
import { contact } from "@/content/site";
import type { Project } from "@/content/projects";
import { articles } from "@/content/articles";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://benzamiapromotion.com"
).replace(/\/$/, "");

export const SITE_NAME = "BENZAMIA Promotion";
export const SITE_LOCALE = "fr_DZ";

export const DEFAULT_DESCRIPTION =
  "BENZAMIA Promotion conçoit et livre des résidences à Chlef depuis 2013 : avancement des programmes, typologies, surfaces, plans, visite virtuelle et réservation de visite.";

export const DEFAULT_KEYWORDS = [
  "promotion immobilière Chlef",
  "appartement neuf Chlef",
  "résidence Chlef",
  "acheter appartement Chlef",
  "VEFA Chlef",
  "BENZAMIA Promotion",
];

/** Construit une URL absolue à partir d'un chemin racine ("/projets"). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const ORG_ID = `${SITE_URL}/#organisation`;
const WEBSITE_ID = `${SITE_URL}/#site`;

/** Fiche promoteur — réutilisée comme @id par les autres blocs. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    image: absoluteUrl("/opengraph-image"),
    slogan: contact.signature,
    foundingDate: String(contact.since),
    email: contact.email,
    telephone: contact.phones[0],
    areaServed: { "@type": "City", name: "Chlef", address: { "@type": "PostalAddress", addressCountry: "DZ" } },
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.salesOffice.replace(/,\s*Chlef$/, ""),
      addressLocality: "Chlef",
      addressCountry: "DZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.map.lat,
      longitude: contact.map.lng,
    },
    hasMap: contact.map.link,
    contactPoint: contact.phones.map((telephone) => ({
      "@type": "ContactPoint",
      telephone,
      contactType: "sales",
      areaServed: "DZ",
      availableLanguage: ["fr", "ar"],
    })),
    sameAs: [] as string[],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "fr-DZ",
    publisher: { "@id": ORG_ID },
  };
}

/** Fil d'Ariane. `items` = [{ name, path }] du plus général au plus précis. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function unitCount(project: Project): number | undefined {
  const fact = project.facts.find((f) => /logement/i.test(f.label));
  const match = fact?.value.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

/** Programme immobilier. Ne publie que des faits confirmés (pas les `pending`). */
export function residenceJsonLd(project: Project) {
  const units = unitCount(project);
  return {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: project.name,
    description: project.description,
    url: absoluteUrl(`/projets/${project.slug}`),
    ...(units ? { numberOfAccommodationUnits: units } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: project.location,
      addressCountry: "DZ",
    },
    ...(project.map
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: project.map.lat,
            longitude: project.map.lng,
          },
          hasMap: project.map.link,
        }
      : {}),
    containedInPlace: { "@type": "City", name: "Chlef" },
    provider: { "@id": ORG_ID },
  };
}

export function articleJsonLd(slug: string) {
  const article = articles.find((a) => a.slug === slug);
  if (!article) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    datePublished: article.date,
    dateModified: article.date,
    articleSection: article.category,
    url: absoluteUrl(`/conseils/${article.slug}`),
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

/** FAQ — `items` = [{ question, answer }]. Réservé aux réponses réellement visibles. */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
