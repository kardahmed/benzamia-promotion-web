"use client";

import { useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { LEAD_CURRENCY, LEAD_VALUE } from "@/lib/tracking/config";
import { collectLeadContext, newEventId } from "@/lib/tracking/ids";
import { useFormFunnel } from "@/lib/tracking/use-form-funnel";
import { RecaptchaNotice, useRecaptcha } from "./recaptcha";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-lg border border-hairline bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink";
const labelCls = "block text-sm font-medium text-ink";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const getRecaptchaToken = useRecaptcha();
  const funnel = useFormFunnel("contact");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage("");
    funnel.submit();
    const eventId = newEventId();
    try {
      const recaptchaToken = await getRecaptchaToken("contact");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          message: data.get("message"),
          consent: data.get("consent") === "on",
          company: data.get("company") || undefined,
          recaptchaToken,
          analytics: collectLeadContext(eventId),
          source: {
            pageUrl: typeof window !== "undefined" ? window.location.href : "",
            referrer:
              typeof document !== "undefined" ? document.referrer : undefined,
          },
        }),
      });
      const result = await res.json();
      if (res.ok && result.ok) {
        setStatus("sent");
        funnel.complete();
        track("submit_contact", {});
        track("generate_lead", {
          event_id: eventId,
          lead_type: "contact",
          currency: LEAD_CURRENCY,
          value: LEAD_VALUE.contact,
        });
        form.reset();
      } else {
        setStatus("error");
        funnel.error(result.reason ?? "erreur inconnue");
        setMessage(result.reason ?? "Une erreur est survenue.");
      }
    } catch {
      setStatus("error");
      funnel.error("connexion impossible");
      setMessage("Connexion impossible. Réessayez dans un instant.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-hairline bg-ivory p-6">
        <p className="font-medium text-ink">Message envoyé.</p>
        <p className="mt-2 text-sm text-graphite">
          L’équipe BENZAMIA vous répond dans les meilleurs délais.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onFocusCapture={funnel.start} className="grid gap-5">
      <div className="grid gap-1.5">
        <label className={labelCls} htmlFor="name">
          Nom
        </label>
        <input id="name" name="name" required minLength={2} autoComplete="name" className={field} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className={labelCls} htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={field} />
        </div>
        <div className="grid gap-1.5">
          <label className={labelCls} htmlFor="phone">
            Téléphone <span className="font-normal text-grey">(facultatif)</span>
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} />
        </div>
      </div>
      <div className="grid gap-1.5">
        {/* La règle est annoncée ici et appliquée par le navigateur avant
            l'envoi : sans cela, un message trop court n'était refusé qu'après
            coup, avec un « Champs à corriger : message » qui n'expliquait rien. */}
        <label className={labelCls} htmlFor="message">
          Votre message{" "}
          <span className="font-normal text-grey">(10 caractères minimum)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          minLength={10}
          className={field}
        />
      </div>
      <label className="flex items-start gap-3 text-sm text-graphite">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          J’accepte que BENZAMIA Promotion utilise ces informations pour répondre
          à ma demande.
        </span>
      </label>

      {/* Piège anti-robot : invisible, ne doit jamais être rempli. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {status === "error" && (
        <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">{message}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-brand-bright disabled:opacity-60"
      >
        {status === "sending" ? "Envoi…" : "Envoyer le message"}
      </button>
      <RecaptchaNotice />
    </form>
  );
}
