import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/crm/webhook";
import {
  claimCrmEvent,
  finishCrmEvent,
  findVisitRequestByExternalRef,
  updateVisitRequestFromCrm,
} from "@/lib/supabase/store";
import { sendOfflineConversion } from "@/lib/tracking/offline";

export const dynamic = "force-dynamic";

/**
 * Réception des événements du CRM IMMO PRO-X (voir docs/CALENDRIER-IMMOPROX.md).
 *
 * Un seul type aujourd'hui : `booking.status_changed`, qui porte l'état d'une
 * visite issue d'une demande du site (pending_confirmation, confirmed,
 * rescheduled, cancelled, completed).
 *
 * Deux effets :
 *  1. le statut est reporté sur la demande d'origine (visit_requests) ;
 *  2. `completed` déclenche la conversion hors ligne vers Meta — la visite a
 *     réellement eu lieu au bureau de vente, c'est l'événement à 135 USD.
 *
 * Le CRM n'envoie aucune donnée personnelle : téléphone et e-mail viennent de
 * notre propre base, celle du formulaire rempli par le visiteur.
 *
 * Réponses : 200 dès que l'événement est accepté ou déjà connu (le worker
 * distant ne doit pas rejouer indéfiniment) ; 401/400 pour une signature
 * invalide ; 503 seulement si l'intégration n'est pas configurée ou si la
 * base est indisponible — là, le rejeu est justifié.
 */
const STATUS_MAP: Record<string, string> = {
  pending_confirmation: "transmise",
  confirmed: "confirmee",
  rescheduled: "replanifiee",
  cancelled: "refusee",
  completed: "effectuee",
};

export async function POST(request: Request) {
  const raw = await request.text();

  const verified = verifyWebhook(
    {
      integrationId: request.headers.get("x-immoprox-integration-id"),
      eventId: request.headers.get("x-immoprox-event-id"),
      keyId: request.headers.get("x-immoprox-key-id"),
      timestamp: request.headers.get("x-immoprox-timestamp"),
      signature: request.headers.get("x-immoprox-signature"),
    },
    raw,
  );
  if (!verified.ok) {
    return NextResponse.json(
      { ok: false, reason: verified.reason },
      { status: verified.status },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, reason: "corps illisible" }, { status: 400 });
  }

  const eventType = String(body.type ?? body.event_type ?? "");
  const claim = await claimCrmEvent({
    integrationId: verified.integrationId,
    eventId: verified.eventId,
    eventType,
    payload: body,
  });

  if (claim.claimed === false) {
    // Déjà reçu : on accuse réception sans retraiter (rejeu du worker).
    if ("duplicate" in claim && claim.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // Base absente ou en erreur : le rejeu est légitime.
    return NextResponse.json(
      { ok: false, reason: "stockage indisponible" },
      { status: 503 },
    );
  }

  try {
    const data = (body.data ?? body) as Record<string, unknown>;
    const externalRef = String(
      data.external_booking_id ?? data.external_ref ?? body.external_booking_id ?? "",
    );
    const status = String(data.status ?? "");

    if (eventType !== "booking.status_changed" || !externalRef) {
      await finishCrmEvent(verified.integrationId, verified.eventId, "ignore", eventType);
      return NextResponse.json({ ok: true, ignored: true });
    }

    const demande = await findVisitRequestByExternalRef(externalRef);
    if (!demande) {
      // Événement valide mais demande inconnue (ancienne, ou autre site).
      await finishCrmEvent(
        verified.integrationId,
        verified.eventId,
        "ignore",
        `demande inconnue: ${externalRef}`,
      );
      return NextResponse.json({ ok: true, ignored: true });
    }

    await updateVisitRequestFromCrm(demande.id, {
      status: STATUS_MAP[status] ?? demande.status,
      crmVisitId: typeof data.visit_id === "string" ? data.visit_id : undefined,
    });

    let conversion: string | undefined;
    if (status === "completed") {
      const at = data.occurred_at ?? data.completed_at ?? body.occurred_at;
      const eventTime = typeof at === "string" ? new Date(at) : new Date();
      conversion = await sendOfflineConversion({
        kind: "visit_completed",
        // Stable : un rejeu ou une reprise manuelle reste la même conversion.
        eventId: `visit-completed-${demande.externalRef}`,
        eventTime: Number.isNaN(eventTime.getTime()) ? new Date() : eventTime,
        phone: demande.phone,
        email: demande.email,
        fullName: demande.fullName,
        projectSlug: demande.projectSlug,
      });
    }

    await finishCrmEvent(
      verified.integrationId,
      verified.eventId,
      "traite",
      conversion ? `${status} · meta=${conversion}` : status,
    );
    return NextResponse.json({ ok: true, status, conversion });
  } catch (error) {
    await finishCrmEvent(
      verified.integrationId,
      verified.eventId,
      "erreur",
      String(error).slice(0, 300),
    );
    // L'événement est enregistré : inutile de le rejouer, on traitera à la main.
    return NextResponse.json({ ok: true, error: true });
  }
}
