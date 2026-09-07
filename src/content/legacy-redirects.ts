/*
 * Redirections 301 depuis l'ancien site benzamiapromotion.com.
 * Cahier des charges V2 §14 (SEO technique) & §19 Phase 1.
 *
 * À COMPLÉTER : lister ici chaque ancienne URL indexée et sa cible sur le
 * nouveau site, après l'inventaire de l'ancien site (crawl + Search Console).
 * `permanent: true` => 308 (301 côté SEO).
 */
export type LegacyRedirect = { source: string; destination: string; permanent: boolean };

export const legacyRedirects: LegacyRedirect[] = [
  // Exemple : { source: "/nos-projets", destination: "/projets", permanent: true },
];
