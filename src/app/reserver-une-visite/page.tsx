import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { BookingForm } from "@/components/booking-form";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Réserver une visite",
  description:
    "Choisissez une résidence BENZAMIA à Chlef et un créneau. Votre demande est transmise à un conseiller qui vous recontacte pour confirmer la visite.",
  alternates: { canonical: "/reserver-une-visite" },
};

export default async function ReserverPage({
  searchParams,
}: {
  searchParams: Promise<{ projet?: string }>;
}) {
  const { projet } = await searchParams;
  const defaultProject = projects.find((p) => p.slug === projet)?.slug;

  return (
    <main className="flex-1">
      <PageIntro
        eyebrow="Réservation"
        title="Choisissez le projet, puis le créneau qui vous convient."
        lead="Indiquez la résidence qui vous intéresse et sélectionnez une date disponible. Votre demande sera enregistrée dans IMMO PRO-X et confiée à un conseiller disponible. Vous recevrez ensuite les informations nécessaires pour votre visite."
      />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <BookingForm defaultProject={defaultProject} />
      </div>
    </main>
  );
}
