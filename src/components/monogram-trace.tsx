"use client";

import { useEffect, useRef } from "react";
import { MONOGRAM_D } from "./brand";

/**
 * Le monogramme se dessine au défilement, à la manière d'un plan d'architecte :
 * le crayon suit le tracé, puis le bâtiment se remplit et le plan s'efface.
 * Même récit que le hero (chantier → livraison) et que la signature
 * « Bâtir haut, tenir parole ».
 *
 * Le composant se mesure lui-même : la fenêtre de défilement est déduite de sa
 * propre hauteur, donc le tracé se comporte pareil en colonne de bureau qu'en
 * pleine largeur sur téléphone, sans réglage par point de rupture.
 *
 * Régi par `--draw` (0 → 1), écrit sur le nœud par requestAnimationFrame :
 * aucun rendu React pendant le défilement. `--draw` vaut 1 par défaut, donc
 * sans JavaScript ou en animations réduites le logo officiel achevé s'affiche
 * plutôt qu'un vide.
 */

/** Début : le haut du logo entre par le bas de l'écran. */
const ENTER_AT = 0.92;
/** Fin : son bas est remonté à 80 % de l'écran, donc entièrement en vue. */
const FINISH_AT = 0.8;
/** Lissage exponentiel — le trait ne doit pas hoqueter avec la molette. */
const SMOOTHING = 0.14;

export function MonogramTrace({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const path = pathRef.current;
    const tip = tipRef.current;
    if (!root || !path || !tip) return;

    // Animations réduites : on laisse `--draw` à 1, donc le logo achevé.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const total = path.getTotalLength();
    let frame = 0;
    let smoothed = 0;
    root.style.setProperty("--draw", "0");

    const tick = () => {
      // Le trait et la mine sont épaissis en pixels écran, pas en unités du
      // dessin : sans cela le logo mobile, plus petit, aurait un trait deux
      // fois plus fin que celui du bureau.
      const unit = root.clientWidth > 0 ? 336 / root.clientWidth : 1;
      const rect = root.getBoundingClientRect();
      const viewport = window.innerHeight;
      const from = viewport * ENTER_AT;
      const to = viewport * FINISH_AT - rect.height;
      const span = from - to;
      const target =
        span > 0 ? Math.min(1, Math.max(0, (from - rect.top) / span)) : 0;

      smoothed += (target - smoothed) * SMOOTHING;
      if (Math.abs(target - smoothed) < 0.0005) smoothed = target;
      root.style.setProperty("--draw", smoothed.toFixed(4));

      // La mine du crayon suit le point courant du tracé. Elle s'efface aux
      // deux extrémités : avant le départ, et une fois le plan achevé.
      const visible = smoothed > 0.004 && smoothed < 0.985;
      tip.style.opacity = visible ? "1" : "0";
      if (visible) {
        const point = path.getPointAtLength(smoothed * total);
        tip.setAttribute(
          "transform",
          `translate(${point.x} ${point.y}) scale(${unit})`,
        );
      }

      frame = requestAnimationFrame(tick);
    };

    /*
     * L'animation ne tourne QUE lorsque le logo approche de l'écran. Une boucle
     * à 60 images par seconde qui tourne du haut en bas de la page — et jusque
     * sur l'instance masquée par le point de rupture — brûle de la batterie
     * pour rien. C'est sur téléphone que ça se paie.
     */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !frame) {
          frame = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={`monogram-trace ${className}`}>
      <svg
        viewBox="0 0 336 1038"
        className="h-auto w-full overflow-visible"
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
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Le bâtiment livré : il prend le relais quand le plan est fini. */}
        <path
          className="solid"
          d={MONOGRAM_D}
          fill="#A50000"
          fillRule="evenodd"
        />
        {/* La mine du crayon. */}
        {/* La mine. Les rayons sont en pixels écran : le facteur d'échelle est
            posé sur le groupe à chaque image (voir `unit`). */}
        <g ref={tipRef} style={{ opacity: 0 }} aria-hidden>
          <circle r={13} fill="#A50000" opacity={0.14} />
          <circle r={4.5} fill="#A50000" />
        </g>
      </svg>
    </div>
  );
}
