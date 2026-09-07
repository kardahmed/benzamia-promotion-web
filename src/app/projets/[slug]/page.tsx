import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { PrimaryButton, SecondaryButton } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { ProjectView } from "@/components/analytics/project-view";
import { getProject, projects } from "@/content/projects";
import { routes } from "@/content/site";
import { breadcrumbJsonLd, residenceJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const path = `/projets/${project.slug}`;
  return {
    title: `${project.name} — ${project.location}`,
    description: project.intro,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${project.name} — ${project.location}`,
      description: project.intro,
      url: path,
      ...(project.cover
        ? {
            images: [
              {
                url: project.cover.src,
                width: project.cover.width,
                height: project.cover.height,
                alt: project.cover.alt,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const confirmed = project.features.filter((f) => !f.pending);
  const pending = project.features.filter((f) => f.pending);

  return (
    <main className="flex-1">
      <ProjectView slug={project.slug} name={project.name} />
      <JsonLd
        data={[
          residenceJsonLd(project),
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Projets", path: "/projets" },
            { name: project.name, path: `/projets/${project.slug}` },
          ]),
        ]}
      />
      <PageIntro
        eyebrow={`${project.status} · ${project.location}`}
        title={project.name}
        lead={project.intro}
      >
        <div className="flex flex-wrap gap-3">
          <PrimaryButton href={routes.reserver}>Réserver une visite</PrimaryButton>
          {project.hasVirtualTour && (
            <SecondaryButton href={routes.visiteVirtuelle}>
              Visite virtuelle
            </SecondaryButton>
          )}
        </div>
      </PageIntro>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {project.cover && (
          <div className="mb-4 aspect-[16/9] overflow-hidden rounded-3xl border border-hairline">
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              width={project.cover.width}
              height={project.cover.height}
              priority
              sizes="(max-width: 1280px) 100vw, 1216px"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: project.gallery }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] overflow-hidden rounded-2xl border border-hairline"
            >
              <MediaPlaceholder label={`${project.name} — vue ${i + 1}`} />
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="text-2xl">Le programme</h2>
            <p className="mt-4 text-graphite">{project.description}</p>

            <h2 className="mt-10 text-2xl">Équipements et prestations</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {confirmed.map((f) => (
                <li
                  key={f.label}
                  className="flex gap-2 text-sm text-graphite before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-brand"
                >
                  {f.label}
                </li>
              ))}
            </ul>
            {pending.length > 0 && (
              <p className="mt-4 text-xs text-grey">
                À confirmer avant publication définitive :{" "}
                {pending.map((f) => f.label).join(", ")}.
              </p>
            )}

            <h2 className="mt-10 text-2xl">Typologies</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.typologies.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-hairline px-3 py-1 text-sm text-graphite"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-hairline bg-ivory p-6">
            <dl className="space-y-3">
              {project.facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-4 text-sm">
                  <dt className="text-grey">{f.label}</dt>
                  <dd className="text-right font-medium text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-col gap-2">
              <PrimaryButton href={routes.reserver} className="w-full">
                Réserver une visite
              </PrimaryButton>
              <SecondaryButton href={routes.contact} className="w-full">
                Poser une question
              </SecondaryButton>
            </div>
            <p className="mt-4 text-xs text-grey">
              Plans, surfaces et brochure disponibles sur demande auprès de
              l’équipe commerciale.
            </p>
          </aside>
        </div>

        <div className="mt-16 border-t border-hairline pt-8">
          <Link href={routes.projets} className="text-sm font-medium text-brand">
            ← Tous les projets
          </Link>
        </div>
      </div>
    </main>
  );
}
