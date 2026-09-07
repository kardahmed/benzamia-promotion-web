import { NextResponse } from "next/server";
import { projects } from "@/content/projects";
import type { BookingResult } from "@/contracts/booking";

export const dynamic = "force-dynamic";

/**
 * Réception d'une demande de visite.
 * TODO (phase 3) : idempotence + persistance Supabase, mise en file d'attente
 * vers le CRM commercial, rotation des conseillers, email SMTP Hostinger.
 * Pour l'instant : validation des champs uniquement.
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
  if (!preferredDate) errors.push("date");
  if (!preferredTime) errors.push("créneau");
  if (!marketingConsent) errors.push("consentement");

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
