import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Appartements neufs à Chlef`,
    short_name: "BENZAMIA",
    description:
      "Programmes immobiliers BENZAMIA à Chlef : avancement, typologies, visite virtuelle et réservation de visite.",
    start_url: "/",
    display: "standalone",
    lang: "fr",
    background_color: "#f6f6f4",
    theme_color: "#a50000",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  };
}
