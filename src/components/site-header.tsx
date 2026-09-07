import Link from "next/link";
import { primaryNav, bookingCta } from "@/content/site";
import { Logo } from "./brand";
import { ArrowUpRight } from "./icons";

/** En-tête transparent superposé au hero (fond sombre). */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="BENZAMIA Promotion — accueil">
          <Logo tone="white" />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-0.5 rounded-full bg-paper/95 px-2 py-1.5 text-sm font-medium text-graphite shadow-lg shadow-black/5 backdrop-blur lg:flex"
        >
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 transition-colors hover:bg-ivory hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={bookingCta.href}
          className="group inline-flex items-center gap-2 rounded-full bg-paper/95 py-2 pl-4 pr-2 text-sm font-medium text-ink shadow-lg shadow-black/5 backdrop-blur transition-colors hover:bg-paper"
        >
          <span className="hidden sm:inline">{bookingCta.label}</span>
          <span className="sm:hidden">Visite</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white transition-transform group-hover:translate-x-0.5">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </header>
  );
}
