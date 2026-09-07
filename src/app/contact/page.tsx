import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { ContactForm } from "@/components/contact-form";
import { PrimaryButton } from "@/components/cta";
import { contact, routes, telHref } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l’équipe BENZAMIA Promotion à Chlef pour toute question sur les résidences, les disponibilités ou une visite.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      <PageIntro
        eyebrow="Contact"
        title="Parlons de votre projet."
        lead="Une question sur une résidence, une typologie ou un calendrier de livraison ? Écrivez-nous, ou réservez directement une visite."
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div>
          <h2 className="text-2xl">Nous écrire</h2>
          <p className="mt-2 text-sm text-graphite">
            Le formulaire transmet votre message à l’équipe commerciale.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-hairline bg-ivory p-6">
          <h2 className="text-lg">Coordonnées</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-grey">Email</dt>
              <dd>
                <a href={`mailto:${contact.email}`} className="text-brand underline">
                  {contact.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-grey">Téléphone</dt>
              <dd className="space-y-1">
                {contact.phones.map((phone) => (
                  <a
                    key={phone}
                    href={telHref(phone)}
                    className="block text-ink hover:text-brand"
                  >
                    {phone}
                  </a>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-grey">Bureau de vente</dt>
              <dd className="text-ink">{contact.city}</dd>
            </div>
            <div>
              <dt className="text-grey">Horaires</dt>
              <dd className="text-ink">{contact.hours}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <PrimaryButton href={routes.reserver} className="w-full">
              Réserver une visite
            </PrimaryButton>
          </div>
        </aside>
      </div>
    </main>
  );
}
