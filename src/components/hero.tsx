import { homeContent } from "@/content/home";
import { PrimaryButton, SecondaryButton, resolveHref } from "./cta";
import { Monogram } from "./brand";

export function Hero() {
  const { eyebrow, title, description, actions } = homeContent.hero;
  return (
    <section className="relative min-h-[640px] overflow-hidden bg-ink lg:min-h-[760px]">
      {/* Fond architectural provisoire — remplacé par une photo de résidence (Supabase Storage). */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#20242b] via-ink to-[#101316]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(165,0,0,0.28),transparent_45%)]"
        aria-hidden
      />
      <Monogram
        tone="white"
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-0 h-[85%] w-auto opacity-[0.06]"
      />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-paper to-transparent" />

      <div className="relative mx-auto flex min-h-[640px] max-w-7xl flex-col justify-center px-4 pt-28 pb-28 sm:px-6 lg:min-h-[760px] lg:px-8">
        <p className="eyebrow text-white/70">{eyebrow}</p>
        <h1 className="mt-5 max-w-2xl text-5xl leading-[1.03] text-white sm:text-6xl lg:text-7xl">
          {title[0]}
          <br />
          <span className="font-serif font-normal italic tracking-[-0.01em] text-white/90">
            {title[1]}
          </span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton href={resolveHref(actions[0])}>{actions[0]}</PrimaryButton>
          <SecondaryButton
            href={resolveHref(actions[1])}
            className="border-white/40 !text-white hover:border-white"
          >
            {actions[1]}
          </SecondaryButton>
        </div>
      </div>
    </section>
  );
}
