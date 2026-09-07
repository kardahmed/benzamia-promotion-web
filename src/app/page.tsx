import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { Company } from "@/components/company";
import { Projects } from "@/components/projects";
import { VirtualTour } from "@/components/virtual-tour";
import { Booking } from "@/components/booking";
import { Editorial } from "@/components/editorial";
import { FinalCta } from "@/components/final-cta";
import { DEFAULT_DESCRIPTION } from "@/lib/seo";

export const metadata: Metadata = {
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <Company />
      <Projects />
      <VirtualTour />
      <Booking />
      <Editorial />
      <FinalCta />
    </main>
  );
}
