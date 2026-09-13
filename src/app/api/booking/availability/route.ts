import { NextResponse } from "next/server";
import { projects } from "@/content/projects";
import { BOOKING_MIN_LEAD_HOURS } from "@/content/site";
import { fetchAvailability, toLocalLabel } from "@/lib/crm/availability";

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
  const result = await fetchAvailability({ projectRef: project, date });

  if (result.status === "skipped" || result.status === "error") {
    // Aucune heure inventée : sans planning, on ne propose rien et on le dit.
    // Afficher des demi-journées « par défaut » reviendrait à promettre des
    // rendez-vous que personne ne peut tenir — le défaut qu'on corrige ici.
    return NextResponse.json(
      { ok: false, unavailable: true, slots: [] },
      { status: 503 },
    );
  }

  // Le délai minimum se juge créneau par créneau : rejeter la journée entière
  // masquerait des heures de l'après-midi pourtant valides.
  const notBefore = Date.now() + BOOKING_MIN_LEAD_HOURS * 3600 * 1000;
  const slots = result.slots
    .filter((s) => new Date(s.startsAt).getTime() >= notBefore)
    .map((s) => ({ startsAt: s.startsAt, label: toLocalLabel(s.startsAt, result.timezone) }));

  return NextResponse.json({
    ok: true,
    durationMinutes: result.durationMinutes,
    requiresConfirmation: result.requiresConfirmation,
    slots,
  });
}
