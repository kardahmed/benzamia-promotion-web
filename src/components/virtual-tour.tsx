import { homeContent } from "@/content/home";
import { routes } from "@/content/site";
import { PrimaryButton } from "./cta";
import { Monogram } from "./brand";

export function VirtualTour() {
  const { title, description, action } = homeContent.virtualTour;
  return (
    <section
      id="visite-virtuelle"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-3xl border-l-[6px] border-brand bg-ink">
        <div
          className="absolute inset-0 bg-gradient-to-r from-ink via-ink to-[#2c2c2c]"
          aria-hidden
        />
        <Monogram
          tone="white"
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-[130%] w-auto opacity-[0.05]"
        />
        <div className="relative flex flex-col gap-6 p-10 sm:p-14 lg:max-w-xl">
          <p className="eyebrow text-white/60">Visite virtuelle</p>
          <h2 className="text-3xl leading-[1.08] text-white sm:text-4xl">{title}</h2>
          <p className="text-white/70">{description}</p>
          <PrimaryButton
            href={routes.reserver}
            className="w-fit bg-white !text-ink hover:bg-white/90"
          >
            {action}
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
