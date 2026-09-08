import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { BookingForm } from "@/components/booking-form";
import { projects } from "@/content/projects";
import { contact, telHref } from "@/content/site";

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
        lead="Indiquez la résidence qui vous intéresse et sélectionnez une date disponible. Nous vous recontactons rapidement pour confirmer le rendez-vous et vous communiquer les informations utiles à votre visite."
      />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <BookingForm defaultProject={defaultProject} />

        <div className="mt-10 border-t border-hairline pt-6 text-sm text-graphite">
          <p className="font-medium text-ink">Vous préférez appeler ?</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {contact.phones.map((phone) => (
              <li key={phone}>
                <a href={telHref(phone)} className="text-brand hover:underline">
                  {phone}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-grey">{contact.hours}</p>
        </div>
      </div>
    </main>
  );
}
