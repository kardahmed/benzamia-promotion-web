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
  // Ancienne arborescence /nos-projets/* → /projets/* (référencée depuis la
  // visite virtuelle 3DVista et l'ancien site).
  { source: "/nos-projets", destination: "/projets", permanent: true },
  { source: "/nos-projets/:slug*", destination: "/projets/:slug*", permanent: true },
  // À COMPLÉTER après le crawl complet de l'ancien site + Search Console.
];
