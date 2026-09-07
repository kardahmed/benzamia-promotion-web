import { contact } from "@/content/site";
import { ArrowUpRight } from "./icons";

/**
 * Carte du siège / bureau de vente (fiche Google Maps « Résidence La Cité »).
 * Embed sans clé API, chargé en `lazy`. Un lien « Itinéraire » ouvre Google Maps.
 */
export function LocationMap({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-hairline bg-ivory ${className}`}
    >
      <iframe
        src={contact.map.embedSrc}
        title={`Localisation du bureau de vente BENZAMIA — ${contact.salesOffice}`}
        className="block aspect-[4/3] w-full grayscale-[0.2]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <div>
          <p className="font-medium text-ink">{contact.salesOffice}</p>
          <p className="text-xs text-grey">{contact.hours}</p>
        </div>
        <a
          href={contact.map.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-medium text-brand"
        >
          Itinéraire
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
