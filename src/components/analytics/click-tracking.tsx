"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Écouteur de clics unique (délégation). Évite de convertir chaque lien en
 * composant client. Deux sources :
 *  - liens `tel:` et WhatsApp → `click_phone` / `click_whatsapp` ;
 *  - tout élément portant `data-analytics-event` (+ `data-analytics-*` en
 *    paramètres), par ex. les filtres de projets ou les cartes.
 */
export function ClickTracking() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const tagged = target.closest<HTMLElement>("[data-analytics-event]");
      if (tagged) {
        const name = tagged.dataset.analyticsEvent as AnalyticsEvent;
        const params: Record<string, string> = {};
        for (const [key, value] of Object.entries(tagged.dataset)) {
          if (key.startsWith("analytics") && key !== "analyticsEvent" && value) {
            const param = key.slice("analytics".length);
            params[param.charAt(0).toLowerCase() + param.slice(1)] = value;
          }
        }
        track(name, params);
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) {
        track("click_phone", { phone: href.replace("tel:", "") });
      } else if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(href)) {
        track("click_whatsapp");
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
