import type { Metadata } from "next";
import { PageIntro, Prose } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "Politique de cookies",
  description:
    "Cookies et traceurs utilisés par le site BENZAMIA Promotion et gestion du consentement.",
  alternates: { canonical: "/politique-de-cookies" },
  robots: { index: false, follow: true },
};

export default function CookiesPage() {
  return (
    <main className="flex-1">
      <PageIntro eyebrow="Informations légales" title="Politique de cookies" />
      <Prose>
        <p className="rounded-lg bg-ivory px-3 py-2 text-sm text-grey">
          Version de travail. Le bandeau de consentement et la liste exacte des
          traceurs seront finalisés avec le plan de marquage.
        </p>

        <h2>Cookies nécessaires</h2>
        <p>
          Indispensables au fonctionnement du site (affichage, sécurité,
          mémorisation de votre choix de consentement). Ils ne peuvent pas être
          désactivés.
        </p>

        <h2>Cookies de mesure et de publicité</h2>
        <ul>
          <li>Google Analytics 4 et Google Ads ;</li>
          <li>Meta Pixel.</li>
        </ul>
        <p>
          Ces traceurs ne sont déposés qu’après votre accord explicite via le
          bandeau de consentement. Vous pouvez modifier votre choix à tout
          moment.
        </p>

        <h2>Durée</h2>
        <p>
          Les cookies ont une durée de vie limitée, précisée dans le tableau
          détaillé à venir.
        </p>
      </Prose>
    </main>
  );
}
