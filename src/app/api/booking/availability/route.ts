import { NextResponse } from "next/server";
import { projects } from "@/content/projects";
import { BOOKING_MIN_LEAD_HOURS } from "@/content/site";
import { fetchAvailability, toLocalLabel } from "@/lib/crm/availability";
import { isClosedDay } from "@/lib/crm/payload";

export const dynamic = "force-dynamic";

/**
 * Créneaux libres d'une journée, pour le formulaire de visite.
 *
 * Le navigateur ne parle jamais au CRM : il interroge cette route, qui détient
 * le jeton. La réponse ne contient que des heures — aucune information sur les
 * agents, leurs rendez-vous ou les autres clients.
 *
 * `configured: false` signifie « intégration pas encore branchée » : le
 * formulaire retombe alors sur ses deux demi-journées, plutôt que d'afficher
 * une liste vide qui bloquerait toute demande.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const project = String(params.get("project") ?? "");
  const date = String(params.get("date") ?? "");

  if (!projects.some((p) => p.slug === project)) {
    return NextResponse.json({ ok: false, reason: "projet inconnu" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, reason: "date invalide" }, { status: 400 });
  }
  if (isClosedDay(date)) {
    return NextResponse.json({ ok: true, configured: true, closed: true, slots: [] });
  }
  // Le CRM refuse en dessous du délai minimum : autant ne rien proposer.
  const dayStart = new Date(`${date}T00:00:00+01:00`).getTime();
  if (dayStart < Date.now() + BOOKING_MIN_LEAD_HOURS * 3600 * 1000) {
    return NextResponse.json({ ok: true, configured: true, tooSoon: true, slots: [] });
  }

  const result = await fetchAvailability({ projectRef: project, date });

  if (result.status === "skipped") {
    return NextResponse.json({ ok: true, configured: false, slots: [] });
  }
  if (result.status === "error") {
    // Le formulaire proposera son repli : mieux vaut une demande à confirmer
    // qu'un visiteur bloqué parce que le CRM est momentanément injoignable.
    return NextResponse.json(
      { ok: false, configured: true, reason: result.detail, slots: [] },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    durationMinutes: result.durationMinutes,
    requiresConfirmation: result.requiresConfirmation,
    slots: result.slots.map((s) => ({
      startsAt: s.startsAt,
      label: toLocalLabel(s.startsAt, result.timezone),
    })),
  });
}
