import type { MapPlace } from "@/content/site";
import { ArrowUpRight } from "./icons";

/**
 * Carte Google Maps d'un lieu (siège, résidence…). Embed sans clé API,
 * chargé en `lazy`. Un lien « Itinéraire » ouvre Google Maps.
 */
export function LocationMap({
  map,
  title,
  subtitle,
  className = "",
}: {
  map: MapPlace;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-hairline bg-ivory ${className}`}
    >
      <iframe
        src={map.embedSrc}
        title={`Localisation — ${title}`}
        className="block aspect-[4/3] w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <div>
          <p className="font-medium text-ink">{title}</p>
          {subtitle && <p className="text-xs text-grey">{subtitle}</p>}
        </div>
        <a
          href={map.link}
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
