import { homeContent } from "@/content/home";
import { ArrowLink } from "./cta";

/** Deux blocs éditoriaux côte à côte : « Investir à Chlef » et « Conseils ». */
export function Editorial() {
  const { invest, news } = homeContent;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2">
        <article
          id="investir"
          className="flex scroll-mt-24 flex-col justify-end rounded-3xl border border-hairline bg-ivory p-8 sm:p-10"
        >
          <p className="eyebrow">Investir à Chlef</p>
          <h2 className="mt-3 text-2xl sm:text-3xl">{invest.title}</h2>
          <p className="mt-3 text-graphite">{invest.description}</p>
          <div className="mt-5">
            <ArrowLink href="/#investir">{invest.action}</ArrowLink>
          </div>
        </article>

        <article
          id="conseils"
          className="flex scroll-mt-24 flex-col justify-end rounded-3xl bg-brand-deep p-8 text-white sm:p-10"
        >
          <p className="eyebrow text-white/70">Conseils et actualités</p>
          <h2 className="mt-3 text-2xl text-white sm:text-3xl">{news.title}</h2>
          <p className="mt-3 text-white/75">{news.description}</p>
          <div className="mt-5">
            <ArrowLink href="/#conseils">
              <span className="text-white">{news.action}</span>
            </ArrowLink>
          </div>
        </article>
      </div>
    </section>
  );
}
