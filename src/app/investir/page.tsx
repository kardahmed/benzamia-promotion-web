import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { PrimaryButton } from "@/components/cta";
import { guides, investIntro } from "@/content/guides";
import { routes } from "@/content/site";

export const metadata: Metadata = {
  title: "Investir à Chlef",
  description:
    "Repères pratiques pour acheter un appartement neuf à Chlef : achat sur plan, financement, documents à vérifier, choix du quartier et achat depuis l’étranger.",
  alternates: { canonical: "/investir" },
};

export default function InvestirPage() {
  return (
    <main className="flex-1">
      <PageIntro
        eyebrow="Investir à Chlef"
        title="Acheter à Chlef demande plus qu’une belle image."
        lead={investIntro}
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <article
              key={g.slug}
              className="flex flex-col rounded-2xl border border-hairline bg-paper p-6"
            >
              <h2 className="text-lg">{g.title}</h2>
              <p className="mt-2 flex-1 text-sm text-graphite">{g.summary}</p>
              <span className="mt-4 text-xs font-medium uppercase tracking-wide text-grey">
                Guide en préparation
              </span>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-ivory p-8 sm:p-12">
          <h2 className="text-2xl">Une question précise sur votre projet ?</h2>
          <p className="mt-3 max-w-xl text-graphite">
            L’équipe BENZAMIA répond aux questions concrètes : financement,
            documents, calendrier de livraison, choix de la typologie.
          </p>
          <div className="mt-6">
            <PrimaryButton href={routes.contact}>Nous contacter</PrimaryButton>
          </div>
        </div>
      </div>
    </main>
  );
}
