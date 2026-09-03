import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://benzamiapromotion.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BENZAMIA Promotion — Appartements neufs à Chlef",
    template: "%s | BENZAMIA Promotion",
  },
  description: "Découvrez les projets immobiliers BENZAMIA à Chlef, consultez leur avancement et réservez une visite.",
  applicationName: "BENZAMIA Promotion",
  keywords: ["promotion immobilière Chlef", "appartement neuf Chlef", "résidence Chlef", "BENZAMIA Promotion"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "BENZAMIA Promotion",
    title: "BENZAMIA Promotion — Appartements neufs à Chlef",
    description: "Projets immobiliers, avancement, visites virtuelles et réservation de visite à Chlef.",
    url: siteUrl,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
