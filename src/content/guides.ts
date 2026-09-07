/*
 * Hub éditorial « Investir à Chlef » — cahier des charges V2 §14.
 * Les pages de guides détaillées seront rédigées ultérieurement ; on décrit
 * ici les sujets validés du hub.
 */
export const investIntro =
  "Acheter un appartement à Chlef engage sur plusieurs années. Ces repères pratiques vous aident à préparer votre projet, vérifier les bons documents et choisir en confiance.";

export const guides = [
  {
    slug: "achat-sur-plan",
    title: "Acheter sur plan (VEFA)",
    summary:
      "Comment fonctionne l’achat d’un logement en cours de construction : contrat préliminaire, appels de fonds, garanties et livraison.",
  },
  {
    slug: "financement",
    title: "Financer son achat",
    summary:
      "Apport, crédit immobilier, échéancier de paiement et pièces à réunir avant de déposer un dossier.",
  },
  {
    slug: "documents-a-verifier",
    title: "Les documents à vérifier",
    summary:
      "Permis de construire, acte de propriété du terrain, livret foncier, conformité et réception des travaux.",
  },
  {
    slug: "choisir-son-quartier",
    title: "Choisir son quartier à Chlef",
    summary:
      "Accès, services de proximité, orientation, nuisances et perspectives d’évolution d’un secteur.",
  },
  {
    slug: "locaux-commerciaux",
    title: "Investir dans un local commercial",
    summary:
      "Emplacement, flux, bail et rendement attendu pour un local en pied d’immeuble.",
  },
  {
    slug: "acheter-depuis-l-etranger",
    title: "Acheter depuis l’étranger",
    summary:
      "Procuration, transferts, suivi du chantier à distance et signature de l’acte pour la diaspora.",
  },
] as const;
