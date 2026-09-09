"use client";

import { useEffect, useRef } from "react";
import { MONOGRAM_D } from "./brand";

/**
 * Un seul geste signe la section BENZAMIA : une ligne part au-dessus du titre,
 * l'encercle, serpente à travers les textes, balaie la largeur… puis rejoint la
 * colonne de gauche et s'y referme en monogramme, qui se remplit.
 *
 * Le trait passe DERRIÈRE le texte : il traverse la section sans jamais gêner
 * la lecture.
 *
 * Régie par `--draw` (0 → 1), écrite sur le nœud par requestAnimationFrame :
 * aucun rendu React pendant le défilement. `--draw` vaut 1 par défaut, donc
 * sans JavaScript ou en animations réduites la section affiche le logo
 * officiel achevé plutôt qu'un vide.
 */

/** Points du serpentin, en coordonnées relatives à la section (0 → 1). */
const WAYPOINTS: [number, number][] = [
  [0.24, 0.13],
  [0.72, 0.1],
  [0.81, 0.17],
  [0.3, 0.22],
  [0.26, 0.3],
  [0.55, 0.34],
  [0.88, 0.46],
  [0.62, 0.55],
  [0.9, 0.68],
  [0.5, 0.8],
  [0.24, 0.86],
  [0.14, 0.74],
];

/** Départ du tracé officiel dans son propre repère (« M250 6 »). */
const MONOGRAM_START: [number, number] = [250 / 336, 6 / 1038];

/** Lissage exponentiel — le trait ne doit pas hoqueter avec la molette. */
const SMOOTHING = 0.14;
/** Début : la section entre par le bas de l'écran. */
const ENTER_AT = 0.85;
/**
 * Fin : calée sur le bas du LOGO, pas sur celui de la section. Ancré sur la
 * section, le tracé s'achevait alors que le monogramme était déjà sorti par le
 * haut — on ratait précisément le moment où le geste devient la signature.
 */
const FINISH_WHEN_LOGO_AT = 0.92;

/**
 * Courbe lisse passant par tous les points (Catmull-Rom converti en Béziers).
 * Une polyligne donnerait des angles secs ; on veut le geste d'une main.
 */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  const d = [`M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(
      `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(
        1,
      )} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`,
    );
  }
  return d.join(" ");
}

export function MonogramTrace() {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const traceRef = useRef<SVGPathElement>(null);
  const solidRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const line = lineRef.current;
    const trace = traceRef.current;
    const solid = solidRef.current;
    const tip = tipRef.current;
    if (!root || !svg || !line || !trace || !solid || !tip) return;

    const section = root.parentElement;
    const slot = section?.querySelector<HTMLElement>("[data-monogram-slot]");
    if (!section || !slot) return;

    /** Bas du logo dans le repère de la section — ancre de fin du tracé. */
    let logoBottom = 0;

    /** Recompose le tracé aux dimensions réelles de la section. */
    const layout = () => {
      const width = section.offsetWidth;
      const height = section.offsetHeight;
      if (width <= 0 || height <= 0) return false;

      // Emplacement du logo, mesuré dans le repère de la section : le geste
      // atterrit exactement là où la charte veut le monogramme.
      const box = slot.getBoundingClientRect();
      const origin = section.getBoundingClientRect();
      const x = box.left - origin.left;
      const y = box.top - origin.top;
      const scale = box.width / 336;
      logoBottom = y + box.height;

      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      solid.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
      trace.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);

      // Le serpentin se termine au point de départ du monogramme : les deux
      // tracés se succèdent sans rupture visible.
      const join: [number, number] = [
        x + MONOGRAM_START[0] * box.width,
        y + MONOGRAM_START[1] * box.height,
      ];
      const points = WAYPOINTS.map(
        ([nx, ny]) => [nx * width, ny * height] as [number, number],
      );
      line.setAttribute("d", smoothPath([...points, join]));
      return true;
    };

    if (!layout()) return;

    // Animations réduites : `--draw` reste à 1, donc le geste et le logo
    // achevés, sans mouvement.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const total = trace.getTotalLength();
    const lineTotal = line.getTotalLength();

    let frame = 0;
    let smoothed = 0;
    root.style.setProperty("--draw", "0");

    const tick = () => {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight;
      const from = viewport * ENTER_AT;
      // Position de la section à l'achèvement : celle qui amène le bas du logo
      // à FINISH_WHEN_LOGO_AT de la hauteur d'écran, donc bien en vue.
      const to = viewport * FINISH_WHEN_LOGO_AT - logoBottom;
      const span = from - to;
      const target =
        span > 0 ? Math.min(1, Math.max(0, (from - rect.top) / span)) : 0;

      smoothed += (target - smoothed) * SMOOTHING;
      if (Math.abs(target - smoothed) < 0.0005) smoothed = target;
      root.style.setProperty("--draw", smoothed.toFixed(4));

      // La mine du crayon suit le point courant — d'abord le long du geste,
      // puis le long du monogramme.
      const onLine = smoothed < 0.6;
      const local = onLine
        ? smoothed / 0.6
        : Math.min(1, (smoothed - 0.58) / 0.32);
      const visible = smoothed > 0.004 && smoothed < 0.9;
      tip.style.opacity = visible ? "1" : "0";
      if (visible) {
        const host = onLine ? line : trace;
        const point = host.getPointAtLength(
          local * (onLine ? lineTotal : total),
        );
        // Le monogramme est mis à l'échelle : on ramène le point dans le
        // repère de la section, sinon la mine se poserait à côté.
        const box = slot.getBoundingClientRect();
        const origin = section.getBoundingClientRect();
        const sx = onLine ? point.x : box.left - origin.left + point.x * (box.width / 336);
        const sy = onLine ? point.y : box.top - origin.top + point.y * (box.width / 336);
        tip.setAttribute("transform", `translate(${sx} ${sy})`);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    const observer = new ResizeObserver(() => layout());
    observer.observe(section);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="monogram-trace pointer-events-none absolute inset-0 z-0 hidden lg:block"
      aria-hidden
    >
      <svg
        ref={svgRef}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Le geste. `pathLength=1` normalise la longueur : les pointillés se
            pilotent en unités 0 → 1, sans mesure au montage. */}
        <path
          ref={lineRef}
          className="sig-line"
          pathLength={1}
          fill="none"
          stroke="#A50000"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Le plan du monogramme, dans le prolongement du geste. */}
        <path
          ref={traceRef}
          className="sig-trace"
          d={MONOGRAM_D}
          pathLength={1}
          fill="none"
          stroke="#A50000"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Le bâtiment livré : il prend le relais quand le plan est fini. */}
        <path
          ref={solidRef}
          className="sig-solid"
          d={MONOGRAM_D}
          fill="#A50000"
          fillRule="evenodd"
        />
        <g ref={tipRef} style={{ opacity: 0 }}>
          <circle r={14} fill="#A50000" opacity={0.13} />
          <circle r={4.5} fill="#A50000" />
        </g>
      </svg>
    </div>
  );
}
