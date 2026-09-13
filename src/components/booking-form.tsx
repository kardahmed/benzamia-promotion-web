"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { projects } from "@/content/projects";
import { BOOKING_MIN_LEAD_HOURS, contact } from "@/content/site";
import { track } from "@/lib/analytics";
import { LEAD_CURRENCY, LEAD_VALUE, projectItem } from "@/lib/tracking/config";
import { collectLeadContext, newEventId } from "@/lib/tracking/ids";
import { metaResidence, metaTrack } from "@/lib/tracking/meta";
import { useFormFunnel } from "@/lib/tracking/use-form-funnel";
import { RecaptchaNotice, useRecaptcha } from "./recaptcha";

type Status = "idle" | "sending" | "sent" | "error";

/** Première date sélectionnable : 24 h après maintenant (format YYYY-MM-DD). */
const minBookingDate = new Date(Date.now() + (BOOKING_MIN_LEAD_HOURS + 1) * 3600 * 1000)
  .toISOString()
  .slice(0, 10);

const field =
  "w-full rounded-lg border border-hairline bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink";
const labelCls = "block text-sm font-medium text-ink";

/** Lit un paramètre d'URL (utm, gclid, fbclid). */
function param(name: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get(name) ?? undefined;
}

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function BookingForm({ defaultProject }: { defaultProject?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [projectSlug, setProjectSlug] = useState(defaultProject ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [availability, setAvailability] = useState<{
    key: string; slots: { starts_at: string; ends_at: string }[];
    duration_minutes: number; error?: boolean;
  } | null>(null);
  const selectionKey = `${projectSlug}/${date}/${refresh}`;
  const current = availability?.key === selectionKey ? availability : null;
  const hour = (iso: string) => new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Algiers", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
  const validTime = !!time && !!current?.slots.some((slot) => hour(slot.starts_at) === time);

  useEffect(() => {
    if (!projectSlug || !date) return;
    const controller = new AbortController();
    fetch(`/api/booking/availability?${new URLSearchParams({ project: projectSlug, date })}`, {
      signal: controller.signal, cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) throw new Error("unavailable");
      const result = await response.json();
      if (!controller.signal.aborted) setAvailability({ ...result, key: selectionKey });
    }).catch(() => {
      if (!controller.signal.aborted) setAvailability({ key: selectionKey, slots: [], duration_minutes: 0, error: true });
    });
    return () => controller.abort();
  }, [projectSlug, date, selectionKey]);
  // Stable pour toute la vie du formulaire : un renvoi (retry, double-clic)
  // porte la même clé et ne crée pas de doublon.
  const idempotencyKey = useRef(newId());
  const getRecaptchaToken = useRecaptcha();
  const funnel = useFormFunnel("booking", { project: defaultProject });

  function onFirstInteraction() {
    funnel.start();
    track("begin_booking", { project: defaultProject });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!validTime) return;
    setStatus("sending");
    setMessage("");
    funnel.submit();

    const eventId = newEventId();
    const payload = {
      analytics: collectLeadContext(eventId),
      projectSlug: data.get("projectSlug"),
      typology: data.get("typology") || undefined,
      preferredDate: data.get("preferredDate"),
      preferredTime: data.get("preferredTime"),
      fullName: data.get("fullName"),
      phone: data.get("phone"),
      email: data.get("email") || undefined,
      preferredChannel: data.get("preferredChannel"),
      note: data.get("note") || undefined,
      marketingConsent: data.get("marketingConsent") === "on",
      company: data.get("company") || undefined,
      requestedAt: new Date().toISOString(),
      idempotencyKey: idempotencyKey.current,
      source: {
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        utmSource: param("utm_source"),
        utmMedium: param("utm_medium"),
        utmCampaign: param("utm_campaign"),
        gclid: param("gclid"),
        fbclid: param("fbclid"),
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
        funnel.complete();
        const slug = String(payload.projectSlug ?? "");
        const project = projects.find((p) => p.slug === slug);
        track("submit_booking", { project: slug });
        track("generate_lead", {
          event_id: eventId,
          lead_type: "visit_request",
          currency: LEAD_CURRENCY,
          value: LEAD_VALUE.visit_request,
          project: slug,
          items: project ? [projectItem(slug, project.name)] : undefined,
        });
        const residence = project ? metaResidence(slug, project.name) : {};
        metaTrack(
          "Lead",
          {
            ...residence,
            content_name: "visit_request",
            currency: LEAD_CURRENCY,
            value: LEAD_VALUE.visit_request,
          },
          eventId,
        );
        // Prise de rendez-vous : pas d'équivalent serveur, identifiant dédié.
        metaTrack("Schedule", residence, `${eventId}-schedule`);
        form.reset();
      } else {
        if (res.status === 409) { setTime(""); setRefresh((value) => value + 1); }
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
        <p className="font-medium text-ink">Demande envoyée.</p>
        <p className="mt-2 text-sm text-graphite">
          Un conseiller BENZAMIA vous recontacte pour confirmer le rendez-vous.
          Les visites ont lieu au bureau de vente : {contact.salesOffice}.
        </p>
        <button
          type="button"
          onClick={() => { idempotencyKey.current = newId(); setDate(""); setTime(""); setStatus("idle"); }}
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
          value={projectSlug}
          onChange={(e) => { setProjectSlug(e.target.value); setTime(""); }}
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
            value={date}
            onInput={(e) => { setDate(e.currentTarget.value); setTime(""); }}
            onChange={(e) => { setDate(e.target.value); setTime(""); }}
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
            value={time}
            disabled={!current || current.error || !current.slots.length}
            aria-describedby="availability-status"
            onChange={(e) => { setTime(e.target.value); track("select_slot", { slot: e.target.value }); }}
            className={field}
          >
            <option value="" disabled>
              Choisir
            </option>
            {current?.slots.map((slot) => (
              <option key={slot.starts_at} value={hour(slot.starts_at)}>
                {hour(slot.starts_at)} – {hour(slot.ends_at)}
              </option>
            ))}
          </select>
          <p id="availability-status" role="status" className="text-xs text-graphite">
            {!projectSlug || !date ? "Choisissez une résidence et une date."
              : !current ? "Recherche des disponibilités…"
              : current.error ? "Disponibilités temporairement indisponibles. Réessayez ou appelez-nous."
              : !current.slots.length ? "Aucun créneau disponible ce jour. Choisissez une autre date."
              : `Heure d’Algérie · durée : ${current.duration_minutes} minutes · confirmation par un conseiller.`}
          </p>
          {current?.error && <button type="button" className="text-sm text-brand" onClick={() => setRefresh((value) => value + 1)}>Réessayer</button>}

        </div>
      </div>

      <div className="grid gap-1.5">
        <label className={labelCls} htmlFor="fullName">
          Nom et prénom
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          minLength={3}
          autoComplete="name"
          className={field}
        />
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
        disabled={status === "sending" || !validTime}
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
