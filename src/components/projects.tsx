"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { homeContent } from "@/content/home";
import { getProject } from "@/content/projects";
import { track as sendEvent } from "@/lib/analytics";
import { ActionButtons, ArrowLink } from "./cta";
import { ChevronLeft, ChevronRight } from "./icons";
import { MediaPlaceholder } from "./media-placeholder";

type Project = (typeof homeContent.projects.items)[number];

/** Le rouge n'est un signal que pour l'état « Terminé » (livré / disponible). */
function statusClass(status: string) {
  return status === "Terminé"
    ? "bg-brand text-white"
    : "bg-white/15 text-white ring-1 ring-white/30";
}

export function Projects() {
  const { title, description, filters, items } = homeContent.projects;
  const [active, setActive] = useState<string>(filters[0]);
  const track = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () =>
      active === filters[0]
        ? items
        : items.filter((p: Project) => p.status === active),
    [active, filters, items],
  );

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section
      id="projets"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Nos programmes</p>
          <h2 className="mt-2 max-w-xl text-4xl sm:text-5xl">{title}</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Projet précédent"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-ink transition-colors hover:bg-ivory"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Projet suivant"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-ink transition-colors hover:bg-ivory"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-graphite">{description}</p>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrer les projets">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={active === f}
            onClick={() => {
              setActive(f);
              sendEvent("filter_projects", { filter: f, location: "accueil" });
            }}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active === f
                ? "border-ink bg-ink text-white"
                : "border-hairline text-graphite hover:border-ink hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        ref={track}
        className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.length === 0 && (
          <p className="py-10 text-sm text-grey">
            Aucun projet dans cette catégorie pour le moment.
          </p>
        )}
        {visible.map((p: Project) => (
          <article
            key={p.slug}
            className="group flex w-[86%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-hairline bg-paper sm:w-[calc(50%-12px)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {getProject(p.slug)?.cover ? (
                <Image
                  src={getProject(p.slug)!.cover!.src}
                  alt={getProject(p.slug)!.cover!.alt}
                  fill
                  sizes="(max-width: 640px) 86vw, 45vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <MediaPlaceholder
                  tone={p.status === "Terminé" ? "graphite" : "ink"}
                  label={p.name}
                />
              )}
              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                  p.status,
                )}`}
              >
                {p.status}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6">
              <div>
                <h3 className="text-2xl">{p.name}</h3>
                <p className="mt-1 text-sm text-grey">{p.location}</p>
              </div>
              <p className="text-sm text-graphite">{p.description}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {p.typologies.map((t: string) => (
                  <span
                    key={t}
                    className="rounded-full border border-hairline px-2.5 py-0.5 text-xs text-graphite"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-2">
                <ActionButtons labels={p.actions} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <ArrowLink href="/projets">Voir tous les projets</ArrowLink>
      </div>
    </section>
  );
}
