"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";
import { metaTrack } from "@/lib/tracking/meta";

const DOWNLOAD_EXT =
  /\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|csv|dwg|jpe?g|png|webp|mp4|mov)($|\?)/i;

/**
 * Écouteur de clics unique (délégation). Évite de convertir chaque lien en
 * composant client. Sources :
 *  - liens `tel:` / WhatsApp / `mailto:` → `contact_channel_click` (+ alias
 *    historiques `click_phone` / `click_whatsapp`) ;
 *  - liens vers un fichier → `file_download` ;
 *  - liens externes → `outbound_click` ;
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
        if (name === "filter_projects" && params.filter) {
          metaTrack("Search", { search_string: params.filter });
        }
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (!href) return;

      if (href.startsWith("tel:")) {
        const phone = href.replace("tel:", "");
        track("contact_channel_click", { channel: "phone", phone });
        track("click_phone", { phone });
        metaTrack("Contact", { content_name: "phone" });
        return;
      }
      if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(href)) {
        track("contact_channel_click", { channel: "whatsapp" });
        track("click_whatsapp", {});
        metaTrack("Contact", { content_name: "whatsapp" });
        return;
      }
      if (href.startsWith("mailto:")) {
        track("contact_channel_click", {
          channel: "email",
          email: href.replace("mailto:", "").split("?")[0],
        });
        metaTrack("Contact", { content_name: "email" });
        return;
      }

      // Liens absolus uniquement au-delà de ce point.
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") return;

      if (DOWNLOAD_EXT.test(url.pathname)) {
        const fileName = url.pathname.split("/").pop() || url.pathname;
        track("file_download", {
          file_name: fileName,
          file_extension: fileName.split(".").pop()?.toLowerCase() ?? "",
          link_url: url.href,
        });
        return;
      }

      if (url.host !== window.location.host) {
        track("outbound_click", { link_url: url.href, link_domain: url.host });
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
