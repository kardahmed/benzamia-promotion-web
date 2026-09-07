import { NextResponse } from "next/server";
import { projects } from "@/content/projects";
import { BOOKING_MIN_LEAD_HOURS } from "@/content/site";
import type { BookingResult } from "@/contracts/booking";

export const dynamic = "force-dynamic";

/**
 * Réception d'une demande de visite.
 * Règles métier validées (voir docs/CALENDRIER-IMMOPROX.md) :
 * - créneau demandé au moins 24 h à l'avance ;
 * - la visite a toujours lieu au bureau de vente ;
 * - confirmation manuelle par un conseiller ; le site ne planifie rien.
 * TODO (phase 3) : idempotence + persistance Supabase durable, file d'attente
 * vers le CRM commercial, attribution des conseillers côté CRM, email SMTP
 * Hostinger, repli e-mail si le CRM est indisponible.
 * Pour l'instant : validation des champs uniquement, rien n'est persisté.
 */
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

  const projectSlug = String(body.projectSlug ?? "");
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const preferredDate = String(body.preferredDate ?? "");
  const preferredTime = String(body.preferredTime ?? "");
  const marketingConsent = body.marketingConsent === true;

  const errors: string[] = [];
  if (!projects.some((p) => p.slug === projectSlug)) errors.push("projet");
  if (firstName.length < 2) errors.push("prénom");
  if (lastName.length < 2) errors.push("nom");
  if (!/^[0-9+\s().-]{6,}$/.test(phone)) errors.push("téléphone");
  if (!preferredTime) errors.push("créneau");
  if (!marketingConsent) errors.push("consentement");

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

  // Réponse provisoire — aucune donnée n'est encore persistée ni transmise.
  return NextResponse.json({
    status: "accepted",
    leadId: `pending-${Date.now()}`,
  } satisfies BookingResult);
}
