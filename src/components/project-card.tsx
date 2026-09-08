import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/projects";
import { routes } from "@/content/site";
import { MediaPlaceholder } from "./media-placeholder";
import { PrimaryButton, SecondaryButton } from "./cta";
import { ArrowUpRight } from "./icons";

function statusClass(status: Project["status"]) {
  return status === "Terminé"
    ? "bg-brand text-white"
    : "bg-white/15 text-white ring-1 ring-white/30";
}

export function ProjectCard({ project }: { project: Project }) {
  const href = `${routes.projets}/${project.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-hairline bg-paper">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden">
        {project.cover ? (
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <MediaPlaceholder
            tone={project.status === "Terminé" ? "graphite" : "ink"}
            label={project.name}
          />
        )}
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium ${statusClass(
            project.status,
          )}`}
        >
          {project.status}
        </span>
        <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div>
          <h3 className="text-2xl">
            <Link href={href} className="hover:text-brand">
              {project.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-grey">{project.location}</p>
        </div>
        <p className="text-sm text-graphite">{project.intro}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {project.typologies.map((t) => (
            <span
              key={t}
              className="rounded-full border border-hairline px-2.5 py-0.5 text-xs text-graphite"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          <PrimaryButton
            href={href}
            data-analytics-event="select_item"
            data-analytics-project={project.slug}
            data-analytics-project-name={project.name}
            data-analytics-list-name="projets"
          >
            Découvrir
          </PrimaryButton>
          <SecondaryButton href={routes.reserver}>
            Réserver une visite
          </SecondaryButton>
        </div>
      </div>
    </article>
  );
}
