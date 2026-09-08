import type { Metadata } from "next";
import { PageIntro, Prose } from "@/components/page-intro";
import { contact } from "@/content/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site BENZAMIA Promotion.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <main className="flex-1">
      <PageIntro eyebrow="Informations légales" title="Mentions légales" />
      <Prose>
        <p className="rounded-lg bg-ivory px-3 py-2 text-sm text-grey">
          Contenu à compléter avec les informations officielles de BENZAMIA
          Promotion (raison sociale, RC, NIF, adresse du siège, représentant
          légal, hébergeur).
        </p>

        <h2>Éditeur du site</h2>
        <p>
          {contact.company} — {contact.city}. Courriel :{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>. Téléphone :{" "}
          {contact.phones.join(" · ")}.
        </p>

        <h2>Hébergement</h2>
        <p>
          Le site est hébergé sur Hostinger Cloud. Coordonnées complètes de
          l’hébergeur à préciser.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L’ensemble des contenus (textes, visuels, logo, plans) est la propriété
          de {contact.company} ou de ses partenaires. Toute reproduction sans
          autorisation est interdite.
        </p>

        <h2>Responsabilité</h2>
        <p>
          Les informations relatives aux résidences (surfaces, équipements,
          disponibilités, calendriers) sont données à titre indicatif et peuvent
          évoluer. Elles ne constituent pas un engagement contractuel.
        </p>
      </Prose>
    </main>
  );
}
