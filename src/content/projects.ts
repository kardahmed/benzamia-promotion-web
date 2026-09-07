/*
 * Catalogue des programmes — cahier des charges V2 §7.
 * Données confirmées uniquement ; les champs « à confirmer » sont marqués
 * `pending: true` et ne doivent pas être publiés tels quels.
 */

import type { MapPlace } from "./site";

export type ProjectStatus = "Nouveau projet" | "En construction" | "Terminé";

export type ProjectFeature = { label: string; pending?: boolean };

export type ProjectImage = { src: string; alt: string; width: number; height: number };

export type Project = {
  slug: string;
  name: string;
  status: ProjectStatus;
  location: string;
  intro: string;
  description: string;
  facts: { label: string; value: string }[];
  typologies: string[];
  features: ProjectFeature[];
  /** Rendu de présentation, hébergé dans `public/projets/<slug>/`. */
  cover?: ProjectImage;
  /** Fiche Google Maps de la résidence. */
  map?: MapPlace;
  /** Une visite virtuelle 3DVista couvre ce programme (appartements témoins). */
  hasVirtualTour?: boolean;
  /** Nombre de vignettes de galerie provisoires à afficher (fallback sans photo). */
  gallery: number;
};

export const projects: Project[] = [
  {
    slug: "residence-la-cite",
    name: "Résidence La Cité",
    status: "En construction",
    location: "Chlef",
    intro:
      "148 appartements répartis sur quatre blocs, du F2 au duplex, dans un ensemble sécurisé avec commerces et stationnement.",
    description:
      "La Résidence La Cité regroupe 148 appartements répartis sur quatre blocs, avec des configurations F2, F3, F4 et duplex. L’ensemble prévoit un parking, un centre commercial en pied d’immeuble, une sécurité permanente et des jardins privatifs pour certains logements du rez-de-chaussée.",
    facts: [
      { label: "Logements", value: "148 appartements" },
      { label: "Blocs", value: "4 blocs" },
      { label: "Typologies", value: "F2 · F3 · F4 · Duplex" },
      { label: "Statut", value: "En construction" },
    ],
    typologies: ["F2", "F3", "F4", "Duplex"],
    features: [
      { label: "Parking" },
      { label: "Centre commercial en pied d’immeuble" },
      { label: "Sécurité permanente" },
      { label: "Jardins privatifs pour certains logements du rez-de-chaussée" },
      { label: "Chauffage central" },
      { label: "Fibre optique" },
      { label: "Visiophone" },
      { label: "Double ascenseur par bloc" },
    ],
    map: {
      lat: 36.1625357,
      lng: 1.3257277,
      link: "https://maps.app.goo.gl/bW4BqUv9xwQLhTFa7",
      embedSrc:
        "https://maps.google.com/maps?q=36.1625357,1.3257277&z=16&hl=fr&output=embed",
    },
    hasVirtualTour: true,
    gallery: 4,
  },
  {
    slug: "residence-azhar-ii",
    name: "Résidence Azhar II",
    status: "En construction",
    location: "Ouled Mohamed, Chlef",
    intro:
      "44 appartements F4 sur deux blocs R+7 à Ouled Mohamed, pensés pour le confort et la sécurité des résidents.",
    cover: {
      src: "/projets/residence-azhar-ii/cover.jpg",
      alt: "Façade de la Résidence Azhar II à Ouled Mohamed, Chlef, avec commerces en rez-de-chaussée",
      width: 1672,
      height: 941,
    },
    description:
      "La Résidence Azhar II est composée de 44 appartements F4 répartis sur deux blocs R+7 à Ouled Mohamed. Les logements proposent différentes surfaces et disposent d’équipements pensés pour le confort et la sécurité des résidents.",
    facts: [
      { label: "Logements", value: "44 appartements" },
      { label: "Blocs", value: "2 blocs R+7" },
      { label: "Typologies", value: "F4" },
      { label: "Statut", value: "En construction" },
    ],
    typologies: ["F4"],
    features: [
      { label: "Blocs R+7" },
      { label: "Différentes surfaces disponibles", pending: true },
      { label: "Plans détaillés", pending: true },
      { label: "Équipements de confort et de sécurité", pending: true },
      { label: "Disponibilités et avancement", pending: true },
    ],
    map: {
      lat: 36.168103,
      lng: 1.3550398,
      link: "https://maps.app.goo.gl/DkYAQEzhQxN9Cpg8A",
      embedSrc:
        "https://maps.google.com/maps?q=36.168103,1.3550398&z=16&hl=fr&output=embed",
    },
    gallery: 3,
  },
];

export const projectFilters = [
  "Tous",
  "Nouveau projet",
  "En construction",
  "Terminé",
] as const;

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
