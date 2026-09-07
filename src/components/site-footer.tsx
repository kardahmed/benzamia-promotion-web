import Link from "next/link";
import {
  primaryNav,
  legalNav,
  bookingCta,
  contact,
  telHref,
} from "@/content/site";
import { Logo } from "./brand";
import { ConsentManageButton } from "./analytics/consent-banner";

export function SiteFooter() {
  return (
    <footer className="mt-8">
      <div className="bg-ink text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
          <div>
            <Logo tone="white" />
            <p className="mt-4 max-w-xs text-sm">
              Promoteur immobilier à Chlef depuis {contact.since}. Conception,
              construction et livraison d’ensembles résidentiels durables.
            </p>
            <p className="mt-4 font-hand text-xl text-white">
              {contact.signature}
            </p>
          </div>

          <nav aria-label="Pied de page">
            <p className="eyebrow text-white/40">Navigation</p>
            <ul className="mt-4 space-y-2 text-sm">
              {[...primaryNav, bookingCta].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow text-white/40">Contact</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>{contact.city}</li>
              <li>
                <a href={`mailto:${contact.email}`} className="hover:text-white">
                  {contact.email}
                </a>
              </li>
              {contact.phones.map((phone) => (
                <li key={phone}>
                  <a href={telHref(phone)} className="hover:text-white">
                    {phone}
                  </a>
                </li>
              ))}
              <li>{contact.hours}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bandeau rouge souligné d'un filet noir 12 px — élément de charte. */}
      <div className="border-b-[12px] border-ink bg-brand text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            © {new Date().getFullYear()} {contact.company}. Tous droits réservés.
          </span>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-4 gap-y-1">
            {legalNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
            <ConsentManageButton className="hover:underline" />
          </nav>
        </div>
      </div>
    </footer>
  );
}
