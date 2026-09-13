import { NextResponse } from "next/server";
import { projects } from "@/content/projects";
import { BOOKING_MIN_LEAD_HOURS } from "@/content/site";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { saveVisitRequest, markEmailStatus } from "@/lib/supabase/store";
import { notifyVisitRequest, sendVisitFallback } from "@/lib/notifications";
import { sendServerLead, requestClientInfo } from "@/lib/tracking/server";
import { submitBookingToCrm } from "@/lib/crm/bookings";
import { fetchAvailability, toLocalLabel } from "@/lib/crm/availability";
import { updateVisitRequestFromCrm } from "@/lib/supabase/store";
import type { BookingResult } from "@/contracts/booking";

export const dynamic = "force-dynamic";

/**
 * Réception d'une demande de visite (voir docs/CALENDRIER-IMMOPROX.md).
 * - créneau demandé au moins 24 h à l'avance ;
 * - la visite a toujours lieu au bureau de vente ;
 * - confirmation manuelle par un conseiller ; le site ne planifie rien.
 *
 * Flux : validation → anti-abus → stockage durable (Supabase, idempotent) →
 * emails (équipe + accusé client). Si le stockage échoue alors que Supabase
 * est configuré → repli e-mail vers BOOKING_FALLBACK_EMAIL. Le branchement
 * IMMO PRO-X (endpoint partenaire) reste à faire côté CRM.
 */
const toStr = (v: unknown) => (v == null ? undefined : String(v).trim() || undefined);
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "rejected", reason: "Requête invalide." } satisfies BookingResult,
      { status: 400 },
    );
  }

  // Anti-abus (CDC §16) : piège + reCAPTCHA v3.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({
      status: "accepted",
      leadId: `ignored-${Date.now()}`,
    } satisfies BookingResult);
  }
  const captcha = await verifyRecaptcha(body.recaptchaToken, "booking");
  if (!captcha.ok) {
    return NextResponse.json(
      { status: "rejected", reason: captcha.reason } satisfies BookingResult,
      { status: 403 },
    );
  }

  const projectSlug = String(body.projectSlug ?? "");
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const preferredDate = String(body.preferredDate ?? "");
  // Le formulaire envoie soit un créneau exact du planning (date ISO), soit
  // une demi-journée quand l'intégration n'est pas joignable.
  const preferredTimeRaw = String(body.preferredTime ?? "");
  const isoSlot = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(preferredTimeRaw)
    ? preferredTimeRaw
    : undefined;
  const preferredTime = isoSlot ? toLocalLabel(isoSlot) : preferredTimeRaw;
  const marketingConsent = body.marketingConsent === true;

  const errors: string[] = [];
  if (!projects.some((p) => p.slug === projectSlug)) errors.push("projet");
  if (fullName.length < 3) errors.push("nom et prénom (3 caractères minimum)");
  if (!/^[0-9+\s().-]{6,}$/.test(phone)) errors.push("numéro de téléphone invalide");
  if (!preferredTime) errors.push("créneau");
  if (!marketingConsent) errors.push("case de consentement à cocher");

  // Le créneau doit être demandé au moins 24 h à l'avance (premier créneau 9h).
  const slotStart = new Date(`${preferredDate}T09:00:00`);
  const minLeadMs = BOOKING_MIN_LEAD_HOURS * 60 * 60 * 1000;
  if (!preferredDate || Number.isNaN(slotStart.getTime())) {
    errors.push("date");
  } else if (slotStart.getTime() < Date.now() + minLeadMs) {
    errors.push(`date (au moins ${BOOKING_MIN_LEAD_HOURS} h à l'avance)`);
  }

  if (errors.length > 0) {
    return NextResponse.json(
      {
        status: "rejected",
        reason: `Champs à corriger : ${errors.join(", ")}.`,
      } satisfies BookingResult,
      { status: 422 },
    );
  }

  // Revérification du créneau : entre l'affichage et l'envoi, quelqu'un a pu
  // le prendre. Le CRM revalidera de son côté, mais autant le dire tout de
  // suite plutôt que de promettre un rendez-vous impossible.
  let crmDuration: number | undefined;
  if (isoSlot) {
    const dispo = await fetchAvailability({
      projectRef: projectSlug,
      date: preferredDate,
    }).catch(() => ({ status: "error" as const, detail: "indisponible" }));
    if (dispo.status === "ok") {
      crmDuration = dispo.durationMinutes;
      if (!dispo.slots.some((s) => s.startsAt === isoSlot)) {
        return NextResponse.json(
          {
            status: "rejected",
            reason:
              "Ce créneau vient d'être pris. Choisissez-en un autre dans la liste.",
          } satisfies BookingResult,
          { status: 409 },
        );
      }
    }
  }

  const idempotencyKey = toStr(body.idempotencyKey);
  const externalRef =
    toStr(body.externalRef) ??
    `site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const visit = {
    externalRef,
    projectSlug,
    fullName,
    phone,
    email: toStr(body.email),
    preferredDate,
    preferredTime,
    typology: toStr(body.typology),
    preferredChannel: toStr(body.preferredChannel),
    note: toStr(body.note),
  };

  const source =
    body.source && typeof body.source === "object"
      ? (body.source as Record<string, unknown>)
      : {};

  // Mesure côté serveur (GA4 Measurement Protocol + Meta CAPI). Inerte tant que
  // les secrets ne sont pas configurés ; jamais bloquant.
  const a =
    body.analytics && typeof body.analytics === "object"
      ? (body.analytics as Record<string, unknown>)
      : {};
  const { ip, userAgent } = requestClientInfo(request);
  // Attendu (et non « fire and forget ») : sur Hostinger le processus peut être
  // figé dès la réponse envoyée, ce qui coupait la requête vers Meta/GA4 en vol.
  const fireLead = async () => {
    if (typeof a.eventId !== "string") return;
    await sendServerLead({
      leadType: "visit_request",
      eventId: a.eventId,
      clientId: typeof a.clientId === "string" ? a.clientId : undefined,
      email: toStr(body.email),
      phone,
      fullName,
      fbp: typeof a.fbp === "string" ? a.fbp : undefined,
      fbc: typeof a.fbc === "string" ? a.fbc : undefined,
      pageUrl: typeof a.pageUrl === "string" ? a.pageUrl : undefined,
      userAgent,
      ip,
      projectSlug,
      leadSource: toStr((source as Record<string, unknown>).utmSource) ?? "site",
    });
  };

  // Stockage AVANT la transmission : le CRM peut accepter puis nous envoyer un
  // événement ; sans trace locale de la demande, cet événement serait
  // impossible à rattacher — donc une visite effectuée jamais comptée.
  const stored = await saveVisitRequest({
    idempotencyKey,
    ...visit,
    marketingConsent,
    source,
  });

  // La transmission a lieu même si le stockage a échoué : la demande doit
  // atteindre les conseillers. La référence part alors dans l'e-mail de
  // secours, seul moyen de la rattacher plus tard à la main.
  const crm = await submitBookingToCrm({
    externalRef,
    projectSlug,
    fullName,
    phone,
    email: toStr(body.email),
    preferredDate,
    preferredTime,
    typology: toStr(body.typology),
    preferredChannel: toStr(body.preferredChannel),
    note: toStr(body.note),
    marketingConsent,
    source,
    idempotencyKey: idempotencyKey ?? externalRef,
    startsAtIso: isoSlot,
    durationMinutes: crmDuration,
  });

  if (!stored.ok && crm.status === "accepted") {
    console.error(
      `[booking] demande transmise au CRM mais non stockée — external_ref=${externalRef} request_id=${crm.requestId}`,
    );
  }

  if (stored.ok) {
    await updateVisitRequestFromCrm(stored.id, {
      status:
        crm.status === "accepted"
          ? "transmise"
          : crm.status === "skipped"
            ? undefined
            : "en_file",
      crmOpId: crm.status === "accepted" ? crm.requestId : undefined,
    });

    const { team } = await notifyVisitRequest(visit);
    void markEmailStatus(
      "visit_requests",
      stored.id,
      team.ok ? "sent" : team.skipped ? "skipped" : "failed",
    );
    await fireLead();
    return NextResponse.json({
      status: "accepted",
      leadId: stored.id,
    } satisfies BookingResult);
  }

  // Supabase non configuré (MVP) : on notifie quand même l'équipe si l'e-mail
  // est configuré, et on accepte la demande.
  if (stored.skipped) {
    const { team } = await notifyVisitRequest(visit);
    if (team.ok || team.skipped) {
      await fireLead();
      return NextResponse.json({
        status: "accepted",
        leadId: externalRef,
      } satisfies BookingResult);
    }
    return NextResponse.json(
      {
        status: "retry",
        reason:
          "Envoi impossible pour le moment. Réessayez, ou appelez-nous directement.",
      } satisfies BookingResult,
      { status: 503 },
    );
  }

  // Supabase configuré mais l'écriture a échoué → repli e-mail (CDC §9).
  const fallback = await sendVisitFallback(visit);
  if (fallback.ok) {
    void notifyVisitRequest(visit);
    await fireLead();
    return NextResponse.json({
      status: "accepted",
      leadId: externalRef,
    } satisfies BookingResult);
  }
  return NextResponse.json(
    {
      status: "retry",
      reason:
        "Votre demande n'a pas pu être enregistrée. Réessayez dans un instant ou appelez-nous.",
    } satisfies BookingResult,
    { status: 503 },
  );
}
