"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

const THRESHOLDS = [25, 50, 75, 90] as const;

/**
 * Profondeur de défilement — cahier des charges V2 §13.
 * Émet `scroll_depth { percent }` une seule fois par palier et par page.
 * Le suivi des clics sortants / téléchargements est dans `click-tracking.tsx`.
 */
export function EngagementTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const reached = new Set<number>();

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const percent = (window.scrollY / scrollable) * 100;
      for (const t of THRESHOLDS) {
        if (percent >= t && !reached.has(t)) {
          reached.add(t);
          track("scroll_depth", { percent: t, page_path: pathname });
        }
      }
      if (reached.size === THRESHOLDS.length) {
        window.removeEventListener("scroll", onScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // pages courtes : palier atteint dès le chargement
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return null;
}
