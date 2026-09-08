import { homeContent } from "@/content/home";

export function Company() {
  const { title, paragraphs, signature, stats } = homeContent.company;
  return (
    <section
      id="benzamia"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <div className="flex items-start gap-4">
          <span className="eyebrow mt-1">BENZAMIA</span>
          <span className="mt-2.5 hidden h-px flex-1 bg-hairline lg:block" />
        </div>

        <div className="border-l-[6px] border-brand pl-6 sm:pl-8">
          <h2 className="max-w-2xl text-3xl leading-snug sm:text-[2.35rem]">
            {title}
          </h2>
          <div className="mt-5 max-w-2xl space-y-3 text-graphite">
            {paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-5 font-hand text-2xl text-brand">{signature}</p>

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
        </div>
      </div>
    </section>
  );
}
