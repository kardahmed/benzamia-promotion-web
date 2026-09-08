import { homeContent } from "@/content/home";
import { ActionButtons } from "./cta";

export function FinalCta() {
  const { title, description, actions } = homeContent.final;
  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-ink px-4 py-24 text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl text-white sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/70">{description}</p>
        <ActionButtons labels={actions} onDark className="mt-8 justify-center" />
      </div>
    </section>
  );
}
