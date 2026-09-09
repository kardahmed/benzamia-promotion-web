"use client";

import { useEffect, useRef } from "react";
import { MONOGRAM_D } from "./brand";

/**
 * Le monogramme se dessine au défilement, à la manière d'un plan d'architecte :
 * le crayon suit le tracé, puis le bâtiment se remplit une fois le plan achevé.
 * Même récit que le hero (chantier → livraison) et que la signature
 * « Bâtir haut, tenir parole ».
 *
 * Régie par `--draw` (0 → 1), écrite sur le nœud par requestAnimationFrame :
 * aucun rendu React pendant le défilement.
 *
 * `--draw` vaut 1 par défaut. Sans JavaScript, ou si le visiteur a demandé des
 * animations réduites, la colonne affiche donc le logo officiel achevé plutôt
 * qu'un espace vide.
 */

/**
 * Le tracé se joue sur la traversée de l'écran, pas sur la course de l'élément
 * collant : la section BENZAMIA ne laisse que ~140 px de course interne, on
 * raterait tout le dessin en un coup de molette.
 *
 * Le départ est calé à mi-écran plutôt qu'en bas : sinon le crayon commencerait
 * alors que le monogramme est encore hors champ, et on manquerait le début.
 * L'arrivée coïncide avec le calage en haut — le logo s'achève au moment
 * précis où il se fige, puis reste affiché, terminé.
 */
const START_AT = 0.55; /* haut du logo à mi-hauteur d'écran */
/** Lissage exponentiel — le trait ne doit pas hoqueter avec la molette. */
const SMOOTHING = 0.14;

export function MonogramTrace() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    const path = pathRef.current;
    const tip = tipRef.current;
    if (!track || !sticky || !path || !tip) return;

    // Animations réduites : on laisse `--draw` à 1, donc le logo achevé.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const total = path.getTotalLength();
    // Position de calage lue sur l'élément : l'arrivée du tracé y est alignée
    // sans répéter en dur la valeur de la classe Tailwind.
    const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;

    let frame = 0;
    let smoothed = 0;
    track.style.setProperty("--draw", "0");

    const tick = () => {
      const from = window.innerHeight * START_AT;
      const top = sticky.getBoundingClientRect().top;
      const span = from - stickyTop;
      const target =
        span > 0 ? Math.min(1, Math.max(0, (from - top) / span)) : 0;

      smoothed += (target - smoothed) * SMOOTHING;
      if (Math.abs(target - smoothed) < 0.0005) smoothed = target;

      track.style.setProperty("--draw", smoothed.toFixed(4));

      // La mine du crayon suit le point courant du tracé. Elle s'efface aux
      // deux extrémités : avant le départ, et une fois le plan achevé.
      const visible = smoothed > 0.004 && smoothed < 0.985;
      tip.style.opacity = visible ? "1" : "0";
      if (visible) {
        const point = path.getPointAtLength(smoothed * total);
        tip.setAttribute("transform", `translate(${point.x} ${point.y})`);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={trackRef} className="monogram-trace hidden min-h-0 flex-1 lg:block">
      <div ref={stickyRef} className="sticky top-28">
        <svg
          viewBox="0 0 336 1038"
          className="h-auto w-[132px] overflow-visible"
          role="img"
          aria-label="Monogramme BENZAMIA Promotion"
        >
          {/* Le plan qui se trace. `pathLength=1` normalise la longueur : les
              pointillés se pilotent en unités 0 → 1, sans mesure au montage. */}
          <path
            ref={pathRef}
            className="trace"
            d={MONOGRAM_D}
            pathLength={1}
            fill="none"
            stroke="#A50000"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Le bâtiment livré : il prend le relais quand le plan est fini. */}
          <path className="solid" d={MONOGRAM_D} fill="#A50000" fillRule="evenodd" />

          {/* La mine du crayon. */}
          <g ref={tipRef} style={{ opacity: 0 }} aria-hidden>
            <circle r={16} fill="#A50000" opacity={0.14} />
            <circle r={5.5} fill="#A50000" />
          </g>
        </svg>
      </div>
    </div>
  );
}
