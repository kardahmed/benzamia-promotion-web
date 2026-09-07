import type { Metadata } from "next";
import { Inter, Montserrat, Caveat, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://benzamiapromotion.com";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-montserrat",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-caveat",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BENZAMIA Promotion — Appartements neufs à Chlef",
    template: "%s | BENZAMIA Promotion",
  },
  description:
    "Découvrez les projets immobiliers BENZAMIA à Chlef, consultez leur avancement et réservez une visite.",
  applicationName: "BENZAMIA Promotion",
  keywords: [
    "promotion immobilière Chlef",
    "appartement neuf Chlef",
    "résidence Chlef",
    "BENZAMIA Promotion",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "BENZAMIA Promotion",
    title: "BENZAMIA Promotion — Appartements neufs à Chlef",
    description:
      "Projets immobiliers, avancement, visites virtuelles et réservation de visite à Chlef.",
    url: siteUrl,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${montserrat.variable} ${caveat.variable} ${fraunces.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
