/*
 * Créneaux réellement libres, lus dans IMMO PRO-X.
 *
 * Le formulaire proposait « Matin » et « Après-midi », deux demi-journées
 * fixes : une promesse que le planning ne garantit pas. On interroge donc le
 * CRM, qui seul connaît les agents, leurs rendez-vous et les réglages du
 * tenant (horaires, pause, durée, cadence).
 *
 * L'appel se fait TOUJOURS depuis le serveur : le jeton d'intégration ne doit
 * jamais atteindre le navigateur.
 *
 * On n'impose pas `duration_minutes` : la durée vient de la réponse. Sinon on
 * recréerait la copie de configuration qu'on vient justement de supprimer.
 */

const BASE_URL = process.env.IMMOPROX_API_BASE_URL || "";
const TOKEN = process.env.IMMOPROX_API_TOKEN || "";
const TIMEOUT_MS = 5000;

export type AvailabilitySlot = { startsAt: string; endsAt: string };

export type AvailabilityResult =
  | {
      status: "ok";
      timezone: string;
      durationMinutes: number;
      slotStepMinutes?: number;
      requiresConfirmation: boolean;
      slots: AvailabilitySlot[];
    }
  /** Intégration pas encore configurée : le formulaire garde son repli. */
  | { status: "skipped" }
  | { status: "error"; detail: string };

/** Bornes UTC d'une journée d'Alger (UTC+1, sans heure d'été). */
export function dayBoundsUtc(date: string): { from: string; until: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, d, -1, 0, 0, 0));
  const until = new Date(Date.UTC(y, m - 1, d, 22, 59, 59, 0));
  if (Number.isNaN(from.getTime())) return null;
  return { from: from.toISOString(), until: until.toISOString() };
}

export async function fetchAvailability(args: {
  projectRef: string;
  date: string;
}): Promise<AvailabilityResult> {
  if (!BASE_URL || !TOKEN) return { status: "skipped" };
  const bounds = dayBoundsUtc(args.date);
  if (!bounds) return { status: "error", detail: "date invalide" };

  const url = new URL(`${BASE_URL.replace(/\/+$/, "")}/v1/availability`);
  url.searchParams.set("project_ref", args.projectRef);
  url.searchParams.set("from", bounds.from);
  url.searchParams.set("until", bounds.until);

  try {
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      return { status: "error", detail: `http_${response.status}` };
    }
    const body = (await response.json()) as Record<string, unknown>;
    const raw = Array.isArray(body.slots) ? body.slots : [];
    const slots: AvailabilitySlot[] = raw
      .map((s) => s as Record<string, unknown>)
      .filter((s) => typeof s.starts_at === "string" && typeof s.ends_at === "string")
      .map((s) => ({ startsAt: String(s.starts_at), endsAt: String(s.ends_at) }));

    return {
      status: "ok",
      timezone: typeof body.timezone === "string" ? body.timezone : "Africa/Algiers",
      durationMinutes: Number(body.duration_minutes) || 30,
      slotStepMinutes: Number(body.slot_step_minutes) || undefined,
      requiresConfirmation: body.requires_confirmation !== false,
      slots,
    };
  } catch (error) {
    return { status: "error", detail: String(error).slice(0, 200) };
  }
}

/** « 2026-09-16T08:00:00.000Z » → « 09:00 » (heure d'Alger). */
export function toLocalLabel(iso: string, timezone = "Africa/Algiers"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(d);
}
