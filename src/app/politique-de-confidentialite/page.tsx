import type { Metadata } from "next";
import { PageIntro, Prose } from "@/components/page-intro";
import { contact } from "@/content/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment BENZAMIA Promotion collecte et utilise les données des visiteurs du site.",
  alternates: { canonical: "/politique-de-confidentialite" },
  robots: { index: false, follow: true },
};

export default function ConfidentialitePage() {
  return (
    <main className="flex-1">
      <PageIntro
        eyebrow="Informations légales"
        title="Politique de confidentialité"
      />
      <Prose>
        <p className="rounded-lg bg-ivory px-3 py-2 text-sm text-grey">
          Version de travail. À valider juridiquement avant mise en ligne.
        </p>

        <h2>Données collectées</h2>
        <p>
          Lorsque vous réservez une visite ou nous contactez, nous collectons les
          informations que vous fournissez : nom, prénom, téléphone, email,
          projet concerné, créneau souhaité et message éventuel.
        </p>

        <h2>Utilisation</h2>
        <ul>
          <li>traiter votre demande de visite ou votre message ;</li>
          <li>vous recontacter via le canal que vous avez choisi ;</li>
          <li>transmettre votre demande à l’équipe commerciale BENZAMIA.</li>
        </ul>

        <h2>Conservation</h2>
        <p>
          Les données sont conservées le temps nécessaire au suivi commercial,
          puis archivées ou supprimées selon les durées légales applicables.
        </p>

        <h2>Vos droits</h2>
        <p>
          Vous pouvez demander l’accès, la rectification ou la suppression de vos
          données en écrivant à{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>

        <h2>Mesure d’audience</h2>
        <p>
          Le site utilise des outils de mesure Google et Meta, activés uniquement
          après votre consentement. Voir la{" "}
          <a href="/politique-de-cookies">politique de cookies</a>.
        </p>
      </Prose>
    </main>
  );
}
