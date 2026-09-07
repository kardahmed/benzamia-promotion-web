"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-lg border border-hairline bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink";
const labelCls = "block text-sm font-medium text-ink";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          message: data.get("message"),
          consent: data.get("consent") === "on",
        }),
      });
      const result = await res.json();
      if (res.ok && result.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
        setMessage(result.reason ?? "Une erreur est survenue.");
      }
    } catch {
      setStatus("error");
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
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-1.5">
        <label className={labelCls} htmlFor="name">
          Nom
        </label>
        <input id="name" name="name" required autoComplete="name" className={field} />
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
        <label className={labelCls} htmlFor="message">
          Votre message
        </label>
        <textarea id="message" name="message" rows={5} required className={field} />
      </div>
      <label className="flex items-start gap-3 text-sm text-graphite">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          J’accepte que BENZAMIA Promotion utilise ces informations pour répondre
          à ma demande.
        </span>
      </label>
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
    </form>
  );
}
