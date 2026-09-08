"use client";

import Image from "next/image";
import { useState } from "react";
import { virtualTour } from "@/content/site";
import { track } from "@/lib/analytics";
import { ArrowUpRight } from "./icons";
import { MediaPlaceholder } from "./media-placeholder";

/**
 * Visite virtuelle 3DVista, cahier des charges V2 §8 :
 * - l'iframe ne se charge qu'au clic (rien avant) ;
 * - image de remplacement si aucune visite n'est configurée ;
 * - plein écran autorisé ;
 * - `start_virtual_tour` mesuré au lancement et à l'ouverture plein écran.
 * Les fichiers de la visite (~120 Mo) sont hébergés hors du dépôt —
 * voir docs/VISITE-VIRTUELLE.md.
 */
export function VirtualTourEmbed({
  location,
}: {
  location: "page_visite" | "fiche_projet";
}) {
  const [started, setStarted] = useState(false);
  const ready = virtualTour.enabled;

  return (
    <figure className="m-0">
      <div
        className={`relative w-full overflow-hidden rounded-3xl border border-hairline bg-ink ${
          started && ready
            ? "h-[clamp(340px,80vh,760px)]"
            : "h-[clamp(320px,48vw,560px)]"
        }`}
      >
        {started && ready ? (
          <iframe
            src={virtualTour.url}
            title="Visite virtuelle BENZAMIA Promotion à 360°"
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            allow="fullscreen; accelerometer; gyroscope; magnetometer; xr-spatial-tracking; vr"
            allowFullScreen
          />
        ) : (
          <>
            {ready ? (
              <Image
                src="/visite-virtuelle/poster.jpg"
                alt="Aperçu de la visite virtuelle : hall d'entrée d'une résidence BENZAMIA"
                fill
                sizes="(max-width: 1280px) 100vw, 1216px"
                className="object-cover opacity-70"
              />
            ) : (
              <MediaPlaceholder
                tone="ink"
                label="Visite 360° — bientôt disponible"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/40 p-6 text-center">
              {ready ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setStarted(true);
                      track("start_virtual_tour", {
                        location,
                        interaction: "launch",
                      });
                    }}
                    className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
                  >
                    <span
                      aria-hidden
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs text-white"
                    >
                      ▶
                    </span>
                    Lancer la visite virtuelle
                  </button>
                  <p className="max-w-sm text-xs text-white/70">
                    La visite se charge uniquement maintenant, pour ne pas
                    ralentir la navigation.
                  </p>
                </>
              ) : (
                <p className="max-w-sm text-sm text-white/80">
                  Les panoramas 360° des appartements témoins sont en cours de
                  préparation.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-grey">
        <span>
          Appartements témoins F3 et F4 de la Résidence La Cité. Une image de
          remplacement s’affiche si un panorama ne se charge pas.
        </span>
        {started && ready && (
          <a
            href={virtualTour.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("start_virtual_tour", {
                location,
                interaction: "new_tab",
              })
            }
            className="inline-flex shrink-0 items-center gap-1 font-medium text-brand"
          >
            Ouvrir dans un nouvel onglet
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </figcaption>
    </figure>
  );
}
