import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ProjectCard } from "@/components/project-card";
import { projects, projectFilters } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projets immobiliers à Chlef",
  description:
    "Les résidences BENZAMIA à Chlef : statut, localisation, typologies, équipements et disponibilité. Filtrez par statut et réservez une visite.",
  alternates: { canonical: "/projets" },
};

/** Slug URL <-> libellé de filtre (les libellés viennent du CDC). */
const FILTER_SLUGS: Record<string, (typeof projectFilters)[number]> = {
  "nouveau-projet": "Nouveau projet",
  "en-construction": "En construction",
  termine: "Terminé",
};
const slugFor = (label: string) =>
  Object.entries(FILTER_SLUGS).find(([, v]) => v === label)?.[0] ?? "";

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const active = (statut && FILTER_SLUGS[statut]) || "Tous";
  const visible =
    active === "Tous" ? projects : projects.filter((p) => p.status === active);

  return (
    <main className="flex-1">
      <PageIntro
        eyebrow="Nos programmes"
        title="Venez visiter nos projets à Chlef."
        lead="Filtrez les résidences par statut, consultez leurs caractéristiques et accédez aux informations utiles : localisation, typologies, surfaces, équipements, plans, avancement et disponibilité."
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer les projets par statut"
        >
          {projectFilters.map((f) => {
            const isActive = f === active;
            const href = f === "Tous" ? "/projets" : `/projets?statut=${slugFor(f)}`;
            return (
              <Link
                key={f}
                href={href}
                aria-current={isActive ? "true" : undefined}
                data-analytics-event="filter_projects"
                data-analytics-filter={f}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-white"
                    : "border-hairline text-graphite hover:border-ink hover:text-ink"
                }`}
              >
                {f}
              </Link>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="mt-12 text-graphite">
            Aucun projet dans cette catégorie pour le moment.{" "}
            <Link href="/projets" className="text-brand underline">
              Voir tous les projets
            </Link>
            .
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {visible.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
