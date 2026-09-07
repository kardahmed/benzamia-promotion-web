import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { articles, formatDate } from "@/content/articles";

export const metadata: Metadata = {
  title: "Conseils et actualités",
  description:
    "Avancement des résidences BENZAMIA, nouvelles disponibilités et repères pour comprendre un achat immobilier à Chlef.",
  alternates: { canonical: "/conseils" },
};

export default function ConseilsPage() {
  return (
    <main className="flex-1">
      <PageIntro
        eyebrow="Conseils et actualités"
        title="Suivre un projet. Comprendre son achat."
        lead="Consultez les dernières informations sur l’avancement des résidences, les nouvelles disponibilités et les étapes importantes d’un achat immobilier."
      />

      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <ul className="divide-y divide-hairline">
          {articles.map((a) => (
            <li key={a.slug} className="py-6">
              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-grey">
                <span className="text-brand">{a.category}</span>
                <time dateTime={a.date}>{formatDate(a.date)}</time>
              </div>
              <h2 className="mt-2 text-xl">{a.title}</h2>
              <p className="mt-2 text-sm text-graphite">{a.summary}</p>
              <span className="mt-2 inline-block text-xs font-medium text-grey">
                Article en préparation
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
