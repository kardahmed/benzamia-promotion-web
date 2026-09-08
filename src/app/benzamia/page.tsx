import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { PrimaryButton, SecondaryButton } from "@/components/cta";
import { routes, contact } from "@/content/site";

export const metadata: Metadata = {
  title: "BENZAMIA Promotion",
  description:
    "Promoteur immobilier à Chlef depuis 2013 : 260 appartements livrés, 192 en cours. Conception, construction et livraison d’ensembles résidentiels durables.",
  alternates: { canonical: "/benzamia" },
};

const stats = [
  { value: "2013", label: "année de création" },
  { value: "260", label: "appartements livrés" },
  { value: "192", label: "appartements en cours de réalisation" },
];

export default function BenzamiaPage() {
  return (
    <main className="flex-1">
      <PageIntro
        eyebrow="BENZAMIA"
        title="Des appartements conçus autour de la vie quotidienne."
        lead="La qualité d’un appartement ne se limite pas à sa façade. Elle se retrouve dans l’organisation des pièces, la lumière, les équipements, l’accès au stationnement, la sécurité et la proximité des services."
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="border-l-[6px] border-brand pl-6 sm:pl-8">
          <p className="max-w-2xl text-graphite">
            Depuis 2013, BENZAMIA développe des programmes résidentiels à Chlef en
            accordant une attention particulière à ces usages concrets : des plans
            pensés pour être vécus, des matériaux durables et des délais tenus.
          </p>
          <p className="mt-4 font-hand text-2xl text-brand">{contact.signature}</p>
        </div>

        <dl className="mt-12 grid gap-8 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-4xl font-bold tabular-nums text-ink">
                {s.value}
              </dt>
              <dd className="mt-1 text-sm text-grey">{s.label}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-hairline bg-paper p-6">
            <h2 className="text-lg">Notre métier</h2>
            <p className="mt-2 text-sm text-graphite">
              Recherche du foncier, conception avec nos architectes, suivi de
              chantier et service après-livraison : chaque étape est maîtrisée en
              interne.
            </p>
          </div>
          <div className="rounded-2xl border border-hairline bg-paper p-6">
            <h2 className="text-lg">Notre engagement</h2>
            <p className="mt-2 text-sm text-graphite">
              Livrer des logements qui tiennent la promesse du plan de vente, avec
              un interlocuteur unique jusqu’après la remise des clés.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <PrimaryButton href={routes.projets}>Voir les projets</PrimaryButton>
          <SecondaryButton href={routes.contact}>Nous contacter</SecondaryButton>
        </div>
      </div>
    </main>
  );
}
