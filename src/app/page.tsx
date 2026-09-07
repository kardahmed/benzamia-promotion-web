import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Company } from "@/components/company";
import { Projects } from "@/components/projects";
import { VirtualTour } from "@/components/virtual-tour";
import { Booking } from "@/components/booking";
import { Editorial } from "@/components/editorial";
import { FinalCta } from "@/components/final-cta";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Company />
        <Projects />
        <VirtualTour />
        <Booking />
        <Editorial />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
