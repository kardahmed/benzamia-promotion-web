import { homeContent } from "@/content/home";
import { contact } from "@/content/site";
import { PrimaryButton } from "./cta";
import { Calendar } from "./icons";

export function Booking() {
  const { title, description, action } = homeContent.booking;
  return (
    <section
      id="reservation"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="grid gap-8 rounded-3xl bg-ivory p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-5">
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brand/30 text-brand sm:flex">
            <Calendar className="h-6 w-6" />
          </span>
          <div>
            <p className="eyebrow">Réservation</p>
            <h2 className="mt-2 max-w-xl text-3xl sm:text-[2rem]">{title}</h2>
            <p className="mt-3 max-w-xl text-graphite">{description}</p>
            <p className="mt-3 text-sm text-grey">
              Bureau de vente — {contact.city} · {contact.hours}
            </p>
          </div>
        </div>
        <PrimaryButton href="/#contact" className="w-fit">
          {action}
        </PrimaryButton>
      </div>
    </section>
  );
}
