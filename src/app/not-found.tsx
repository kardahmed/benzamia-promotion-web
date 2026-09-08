import Link from "next/link";
import { routes } from "@/content/site";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="max-w-md text-center">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="mt-3 text-3xl">Cette page n’existe pas.</h1>
        <p className="mt-3 text-graphite">
          Le lien est peut-être ancien ou incomplet. Retrouvez les résidences
          BENZAMIA depuis la page projets.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={routes.home}
            className="inline-flex min-h-11 items-center rounded-full border border-hairline px-6 text-sm font-medium text-ink hover:border-ink"
          >
            Accueil
          </Link>
          <Link
            href={routes.projets}
            className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-white hover:bg-brand-bright"
          >
            Voir les projets
          </Link>
        </div>
      </div>
    </main>
  );
}
