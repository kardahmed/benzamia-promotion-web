import type { ReactNode } from "react";

/** En-tête standard d'une page intérieure : surtitre + titre + accroche. */
export function PageIntro({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-hairline bg-ivory">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-[1.05] sm:text-5xl">
          {title}
        </h1>
        {lead && <p className="mt-5 max-w-2xl text-lg text-graphite">{lead}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

/** Bloc de contenu centré, largeur de lecture confortable. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-14 text-graphite sm:px-6 sm:py-20 lg:px-8 [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:text-lg [&_a]:text-brand [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
      {children}
    </div>
  );
}
