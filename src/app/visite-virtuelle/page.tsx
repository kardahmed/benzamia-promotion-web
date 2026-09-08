import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { VirtualTourEmbed } from "@/components/virtual-tour-embed";
import { PrimaryButton, SecondaryButton } from "@/components/cta";
import { projects } from "@/content/projects";
import { routes } from "@/content/site";

export const metadata: Metadata = {
  title: "Visite virtuelle",
  description:
    "Parcourez les appartements témoins BENZAMIA à 360° depuis votre téléphone ou votre ordinateur, puis réservez une visite sur place.",
  alternates: { canonical: "/visite-virtuelle" },
};

export default function VisiteVirtuellePage() {
  return (
    <main className="flex-1">
      <PageIntro
        eyebrow="Visite virtuelle"
        title="Visitez le projet avant de vous déplacer."
        lead="Parcourez les appartements témoins à 360°, observez les volumes et découvrez l’organisation des pièces depuis votre téléphone ou votre ordinateur. Vous pourrez ensuite choisir un créneau pour visiter le projet sur place."
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <VirtualTourEmbed location="page_visite" />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.slug}
              className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-paper p-5"
            >
              <div>
                <p className="font-medium text-ink">{p.name}</p>
                <p className="text-sm text-grey">{p.location}</p>
                <p className="mt-1 text-xs text-grey">
                  {p.hasVirtualTour
                    ? "Appartements témoins F3 et F4 disponibles en 360°"
                    : "Visite virtuelle à venir"}
                </p>
              </div>
              <SecondaryButton href={`${routes.projets}/${p.slug}`}>
                Le programme
              </SecondaryButton>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <PrimaryButton href={routes.reserver}>
            Réserver une visite sur place
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}
