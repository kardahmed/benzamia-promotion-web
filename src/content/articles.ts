/*
 * « Conseils et actualités » — cahier des charges V2 §5.
 * Placeholders éditoriaux : le contenu réel des articles sera fourni par
 * BENZAMIA. Dates converties en absolu.
 */
export const articles = [
  {
    slug: "avancement-la-cite-t3-2026",
    title: "Résidence La Cité : point d’avancement",
    category: "Avancement",
    date: "2026-08-15",
    summary:
      "Gros œuvre des blocs A et B achevé, démarrage des cloisons et des réseaux. Calendrier de livraison maintenu.",
  },
  {
    slug: "comprendre-appels-de-fonds",
    title: "Comprendre les appels de fonds en VEFA",
    category: "Achat",
    date: "2026-07-30",
    summary:
      "À quel moment payez-vous, combien, et ce que la loi encadre pour protéger l’acquéreur.",
  },
  {
    slug: "preparer-sa-visite",
    title: "Préparer sa visite d’un appartement témoin",
    category: "Conseils",
    date: "2026-07-10",
    summary:
      "Les points à observer sur place : lumière, rangements, isolation, parties communes et stationnement.",
  },
] as const;

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
