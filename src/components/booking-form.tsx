"use client";

import { useRef, useState, type FormEvent } from "react";
import { projects } from "@/content/projects";
import { BOOKING_MIN_LEAD_HOURS, contact } from "@/content/site";
import { track } from "@/lib/analytics";
import { RecaptchaNotice, useRecaptcha } from "./recaptcha";

type Status = "idle" | "sending" | "sent" | "error";

/** Première date sélectionnable : 24 h après maintenant (format YYYY-MM-DD). */
const minBookingDate = new Date(Date.now() + BOOKING_MIN_LEAD_HOURS * 3600 * 1000)
  .toISOString()
  .slice(0, 10);

const field =
  "w-full rounded-lg border border-hairline bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink";
const labelCls = "block text-sm font-medium text-ink";

export function BookingForm({ defaultProject }: { defaultProject?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const started = useRef(false);
  const getRecaptchaToken = useRecaptcha();

  function onFirstInteraction() {
    if (started.current) return;
    started.current = true;
    track("begin_booking", { project: defaultProject });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage("");

    const payload = {
      projectSlug: data.get("projectSlug"),
      typology: data.get("typology") || undefined,
      preferredDate: data.get("preferredDate"),
      preferredTime: data.get("preferredTime"),
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      phone: data.get("phone"),
      email: data.get("email") || undefined,
      preferredChannel: data.get("preferredChannel"),
      note: data.get("note") || undefined,
      marketingConsent: data.get("marketingConsent") === "on",
      company: data.get("company") || undefined,
      requestedAt: new Date().toISOString(),
      source: {
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
      },
    };

    try {
      const recaptchaToken = await getRecaptchaToken("booking");
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, recaptchaToken }),
      });
      const result = await res.json();
      if (res.ok && result.status === "accepted") {
        setStatus("sent");
        track("submit_booking", { project: payload.projectSlug });
        track("generate_lead", { lead_type: "visit_request", currency: "DZD", value: 0 });
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
        <p className="font-medium text-ink">Demande envoyée.</p>
        <p className="mt-2 text-sm text-graphite">
          Un conseiller BENZAMIA vous recontacte pour confirmer le rendez-vous.
          Les visites ont lieu au bureau de vente : {contact.salesOffice}.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium text-brand"
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocusCapture={onFirstInteraction}
      className="grid gap-5"
    >
      <p className="rounded-lg bg-ivory px-3 py-2.5 text-xs text-graphite">
        Visites au bureau de vente : {contact.salesOffice}. Créneaux à réserver
        au moins {BOOKING_MIN_LEAD_HOURS} h à l’avance ; un conseiller confirme
        le rendez-vous.
      </p>

      <div className="grid gap-1.5">
        <label className={labelCls} htmlFor="projectSlug">
          Projet
        </label>
        <select
          id="projectSlug"
          name="projectSlug"
          required
          defaultValue={defaultProject ?? ""}
          className={field}
        >
          <option value="" disabled>
            Choisir une résidence
          </option>
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name} — {p.location}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label className={labelCls} htmlFor="typology">
          Typologie <span className="font-normal text-grey">(facultatif)</span>
        </label>
        <input id="typology" name="typology" placeholder="F3, F4, duplex…" className={field} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className={labelCls} htmlFor="preferredDate">
            Date souhaitée
          </label>
          <input
            id="preferredDate"
            name="preferredDate"
            type="date"
            required
            min={minBookingDate}
            className={field}
          />
        </div>
        <div className="grid gap-1.5">
          <label className={labelCls} htmlFor="preferredTime">
            Créneau
          </label>
          <select
            id="preferredTime"
            name="preferredTime"
            required
            defaultValue=""
            onChange={(e) =>
              e.target.value && track("select_slot", { slot: e.target.value })
            }
            className={field}
          >
            <option value="" disabled>
              Choisir
            </option>
            <option>Matin (9h – 12h)</option>
            <option>Après-midi (13h – 17h)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className={labelCls} htmlFor="firstName">
            Prénom
          </label>
          <input id="firstName" name="firstName" required autoComplete="given-name" className={field} />
        </div>
        <div className="grid gap-1.5">
          <label className={labelCls} htmlFor="lastName">
            Nom
          </label>
          <input id="lastName" name="lastName" required autoComplete="family-name" className={field} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className={labelCls} htmlFor="phone">
            Téléphone
          </label>
          <input id="phone" name="phone" type="tel" required autoComplete="tel" className={field} />
        </div>
        <div className="grid gap-1.5">
          <label className={labelCls} htmlFor="email">
            Email <span className="font-normal text-grey">(facultatif)</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className={field} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className={labelCls} htmlFor="preferredChannel">
          Comment préférez-vous être recontacté ?
        </label>
        <select id="preferredChannel" name="preferredChannel" defaultValue="Téléphone" className={field}>
          <option>Téléphone</option>
          <option>WhatsApp</option>
          <option>Email</option>
        </select>
      </div>

      <div className="grid gap-1.5">
        <label className={labelCls} htmlFor="note">
          Message <span className="font-normal text-grey">(facultatif)</span>
        </label>
        <textarea id="note" name="note" rows={3} className={field} />
      </div>

      <label className="flex items-start gap-3 text-sm text-graphite">
        <input type="checkbox" name="marketingConsent" required className="mt-1" />
        <span>
          J’accepte que BENZAMIA Promotion utilise ces informations pour traiter
          ma demande de visite et me recontacter.
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
        <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-brand-bright disabled:opacity-60"
      >
        {status === "sending" ? "Envoi…" : "Envoyer ma demande de visite"}
      </button>

      <p className="text-xs text-grey">
        Votre demande est transmise à l’équipe commerciale BENZAMIA. Aucune
        donnée de paiement n’est demandée.
      </p>
      <RecaptchaNotice />
    </form>
  );
}
