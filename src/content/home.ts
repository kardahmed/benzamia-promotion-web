/*
 * Contenu éditorial de la homepage.
 * Base : « Contenu validé — Homepage » du cahier des charges V2 (Notion).
 * Écart validé le 2026-09-07 : le titre hero reprend la maquette
 * (« Redéfinir / l'art de vivre à Chlef ») ; la formulation SEO
 * « Appartements neufs à Chlef » reste portée par les métadonnées (layout.tsx).
 */
export const homeContent = {
  hero: {
    eyebrow: "Promotion immobilière à Chlef depuis 2013",
    title: ["Redéfinir", "l’art de vivre à Chlef"],
    description:
      "Consultez l’avancement des résidences, les typologies disponibles, les surfaces, les plans et les équipements. Lorsque vous avez identifié le projet qui vous correspond, réservez directement votre visite avec l’équipe BENZAMIA.",
    actions: ["Découvrir les projets", "Réserver une visite"],
  },
  company: {
    title: "Des appartements conçus autour de la vie quotidienne.",
    paragraphs: [
      "La qualité d’un appartement ne se limite pas à sa façade. Elle se retrouve dans l’organisation des pièces, la lumière, les équipements, l’accès au stationnement, la sécurité et la proximité des services.",
      "Depuis 2013, BENZAMIA développe des programmes résidentiels à Chlef en accordant une attention particulière à ces usages concrets.",
    ],
    signature: "Bâtir haut, tenir parole.",
    stats: [
      { value: "Depuis 2013", label: "au service des familles de Chlef" },
      { value: "260", label: "appartements livrés" },
      { value: "192", label: "appartements en cours de réalisation" },
    ],
  },
  projects: {
    title: "Venez visiter nos projets à Chlef.",
    description:
      "Filtrez les résidences par statut, consultez leurs caractéristiques et accédez aux informations utiles : localisation, typologies, surfaces, équipements, plans, avancement et disponibilité.",
    filters: ["Tous", "Nouveau projet", "En construction", "Terminé"],
    items: [
      {
        slug: "residence-la-cite",
        name: "Résidence La Cité",
        status: "En construction",
        location: "Chlef",
        typologies: ["F2", "F3", "F4", "Duplex"],
        image:
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        description:
          "148 appartements répartis sur quatre blocs, avec des configurations F2, F3, F4 et duplex. La résidence prévoit un parking, un centre commercial, une sécurité permanente et des jardins privatifs pour certains logements du rez-de-chaussée.",
        actions: ["Découvrir La Cité", "Réserver une visite"],
      },
      {
        slug: "residence-azhar-ii",
        name: "Résidence Azhar II",
        status: "Terminé",
        location: "Ouled Mohamed, Chlef",
        typologies: ["F4"],
        image:
          "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
        description:
          "Une résidence composée de 44 appartements F4 répartis sur deux blocs R+7 à Ouled Mohamed. Les logements proposent différentes surfaces et disposent d’équipements pensés pour le confort et la sécurité des résidents.",
        actions: ["Découvrir Azhar II", "Réserver une visite"],
      },
    ],
  },
  virtualTour: {
    title: "Visitez le projet avant de vous déplacer.",
    description:
      "Parcourez les espaces à 360°, observez les volumes et découvrez l’organisation des pièces depuis votre téléphone ou votre ordinateur. Vous pourrez ensuite choisir un créneau pour visiter le projet sur place.",
    action: "Lancer la visite virtuelle",
  },
  booking: {
    title: "Choisissez le projet, puis le créneau qui vous convient.",
    description:
      "Indiquez la résidence qui vous intéresse et sélectionnez une date disponible. Nous vous recontactons rapidement pour confirmer le rendez-vous et vous communiquer les informations utiles à votre visite.",
    action: "Choisir un créneau",
  },
  invest: {
    title: "Acheter à Chlef demande plus qu’une belle image.",
    description:
      "Retrouvez des informations pratiques pour préparer votre achat : financement, achat sur plan, documents à vérifier, choix du quartier, locaux commerciaux et organisation d’un investissement depuis l’étranger.",
    action: "Consulter les guides",
  },
  news: {
    title: "Suivre un projet. Comprendre son achat.",
    description:
      "Consultez les dernières informations sur l’avancement des résidences, les nouvelles disponibilités et les étapes importantes d’un achat immobilier.",
    action: "Voir les conseils et actualités",
  },
  final: {
    title: "Vous avez identifié un projet qui vous intéresse ?",
    description:
      "Réservez une visite ou contactez directement l’équipe BENZAMIA pour obtenir les informations correspondant à votre recherche.",
    actions: ["Réserver une visite", "Nous contacter"],
  },
} as const;
