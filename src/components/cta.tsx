import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/content/site";
import { ArrowUpRight } from "./icons";

/** Déduit la route cible à partir du libellé d'un bouton du contenu validé. */
export function resolveHref(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("la cité")) return `${routes.projets}/residence-la-cite`;
  if (l.includes("azhar")) return `${routes.projets}/residence-azhar-ii`;
  if (l.includes("projet")) return routes.projets;
  if (l.includes("visite virtuelle")) return routes.visiteVirtuelle;
  if (l.includes("visite") || l.includes("créneau")) return routes.reserver;
  if (l.includes("guide")) return routes.investir;
  if (l.includes("actualités") || l.includes("conseils")) return routes.conseils;
  return routes.contact;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors min-h-11";

export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} bg-brand px-6 text-white hover:bg-brand-bright ${className}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} border border-hairline px-6 text-ink hover:border-ink ${className}`}
    >
      {children}
    </Link>
  );
}

/** Groupe de boutons issus d'un tableau `actions` (1er = primaire). */
export function ActionButtons({
  labels,
  className = "",
  onDark = false,
}: {
  labels: readonly string[];
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {labels.map((label, i) =>
        i === 0 ? (
          <PrimaryButton key={label} href={resolveHref(label)}>
            {label}
          </PrimaryButton>
        ) : (
          <SecondaryButton
            key={label}
            href={resolveHref(label)}
            className={onDark ? "border-white/40 !text-white hover:border-white" : ""}
          >
            {label}
          </SecondaryButton>
        ),
      )}
    </div>
  );
}

/** Lien texte avec flèche, pour les sections éditoriales. */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink"
    >
      <span className="border-b border-brand pb-0.5">{children}</span>
      <ArrowUpRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
